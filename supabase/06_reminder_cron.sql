-- Henri — schedule the send-due-reminders edge function to run every minute.
-- Requires pg_cron and pg_net extensions, both enabled by default on Supabase.
--
-- IMPORTANT: replace the URL below with your project's edge function URL
-- (Project Settings → Edge Functions → send-due-reminders) and SUPABASE_ANON_KEY
-- with your project's service role key (kept inside Supabase, not the client).

-- Enable extensions if not already on.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any prior schedule so re-running is safe.
do $$ begin perform cron.unschedule('henri_due_reminders'); exception when others then null; end $$;

select cron.schedule(
  'henri_due_reminders',
  '* * * * *',  -- every minute
  $$
    select net.http_post(
      url := current_setting('app.settings.edge_url') || '/send-due-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_key'),
        'Content-Type',  'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Set the two GUCs once on the database (Supabase → Database → Settings → Custom GUCs).
-- Or set them per-session before scheduling:
--   alter database postgres set app.settings.edge_url = 'https://<ref>.functions.supabase.co';
--   alter database postgres set app.settings.service_key = '<service-role-key>';
