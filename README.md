# Ausome App — v2.3 (shared family records)

Google sign-in · shared child records with co-owner/viewer roles · public sign-up.

## What's new in v2.3
- **Shared records.** Invite your co-parent as an equal co-owner, or invite a
  professional (e.g. your child's developmental pediatrician) as a read-only
  viewer. Header → Edit → **Care team** → Invite → share the link.
- **Viewer role.** Full read access to everything (notes, goals, milestones,
  assessments, chat). No add/edit/delete, and can't trigger new AI
  generations — those all save through the same write path as edits, so this
  boundary is enforced server-side, not just hidden in the UI.
- **Public sign-up.** The Google consent screen can now be published (see
  below) so anyone can create an account — not just listed test users.
- **A quiet 100-calls/day-per-family cap** on the AI proxy — an in-memory
  safety rail against a runaway bug or bot now that sign-up is open. Not a
  real quota system (resets on redeploy, no UI); adjust `DAILY_AI_CAP` in
  `server.js` or remove it if you build real usage limits later.
- **`/privacy`** — a live, auto-generated privacy policy page, required by
  Google before you can publish the consent screen. Personalize it with the
  `CONTACT_EMAIL` and `APP_NAME` variables below.
- **Migration is automatic and additive.** Existing per-user data is copied
  (not moved) into the new shared structure on next login — nothing is
  deleted; the old table stays as a backup.

## One-time setup

### 1. Postgres (Railway, ~1 min)
Project → **Create → Database → PostgreSQL**. Then on your app service →
Variables → **New Variable → Add Reference → DATABASE_URL** from the
Postgres service.

### 2. Google sign-in
1. console.cloud.google.com → create/select a project.
2. **APIs & Services → OAuth consent screen**: External → fill app name,
   support email, and developer contact.
3. **Credentials → Create credentials → OAuth client ID** → Web application.
4. Authorized redirect URI — exactly:
   `https://YOUR-APP-DOMAIN.up.railway.app/auth/google/callback`
5. Copy the Client ID and Client Secret.

### 3. Variables on the app service
- `DATABASE_URL` (reference, from step 1)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ANTHROPIC_API_KEY`
- `CONTACT_EMAIL` — a real support address; shown on the privacy page
- `APP_NAME` — optional, defaults to "Ausome App"
- `ENCRYPTION_KEY` — **generate this yourself, never share it with anyone
  (including in chat).** Run one of these on your own machine, then paste
  the output straight into Railway's Variables:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  # or:
  openssl rand -hex 32
  ```
  Without this variable, the app still works, but stores notes and scans as
  plain text in the database. With it, everything is encrypted before it's
  written and decrypted only when your app reads it back — a stolen or
  leaked database credential alone isn't enough to read the data. **If this
  key is ever lost, all encrypted data becomes permanently unreadable** —
  keep a copy somewhere safe outside Railway (a password manager, not just
  this one env var).

Redeploy. Open the app → "Continue with Google".

### 4. Publish the consent screen (so anyone can sign up)
Google requires two live pages before it will let you leave Testing mode:
- **Homepage** — your app's root URL (the login screen now describes what
  the app does, which should satisfy this)
- **Privacy Policy** — `https://YOUR-APP-DOMAIN.up.railway.app/privacy`
  (built in; personalize via `CONTACT_EMAIL`/`APP_NAME` first)

In Google Cloud Console → OAuth consent screen → Branding, fill in both
URLs, then use the **Publish App** action to move from Testing to
Production. This app only requests basic scopes (`openid email profile`),
so this is normally a self-serve toggle with no waiting period for Google's
manual review — that review is only for sensitive/restricted scopes. If
Google's console instead asks you to verify domain ownership via Search
Console before publishing, that's their standard flow for custom branding;
follow their prompts (you'll need to prove you control the domain, which
for a `railway.app` subdomain may have some friction — a custom domain on
your Railway service sidesteps this if you hit it).

## The three-generation migration, if you're curious
v1 (in-browser only) → v2 (per-account Postgres) → v2.3 (shared per-family
Postgres). Each step is additive: nothing from an earlier generation is
ever deleted, only copied forward. A legacy user's data migrates the moment
they next sign in — no manual step, no downtime.

## Notes
- Sessions last 90 days; Sign out is in the header panel.
- One family per Google account (an account can't belong to two children's
  records at once). Redeeming a second invite while already in a family is
  rejected with a clear message rather than silently overwriting anything.
- Invite links expire after 7 days and are single-use.
- You are the custodian of this data: enable Postgres backups on Railway
  (Postgres service → Settings → Backups, paid plans) and keep exporting
  JSON backups from the app as a second layer.
- Given public sign-up is now on, keep an eye on your Anthropic usage/billing
  for the first while — the daily cap is a rough backstop, not a substitute
  for watching actual spend.
