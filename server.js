// Railway server — serves the built app and proxies AI calls.
// Set ANTHROPIC_API_KEY in Railway → your service → Variables.

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "8mb" })); // scanned images arrive as base64

app.post("/api/claude", async (req, res) => {
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

// serve the built frontend
const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Development Tracker running on :${port}`));
