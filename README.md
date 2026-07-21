# Development Tracker — Railway deployment

A private progress tracker for your child's therapy team. Notes, goals,
CDC milestones, scan-a-note (Claude vision), AI assessment, and
home/school activity suggestions.

## Privacy model
- **All child data (notes, images, goals) stays on the device** in the
  browser's IndexedDB. Nothing is uploaded or synced to the server.
- The only data that leaves the device is what you send during the three
  AI actions (Scan, Assessment, Activities), which go through `/api/claude`
  on this server, which holds your Anthropic API key. The key is never
  exposed to the browser.
- Consequence of on-device storage: data does not follow you across
  devices/browsers, and clearing site data erases it.

## Deploy on Railway (~10 minutes)
1. Get an API key at console.anthropic.com (Settings → API Keys).
2. Push this folder to a GitHub repo.
3. Railway → **New Project → Deploy from GitHub repo** → pick the repo.
   Railway auto-detects Node and runs `npm install && npm run build`
   then `npm start` (see `railway.json`).
4. In the service → **Variables** → add `ANTHROPIC_API_KEY` = your key.
5. **Settings → Networking → Generate Domain** to get your public URL.

## Local development
```bash
npm install
npm run build && npm start   # full app + API on http://localhost:3000
# or `npm run dev` for hot reload of the UI only (AI calls need the server)
```

## Costs
Railway hobby plan credit comfortably covers this. AI calls are
pay-per-use on your Anthropic key — typically a few cents per
scan/assessment/generation.

## Recommended hardening (optional)
- Set a spending limit on your Anthropic key (console.anthropic.com).
- Anyone with the URL can open the app (they can't see your data — it's
  on your device — but they could use your AI proxy). If that matters,
  add an access password or IP allowlist in front of the service.
