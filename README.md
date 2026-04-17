# Henri

> A luxury editorial baby journaling and health keeping book, deployed as a PWA.

## Local dev

```bash
npm install --legacy-peer-deps   # --legacy-peer-deps is needed for vite-plugin-pwa with Vite 8
cp .env.local.example .env.local # then paste your Supabase values
npm run dev                      # http://localhost:5173
npm run icons                    # regenerate the placeholder PWA icons
npm run build                    # production build into dist/
```

## What's in the repo

```
src/                     React + TypeScript app
  components/            TopBar, Card, Button, PromptCard, QuickActions, Sheet, …
  routes/                One file per screen — chapters i–v + auth + settings + print
  lib/                   supabase client, auth, book, memories, medications, push, …
  styles/                globals.css, typography.css (all styling is hand-written CSS)

public/                  static assets + sw-push.js + placeholder PNG icons
supabase/                SQL migrations + Edge Function source
  01_schema.sql          tables + indexes
  02_policies.sql        RLS on every table
  03_seed_vaccines.sql   CDC schedule + trigger
  04_seed_prompts.sql    80+ age-windowed prompts
  05_fix_seed_rls.sql    SECURITY DEFINER fix for the seed trigger
  06_reminder_cron.sql   pg_cron schedule for the push-sender edge function
  functions/
    send-due-reminders/  dose-due web push sender
    counsel/             streaming chat proxy to Claude (chapter vi)

netlify.toml             build + SPA routing + cache headers
vite.config.ts           Vite + vite-plugin-pwa (manifest, workbox, push SW)
```

## Deploy to Netlify via GitHub

```bash
git init
git add .
git commit -m "Initial Henri build"
gh repo create henri --private --source=. --push
```

In Netlify:

1. Add new site → Import from Git → select `henri`
2. Build settings auto-detect from `netlify.toml`
3. Site settings → Environment variables — add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY` (see below)

Deploy. Every subsequent `git push` triggers a fresh deploy.

After the first deploy, go back to **Supabase → Authentication → URL Configuration**:

- Set **Site URL** to your Netlify URL (e.g. `https://henrirobert.netlify.app`)
- Keep `http://localhost:5173/**` and add `https://henrirobert.netlify.app/**` in **Redirect URLs**

## Medication & vaccine reminders

Each medication (next-dose) and each upcoming vaccine (due-at) has a small gold "Remind me" button. Tapping it builds a single-event `.ics` file on the fly and hands it to the device's calendar app — Apple Calendar on iOS, Google Calendar or the default on Android, Outlook/Apple Calendar on desktop. The phone owns the alarm from then on.

No VAPID keys, no push subscription, no service-worker push handler, no edge function to deploy. Works identically on iOS Safari, Android Chrome, and desktop.

## Invitations

The invitations table and UI create a private 30-day token link. There is no email step — the owner fills in name + relationship, clicks "Create invitation link," and the link is copied to their clipboard to text or message directly. Links always point to `https://henrirobert.netlify.app/accept/:token` regardless of the environment they were created in.

## Icons

`npm run icons` regenerates `public/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, and `apple-touch-icon.png` — a plain "H" in a cream square with a gold border. Replace with real artwork whenever you're ready; keep the filenames the same.
