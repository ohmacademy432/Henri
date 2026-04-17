# Supabase setup for Henri

Five steps, all in the Supabase dashboard. Takes about 5 minutes.

## 1. Create the project

1. Go to <https://supabase.com/dashboard> → **New project**
2. Name: `henri`
3. Region: whichever is closest to you
4. Save the database password somewhere safe

## 2. Run the SQL, in order

Open **SQL Editor** → **New query**. Paste and run each of these files **in order**:

1. `supabase/01_schema.sql`   — all tables and indexes
2. `supabase/02_policies.sql` — row-level security rules
3. `supabase/04_seed_prompts.sql` — the prompt library (creates the function)
4. `supabase/03_seed_vaccines.sql` — the CDC vaccine schedule + baby-insert trigger

> Run `04` before `03` only because the trigger in `03` references the function defined in `04`. If you accidentally flip them, re-run `03` last.

## 3. Create storage buckets

**Storage** → **New bucket**:

| Name       | Public? | Size limit | MIME types |
| ---------- | ------- | ---------- | ----------- |
| `memories` | no      | 10 MB      | `image/jpeg`, `image/png`, `image/webp` |
| `audio`    | no      | 10 MB      | `audio/mpeg`, `audio/wav`, `audio/webm` |

## 4. Set the auth redirect URLs

**Project Settings → Authentication → URL Configuration**

- **Site URL**: for now, `http://localhost:5173` — update to your Netlify URL after deploy
- **Redirect URLs**: add both `http://localhost:5173/**` and your Netlify URL with `/**`

## 5. Copy your project keys into `.env.local`

**Project Settings → API**. Copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

```bash
cp .env.local.example .env.local
# then edit .env.local and paste the two values
```

Restart the Vite dev server after editing env vars.

---

When all five steps are done, tell Claude "Supabase is ready" and we'll wire up real auth.
