// Railway server — Google sign-in, shared-family Postgres storage, gated AI proxy.
// Required variables: DATABASE_URL (from the Postgres add-on),
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ANTHROPIC_API_KEY.
// Optional: APP_URL (e.g. https://yourapp.up.railway.app), CONTACT_EMAIL, APP_NAME.

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

/* ---------- application-level encryption for stored data ---------- */
// ENCRYPTION_KEY must be a 64-character hex string (32 bytes) — generate it
// yourself and paste it directly into Railway's Variables; never share it
// in chat or commit it to the repo. Values already in the DB before this was
// enabled are plain text and are auto-encrypted the moment they're next read
// or written; see the boot-time sweep in init() for a one-time pass over the rest.
const rawKey = process.env.ENCRYPTION_KEY || "";
const ENC_KEY = /^[0-9a-f]{64}$/i.test(rawKey) ? Buffer.from(rawKey, "hex") : null;
if (rawKey && !ENC_KEY) console.error("ENCRYPTION_KEY is set but isn't a valid 64-character hex string — encryption is DISABLED until this is fixed.");
if (!rawKey) console.warn("ENCRYPTION_KEY not set — data will be stored in plain text. See README.");

function encryptValue(plaintext) {
  if (!ENC_KEY) throw new Error("encryption not configured");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return "enc1:" + Buffer.concat([iv, tag, enc]).toString("base64");
}
function decryptValue(stored) {
  if (typeof stored !== "string" || !stored.startsWith("enc1:")) return stored; // legacy plaintext, pass through as-is
  if (!ENC_KEY) throw new Error("encryption not configured — cannot read encrypted data without ENCRYPTION_KEY");
  const raw = Buffer.from(stored.slice(5), "base64");
  const iv = raw.subarray(0, 12), tag = raw.subarray(12, 28), enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

async function init() {
  // Original tables — left exactly as-is. kv is never written to going forward;
  // it survives untouched as an automatic backup of pre-sharing data.
  await pool.query(`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY, google_sub TEXT UNIQUE NOT NULL,
    email TEXT, name TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sessions(
    token TEXT PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS kv(
    user_id INT REFERENCES users(id) ON DELETE CASCADE, key TEXT, value TEXT,
    PRIMARY KEY(user_id, key))`);

  // New: shared families ("child records"), memberships, invite links, and the
  // shared data store. All additive — nothing above is altered or dropped.
  await pool.query(`CREATE TABLE IF NOT EXISTS families(
    id SERIAL PRIMARY KEY, name TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS family_members(
    family_id INT REFERENCES families(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner','viewer')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(family_id, user_id))`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS one_family_per_user ON family_members(user_id)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS invites(
    token TEXT PRIMARY KEY,
    family_id INT REFERENCES families(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner','viewer')),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_by INT REFERENCES users(id),
    used_at TIMESTAMPTZ)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS family_kv(
    family_id INT REFERENCES families(id) ON DELETE CASCADE, key TEXT, value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(family_id, key))`);
  console.log("DB ready");

  if (ENC_KEY) {
    const plain = await pool.query("SELECT family_id, key, value FROM family_kv WHERE value NOT LIKE 'enc1:%'");
    for (const row of plain.rows) {
      await pool.query("UPDATE family_kv SET value = $1 WHERE family_id = $2 AND key = $3",
        [encryptValue(row.value), row.family_id, row.key]);
    }
    if (plain.rows.length) console.log(`Encrypted ${plain.rows.length} pre-existing row(s) on boot.`);
  }
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
const APP_NAME = process.env.APP_NAME || "Ausome App";
const CONTACT = process.env.CONTACT_EMAIL || "(add a support email via CONTACT_EMAIL)";

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

// Resolves the caller's family + role. Does NOT auto-provision — a user with
// no membership yet gets family: null, and the client explicitly calls
// /api/family/ensure or redeems an invite before doing anything else.
async function loadFamily(req, res, next) {
  const r = await pool.query("SELECT family_id, role FROM family_members WHERE user_id = $1", [req.user.id]);
  req.family = r.rows.length ? { id: r.rows[0].family_id, role: r.rows[0].role } : null;
  next();
}
function requireFamily(req, res, next) {
  if (!req.family) return res.status(409).json({ error: "no family yet" });
  next();
}
function requireOwner(req, res, next) {
  if (!req.family || req.family.role !== "owner") return res.status(403).json({ error: "owner only" });
  next();
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

app.get("/api/me", requireAuth, loadFamily, (req, res) => res.json({ user: req.user, family: req.family }));

/* ---------- family provisioning + invites ---------- */

// Idempotent: creates a solo family for a user with none, migrating any of
// their pre-sharing kv rows into it. No-op if they already have a family.
app.post("/api/family/ensure", requireAuth, loadFamily, async (req, res) => {
  if (req.family) return res.json({ family: req.family });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const fam = await client.query("INSERT INTO families(name) VALUES(NULL) RETURNING id");
    const familyId = fam.rows[0].id;
    await client.query("INSERT INTO family_members(family_id, user_id, role) VALUES($1,$2,'owner')", [familyId, req.user.id]);
    // migrate legacy per-user data, if any, into the new shared store
    const legacy = await client.query("SELECT key, value FROM kv WHERE user_id = $1", [req.user.id]);
    for (const row of legacy.rows) {
      const stored = ENC_KEY ? encryptValue(row.value) : row.value;
      await client.query(
        "INSERT INTO family_kv(family_id, key, value) VALUES($1,$2,$3) ON CONFLICT (family_id, key) DO NOTHING",
        [familyId, row.key, stored]);
    }
    await client.query("COMMIT");
    res.json({ family: { id: familyId, role: "owner" } });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("ensure family failed", e);
    res.status(500).json({ error: "could not set up family" });
  } finally { client.release(); }
});

app.post("/api/invite", requireAuth, loadFamily, requireOwner, async (req, res) => {
  const role = req.body?.role === "viewer" ? "viewer" : "owner";
  const token = crypto.randomBytes(20).toString("hex");
  await pool.query(
    "INSERT INTO invites(token, family_id, role, created_by, expires_at) VALUES($1,$2,$3,$4, now() + interval '7 days')",
    [token, req.family.id, role, req.user.id]);
  res.json({ token, role, url: appUrl(req) + "/invite/" + token, expiresInDays: 7 });
});

app.post("/api/invite/redeem/:token", requireAuth, loadFamily, async (req, res) => {
  const inv = await pool.query(
    "SELECT * FROM invites WHERE token = $1 AND used_at IS NULL AND expires_at > now()", [req.params.token]);
  if (!inv.rows.length) return res.status(410).json({ error: "This invite link is invalid or has expired." });
  const invite = inv.rows[0];
  if (req.family) {
    if (req.family.id === invite.family_id) return res.json({ family: req.family, already: true });
    return res.status(409).json({ error: "Your account is already linked to a different child's record." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO family_members(family_id, user_id, role) VALUES($1,$2,$3)", [invite.family_id, req.user.id, invite.role]);
    await client.query("UPDATE invites SET used_by = $1, used_at = now() WHERE token = $2", [req.user.id, req.params.token]);
    await client.query("COMMIT");
    res.json({ family: { id: invite.family_id, role: invite.role } });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("redeem failed", e);
    res.status(500).json({ error: "could not join" });
  } finally { client.release(); }
});

app.get("/api/family/members", requireAuth, loadFamily, requireFamily, async (req, res) => {
  const r = await pool.query(
    "SELECT u.name, u.email, m.role, m.joined_at FROM family_members m JOIN users u ON u.id = m.user_id WHERE m.family_id = $1 ORDER BY m.joined_at",
    [req.family.id]);
  res.json({ members: r.rows });
});

/* ---------- shared per-family data (key-value) ---------- */
app.get("/api/kv/:key", requireAuth, loadFamily, requireFamily, async (req, res) => {
  const r = await pool.query("SELECT value FROM family_kv WHERE family_id = $1 AND key = $2", [req.family.id, req.params.key]);
  if (!r.rows.length) return res.json({ value: null });
  try { res.json({ value: decryptValue(r.rows[0].value) }); }
  catch (e) { console.error("decrypt failed for", req.params.key, e.message); res.status(500).json({ error: "Server misconfigured: cannot read encrypted data (check ENCRYPTION_KEY)." }); }
});
app.put("/api/kv/:key", requireAuth, loadFamily, requireFamily, requireOwner, async (req, res) => {
  const { value } = req.body || {};
  if (typeof value !== "string") return res.status(400).json({ error: "value must be a string" });
  let stored;
  try { stored = ENC_KEY ? encryptValue(value) : value; }
  catch (e) { return res.status(500).json({ error: "Server misconfigured: ENCRYPTION_KEY not set." }); }
  await pool.query(
    `INSERT INTO family_kv(family_id, key, value, updated_at) VALUES($1,$2,$3, now())
     ON CONFLICT (family_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [req.family.id, req.params.key, stored]);
  res.json({ ok: true });
});
app.delete("/api/kv/:key", requireAuth, loadFamily, requireFamily, requireOwner, async (req, res) => {
  await pool.query("DELETE FROM family_kv WHERE family_id = $1 AND key = $2", [req.family.id, req.params.key]);
  res.json({ ok: true });
});

/* ---------- AI proxy (signed-in family members; light per-family daily cap) ---------- */
const aiUsage = new Map(); // familyId -> { count, day }
const DAILY_AI_CAP = 100;
function underCap(familyId) {
  const today = new Date().toISOString().slice(0, 10);
  const u = aiUsage.get(familyId);
  if (!u || u.day !== today) { aiUsage.set(familyId, { count: 1, day: today }); return true; }
  if (u.count >= DAILY_AI_CAP) return false;
  u.count += 1;
  return true;
}

app.post("/api/claude", requireAuth, loadFamily, requireFamily, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  if (!underCap(req.family.id))
    return res.status(429).json({ error: "Daily AI limit reached for this account. Try again tomorrow." });
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

/* ---------- public pages required for Google OAuth publishing ---------- */
app.get("/privacy", (_req, res) => {
  res.type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy — ${APP_NAME}</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:680px;margin:0 auto;padding:2.5rem 1.25rem;line-height:1.6;color:#132E32;background:#F7FAF9}
h1{font-size:1.5rem}h2{font-size:1.05rem;margin-top:2rem}
a{color:#0F766E}</style></head><body>
<h1>Privacy Policy</h1>
<p><em>Last updated: ${new Date().toISOString().slice(0, 10)}</em></p>
<p>${APP_NAME} is a private tool for families to track a child's therapy and developmental progress, and to coordinate with their care team.</p>

<h2>What we collect</h2>
<p>When you sign in with Google, we receive your name and email address to identify your account — nothing else from your Google account is accessed. The content you and anyone you invite add to the app is stored on our servers: session notes, scanned images of written notes, goals, developmental milestone checklists, formal assessment scores, and questions asked through the in-app AI assistant. This may include health-related information about a minor, entered by their parent, guardian, or care team.</p>

<h2>How it's used</h2>
<p>Your account's data is used only to show your family's own records back to you and the people you explicitly invite. When you use an AI-assisted feature (scanning a note, generating a progress summary, asking the assistant a question, or similar), the relevant content is sent to Anthropic's Claude API to produce that response, governed by Anthropic's own privacy terms.</p>

<h2>Sharing</h2>
<p>Data is visible only to members of your family's record — the account owner(s) and anyone an owner has invited as a co-owner or viewer. We do not sell data or share it with third parties for advertising.</p>

<h2>Deletion</h2>
<p>To request deletion of your account or your family's data, contact ${CONTACT}. This is currently handled manually.</p>

<h2>Children's data</h2>
<p>Information about a minor is entered voluntarily by their parent or guardian to support that child's care coordination, and is not used for any other purpose.</p>

<h2>Contact</h2>
<p>Questions about this policy: ${CONTACT}</p>
</body></html>`);
});

/* ---------- static frontend ---------- */
const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Ausome App running on :${port}`));
