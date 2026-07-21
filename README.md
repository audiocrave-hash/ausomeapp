# Development Tracker — v2 (accounts)

Google sign-in · per-account data in Postgres · same data on any device.

## What changed from v1
- Sign in with Google; each parent gets their own private data space.
- Notes, scans, goals, milestones, chat now live in YOUR Postgres
  (Railway add-on) instead of the browser — so they follow the account.
- The AI proxy now requires sign-in (nobody can burn your API credits).
- First sign-in on a device that has old v1 data automatically imports it
  into the account (or use Restore backup with your JSON file).

## One-time setup

### 1. Postgres (Railway, ~1 min)
Project → **Create → Database → PostgreSQL**. Then on your app service →
Variables → **New Variable → Add Reference → DATABASE_URL** from the
Postgres service.

### 2. Google sign-in (~5 min)
1. console.cloud.google.com → create/select a project.
2. **APIs & Services → OAuth consent screen**: External → fill app name +
   your email → add yourself (and your spouse) under Test users → save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   → type **Web application**.
4. Authorized redirect URI — exactly:
   `https://YOUR-APP-DOMAIN.up.railway.app/auth/google/callback`
5. Copy the Client ID and Client Secret.

### 3. Variables on the app service
- `DATABASE_URL`  (reference, from step 1)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ANTHROPIC_API_KEY` (you already have this)

Redeploy. Open the app → "Continue with Google".

## Data migration from v1
Open the app **in the same browser you used for the pilot** and sign in —
your old on-device data is imported into the account automatically (only
if the account is still empty). Alternatively: header → Edit → Restore
backup with your backup JSON.

## Notes
- Consent screen in "Testing" mode allows only listed test users — perfect
  for a family pilot. Publish it later for a SaaS.
- Sessions last 90 days; Sign out is in the header panel.
- You are now the custodian of this data: enable backups on the Postgres
  service (Railway does daily backups on paid plans) and keep exporting
  JSON backups from the app.
