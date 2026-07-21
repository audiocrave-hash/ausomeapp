// Railway server — Google sign-in, per-account Postgres storage, gated AI proxy.
// Required variables: DATABASE_URL (from the Postgres add-on),
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ANTHROPIC_API_KEY.
// Optional: APP_URL (e.g. https://yourapp.up.railway.app) if auto-detection misbehaves.

import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "8mb" }));

const DB_URL = process.env.DATABASE_URL || "";
const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: DB_URL && !DB_URL.includes(".railway.internal") && !DB_URL.includes("localhost")
    ? { rejectUnauthorized: false } : false,
});

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY, google_sub TEXT UNIQUE NOT NULL,
    email TEXT, name TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sessions(
    token TEXT PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS kv(
    user_id INT REFERENCES users(id) ON DELETE CASCADE, key TEXT, value TEXT,
    PRIMARY KEY(user_id, key))`);
  console.log("DB ready");
}
init().catch((e) => console.error("DB init failed — is Postgres attached and DATABASE_URL set?", e.message));

/* ---------- helpers ---------- */
const cookies = (req) => Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((c) => {
  const i = c.indexOf("="); return i < 0 ? [c.trim(), ""] : [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
}));
const secure = process.env.NODE_ENV !== "development";
const setCookie = (res, name, val, maxAgeSec) =>
  res.append("Set-Cookie", `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? "; Secure" : ""}`);
const appUrl = (req) => process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

async function requireAuth(req, res, next) {
  try {
    const sid = cookies(req).sid;
    if (!sid) return res.status(401).json({ error: "not signed in" });
    const r = await pool.query(
      "SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1 AND s.expires_at > now()",
      [sid]);
    if (!r.rows.length) return res.status(401).json({ error: "not signed in" });
    req.user = r.rows[0];
    next();
  } catch { return res.status(401).json({ error: "not signed in" }); }
}

/* ---------- Google sign-in ---------- */
app.get("/auth/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(500).send("GOOGLE_CLIENT_ID not set");
  const state = crypto.randomBytes(16).toString("hex");
  setCookie(res, "gstate", state, 600);
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", appUrl(req) + "/auth/google/callback");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  res.redirect(u.toString());
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== cookies(req).gstate)
      return res.status(400).send("Sign-in failed (state mismatch). Go back and try again.");
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: appUrl(req) + "/auth/google/callback",
      }),
    });
    const tok = await tr.json();
    if (!tok.id_token) return res.status(400).send("Sign-in failed (no token). Check GOOGLE_CLIENT_SECRET and the redirect URI in Google Cloud.");
    const info = JSON.parse(Buffer.from(tok.id_token.split(".")[1], "base64url").toString());
    const up = await pool.query(
      `INSERT INTO users(google_sub, email, name) VALUES($1,$2,$3)
       ON CONFLICT (google_sub) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
       RETURNING id`, [info.sub, info.email || "", info.name || ""]);
    const sid = crypto.randomBytes(32).toString("hex");
    await pool.query("INSERT INTO sessions(token, user_id, expires_at) VALUES($1,$2, now() + interval '90 days')", [sid, up.rows[0].id]);
    setCookie(res, "sid", sid, 90 * 24 * 3600);
    res.redirect("/");
  } catch (e) {
    console.error("callback error", e);
    res.status(500).send("Sign-in failed. Check the server logs.");
  }
});

app.post("/auth/logout", async (req, res) => {
  const sid = cookies(req).sid;
  if (sid) await pool.query("DELETE FROM sessions WHERE token = $1", [sid]).catch(() => {});
  setCookie(res, "sid", "", 0);
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => res.json({ user: req.user }));

/* ---------- per-account data (key-value) ---------- */
app.get("/api/kv/:key", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT value FROM kv WHERE user_id = $1 AND key = $2", [req.user.id, req.params.key]);
  res.json({ value: r.rows.length ? r.rows[0].value : null });
});
app.put("/api/kv/:key", requireAuth, async (req, res) => {
  const { value } = req.body || {};
  if (typeof value !== "string") return res.status(400).json({ error: "value must be a string" });
  await pool.query(
    `INSERT INTO kv(user_id, key, value) VALUES($1,$2,$3)
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
    [req.user.id, req.params.key, value]);
  res.json({ ok: true });
});
app.delete("/api/kv/:key", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM kv WHERE user_id = $1 AND key = $2", [req.user.id, req.params.key]);
  res.json({ ok: true });
});

/* ---------- AI proxy (signed-in users only) ---------- */
app.post("/api/claude", requireAuth, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  const { content, max_tokens } = req.body || {};
  if (!content) return res.status(400).json({ error: "missing content" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: Math.min(Number(max_tokens) || 1600, 4000),
        messages: [{ role: "user", content }],
      }),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch {
    return res.status(502).json({ error: "upstream error" });
  }
});

/* ---------- static frontend ---------- */
const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Development Tracker running on :${port}`));
