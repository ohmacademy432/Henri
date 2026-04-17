# Before the next Netlify deploy — production punch list

Do these all in one sitting, right before we flip to "ready for Dana." Order doesn't matter within a group, but the groups should be done top-to-bottom.

---

## A. Netlify environment variables

**Where:** Netlify dashboard → your `henri` site → Site configuration (left sidebar) → Environment variables → "Add a variable"

Add these (values come from your local `.env.local`):

- [ ] `VITE_SUPABASE_URL` = `https://yyhzfvwbaagisraicger.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `sb_publishable_tpJfnAMr1K0TrQxX8GCyRQ__XDGqR20`

## A2. Supabase SQL migrations to run *(required)*

- [ ] In the Supabase SQL editor, run `supabase/09_invitation_3day_expiry.sql` — sets the 3-day default on `invitations.expires_at` and makes `invitations.email` nullable
- [ ] (Optional) Verify Realtime is on for `invitations` and `caregivers` — Database → Replication → supabase_realtime publication should include both tables. Default on new projects is "all tables."

## B. Supabase URL config for production

**Where:** Supabase dashboard → `henri` project → Authentication (left sidebar) → URL Configuration

- [ ] **Site URL** field: change from `http://localhost:5173` to `https://henrirobert.netlify.app`
- [ ] **Redirect URLs** list: add `https://henrirobert.netlify.app/**` (keep the localhost one too so you can still test locally)

## C. Counsel (the AI companion) *(required to use chapter vi)*

Without this, `/counsel` shows the UI but cannot actually send messages — the Edge Function will return an error.

- [ ] In your Supabase dashboard → Project Settings → Edge Functions → Secrets, add:
  - `ANTHROPIC_API_KEY` — the new key you generated (NOT the one you pasted in chat — revoke that if you haven't)
- [ ] Run `supabase/07_counsel_schema.sql` in the Supabase SQL editor (creates the `counsel_chats` and `counsel_messages` tables with RLS)
- [ ] Deploy the edge function:
  ```bash
  npx supabase login
  npx supabase link --project-ref yyhzfvwbaagisraicger   # skip if already linked
  npx supabase functions deploy counsel
  ```
- [ ] Try it locally: go to `/counsel`, pick a starter, send a message, watch a reply stream in

## E. Placeholder icons *(anytime)*

- [ ] Replace `public/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png` with real artwork (keep the filenames)

## F. Handover to Dana *(when you're ready to give her the app)*

Two options — pick one. Either works.

**Option 1 — Start fresh (simplest):**
- [ ] Dana creates her own account at the live site using her email
- [ ] She walks through Welcome to create Henri's book
- [ ] She invites you as YahYah
- [ ] Your current test data stays as a separate book under your account

**Option 2 — Transfer ownership (keeps what you've built):**
- [ ] Dana creates an account at the live site (but skips Welcome / signs out before creating a baby)
- [ ] Look up her `auth.users.id` in Supabase → Authentication → Users
- [ ] In the SQL editor, run:
  ```sql
  update babies set owner_user_id = 'DANAS_USER_ID_HERE' where name = 'Henri';
  insert into caregivers (baby_id, user_id, display_name, relationship, can_edit)
    select id, 'DANAS_USER_ID_HERE', 'Dana', 'Mother', true from babies where name = 'Henri';
  ```
- [ ] Dana signs back in — the book is hers, you remain as YahYah

---

## What's already done (no action needed)

- Authentication (magic link), invitation acceptance flow
- Welcome flow with a "not yet — on the way" path for pregnancy
- Today screen with pregnancy state
- Memory Book (prompts, suggested prompts, grid, lightbox, visibility toggle)
- Health Record (growth, vaccinations list, illnesses)
- Medications (list, detail, dose log, live countdown, reminder-row creation)
- Family Tree (tiered avatars, Henri's gold-gradient avatar)
- Invitations screen
- Settings, About
- Universal print system
- RLS on every table; storage policies scope photos by baby_id
- Service worker push handler wired through vite-plugin-pwa
- Edge Function source for push sender + invitation email sender
- CDC vaccine schedule + 80+ prompts auto-seeded per baby
- `netlify.toml`, `.gitignore`, `.npmrc` (for Netlify's strict npm install)
- First GitHub commit, Netlify auto-deploy live at https://henrirobert.netlify.app

## Still to build (if you want them)

- Audio capsules (voice notes) — the schema + storage bucket + "Voice" filter chip exist; the MediaRecorder recorder UI isn't built yet. Tell me when you want it.
