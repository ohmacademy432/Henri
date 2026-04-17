# What's left for you

Everything that needed your hands is here. Read top to bottom.

---

## 1. Restart the dev server

The Vite config changed (PWA plugin + icons). Stop `npm run dev` with **Ctrl-C**, then:

```bash
npm run dev
```

Then click through what's new:

- `/today` — unchanged (the quiet pulse)
- `/memories` — Today's prompt + suggested prompts list + the pages so far
- `/health` — growth, vaccinations (auto-seeded), illness log, "Prepare a pediatric visit"
- `/medications` — empty state invites you to add the first; if you add one, the dark card with live countdown shows up
- `/family` — add Henri's people; Henri gets a gold avatar
- `/print` — choose sections (cover, recent days, health, medications, memories, family) and print or save as PDF
- `/invitations` — invite YahYah and anyone else; copy link if email isn't set up yet
- Hamburger menu → Settings → Sign out, toggles, and birth-date add-later form
- Hamburger menu → About this book

---

## 2. Run one more SQL migration

Paste `supabase/05_fix_seed_rls.sql` into the SQL editor if you haven't yet (you ran this earlier when we hit the RLS error — if Welcome worked, you've done it, skip this step).

Nothing else to run for core app function.

---

## 3. Push the whole thing to GitHub + connect to Netlify

```bash
git init
git add .
git commit -m "Initial Henri build"
gh repo create henri --private --source=. --push
```

Then on netlify.com:

1. **Add new site → Import from Git** → select the `henri` repo
2. Build settings auto-detect from `netlify.toml`
3. **Site settings → Environment variables** — add two (for now):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

After the first deploy, update **Supabase → Authentication → URL Configuration**:

- **Site URL**: your Netlify URL (e.g. `https://henrirobert.netlify.app`)
- **Redirect URLs**: add `https://henrirobert.netlify.app/**` (keep `http://localhost:5173/**` too)

---

## 4. Turn on Web Push for medication reminders (optional but recommended)

1. Generate keys once:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Put the **public** key into:
   - `.env.local` as `VITE_VAPID_PUBLIC_KEY=...`
   - Netlify env vars as the same
3. Put both keys into **Supabase → Project Settings → Edge Functions → Secrets**:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` = `mailto:dana@example.com`
4. Install the Supabase CLI if you haven't, then:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-ref>
   npx supabase functions deploy send-due-reminders
   ```
5. Schedule it — open `supabase/06_reminder_cron.sql`, update the two `ALTER DATABASE` lines with your actual edge function URL and service role key, run it.

Now when a dose is logged, a reminder row is created. One minute after it comes due, every caregiver with `notify_meds = true` and a push subscription gets a notification.

**On your iPhone:** web push only works when the app is installed to Home Screen. Open the site in Safari → Share → Add to Home Screen. Then open from the Home Screen icon and go to Settings → "Notify me for medication doses" to subscribe.

---

## 5. Turn on invitation emails (optional)

The invitations screen already works — it creates an invitation row and gives you a "Copy invitation link" button so you can share manually via text or messenger. If you want branded emails sent automatically:

1. Sign up at <https://resend.com> (free tier: 100/day, 3k/month)
2. Get an API key; verify a sender domain or use `onboarding@resend.dev` for testing
3. **Supabase → Edge Functions → Secrets**:
   - `RESEND_API_KEY`
   - `FROM_EMAIL` = `Henri <henri@yourdomain.com>` (or a resend.dev sender)
   - `APP_URL` = your Netlify URL
4. Deploy:
   ```bash
   npx supabase functions deploy send-invitation
   ```

---

## 6. Replace the placeholder icons (anytime)

`public/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png` are generic placeholders — a cream "H" with a gold border. Drop in real artwork whenever you have it; keep the filenames.

---

## What's genuinely done (no action needed)

- Authentication (magic link), invitation acceptance flow
- Welcome flow with a "not yet — on the way" path for pregnancy
- Today (greeting, last-recorded cards, prediction card, empty states for pregnancy)
- Memory Book (list, new, detail, lightbox, visibility toggle, curated prompt suggestions)
- Chapter iii — Health Record (growth, vaccinations list, illnesses, log sheets)
- Chapter iv — Medications (list, detail, dose log, live countdown, reminder-row creation)
- Chapter v — Family Tree (tiered avatars, Henri's gold-gradient avatar, member detail)
- Invitations screen (owner-only sending, pending + active, revoke)
- Settings (toggles, birth-date-add-later, sign out)
- About page
- **Universal print system** — pick any sections, any date range, save as PDF or print
- RLS on every table; storage policies scope photos by baby_id
- Service worker push handler (`public/sw-push.js`) wired through vite-plugin-pwa
- Edge Function source for push sender + invitation email sender
- CDC vaccine schedule + 80+ prompts auto-seeded per baby
- `netlify.toml`, `.gitignore` correctly excluding `.env.local`

## Things I left as clear TODOs (mentioned above)

- VAPID keys (you generate, deployment)
- Edge Function deployments (both)
- Production Supabase Site URL swap
- Real icons when you have them
- Audio capsules (voice notes) — the schema + storage bucket exist but the recorder UI isn't built yet. The "Voice" filter chip in the Memory Book is ready to light up as soon as we build it. Tell me when you want this.
