-- Henri — clean launch reset
--
-- Wipes all book data + auth accounts so the app can be handed to Dana fresh.
-- Irreversible. Run only when you're truly ready to start over.
--
-- Cascade behavior (verified against 01_schema.sql):
--   delete from babies       → caregivers, feeds, sleep_sessions, diapers,
--                              medications, doses, memories, prompts,
--                              growth_measurements, vaccinations, illnesses,
--                              family_members, milestones, audio_capsules,
--                              reminders, invitations, counsel_chats,
--                              counsel_messages — all cascade away
--   delete from auth.users   → removes any lingering caregivers not already gone
--
-- NOTE: Storage objects (memory photos + audio capsules) are NOT deleted by SQL.
-- After running this, empty the buckets manually:
--   Supabase dashboard → Storage → `memories` → ⋯ menu → Empty bucket
--   Supabase dashboard → Storage → `audio`    → ⋯ menu → Empty bucket

delete from babies;
delete from auth.users;

-- Optional: quick sanity checks after running.
-- select count(*) from babies;              -- 0
-- select count(*) from auth.users;          -- 0
-- select count(*) from caregivers;          -- 0
-- select count(*) from memories;            -- 0
-- select count(*) from counsel_chats;       -- 0
