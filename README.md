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
    send-invitation/     invitation email sender (Resend)

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

## Web Push reminders (medications)

The client subscription + service worker handler are done. You still need to:

1. **Generate VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Paste the **public** key into:
   - Local: `.env.local` as `VITE_VAPID_PUBLIC_KEY=...`
   - Netlify env vars: `VITE_VAPID_PUBLIC_KEY`

3. Paste both keys into **Supabase → Project Settings → Edge Functions → Secrets**:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (e.g. `mailto:you@example.com`)

4. Deploy the edge function:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-ref>
   npx supabase functions deploy send-due-reminders
   ```

5. Schedule it: run `supabase/06_reminder_cron.sql` in the SQL editor (after setting the two GUCs at the top — see the comments in that file).

**iOS caveat:** web push only works when the app is installed to the Home Screen. Settings shows a nudge to do this when relevant.

## Invitation emails

The invitations table and UI are working; an invitation creates a row and copies/shares the link. To send branded emails automatically, deploy the second edge function:

1. Sign up at <https://resend.com> (free tier: 100 emails/day)
2. Verify a sender domain or use the shared `onboarding@resend.dev` sender for testing
3. **Supabase → Edge Functions → Secrets**:
   - `RESEND_API_KEY`
   - `FROM_EMAIL` (e.g. `Henri <henri@yourdomain.com>`)
   - `APP_URL` (e.g. `https://henrirobert.netlify.app`)
4. Deploy:
   ```bash
   npx supabase functions deploy send-invitation
   ```

## Icons

`npm run icons` regenerates `public/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, and `apple-touch-icon.png` — a plain "H" in a cream square with a gold border. Replace with real artwork whenever you're ready; keep the filenames the same.
