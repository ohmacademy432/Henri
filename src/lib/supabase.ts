import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  // Helpful error when env vars are missing instead of a silent 404 later.
  console.warn(
    '[henri] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. ' +
    'Copy .env.local.example to .env.local and fill them in from the Supabase dashboard.'
  );
}

export const supabase = createClient(url ?? 'http://placeholder', key ?? 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(url && key && !url.includes('placeholder'));
