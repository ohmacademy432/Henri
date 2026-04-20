-- Henri — wipe all user data and let Dana start from scratch.
-- DESTRUCTIVE. Run this in the Supabase SQL Editor when you're ready to reset.
--
-- What this does:
--   Deletes every row from `babies` — which, because every content table
--   has `baby_id ... on delete cascade`, wipes feeds, sleep_sessions,
--   diapers, medications (→ doses), growth_measurements, vaccinations,
--   illnesses, memories, prompts, audio_capsules, family_members,
--   milestones, reminders, invitations, and caregivers.
--   Caregiver rows cascade into counsel_chats → counsel_messages.
--
-- What this does NOT do (do these separately — see notes below):
--   1. Delete Supabase Auth users. See the optional block at the bottom.
--   2. Delete photos/audio files from Storage buckets. See notes below.

begin;

-- One call, cascades do the rest.
delete from babies;

-- Defensive: catch anything not tied to a baby (shouldn't exist, but
-- if schema drift ever leaves an orphan row, this cleans it).
delete from caregivers;
delete from counsel_messages;
delete from counsel_chats;
delete from invitations;

commit;

-- Verify (should all return 0):
select
  (select count(*) from babies)              as babies,
  (select count(*) from caregivers)          as caregivers,
  (select count(*) from invitations)         as invitations,
  (select count(*) from memories)            as memories,
  (select count(*) from feeds)               as feeds,
  (select count(*) from sleep_sessions)      as sleep,
  (select count(*) from diapers)             as diapers,
  (select count(*) from medications)         as medications,
  (select count(*) from doses)               as doses,
  (select count(*) from growth_measurements) as growth,
  (select count(*) from vaccinations)        as vaccinations,
  (select count(*) from illnesses)           as illnesses,
  (select count(*) from family_members)      as family,
  (select count(*) from milestones)          as milestones,
  (select count(*) from audio_capsules)      as audio,
  (select count(*) from reminders)           as reminders,
  (select count(*) from counsel_chats)       as counsel_chats,
  (select count(*) from counsel_messages)    as counsel_messages;

-- ─────────────────────────────────────────────────────────────────────
-- OPTIONAL: also delete all Auth users so emails are fully freed up.
-- Preferred path is the dashboard (Authentication → Users → select all →
-- delete). If you'd rather do it in SQL, uncomment:
--
-- delete from auth.users;
--
-- Note: this will also invalidate any currently-signed-in sessions.
-- ─────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────
-- STORAGE (photos & audio): this SQL doesn't touch Storage. To clear
-- uploaded files, go to Supabase dashboard → Storage → open each bucket
-- (e.g. `memories`, `family`, `audio`) → select all → delete.
-- After the wipe above, those files are orphaned; Storage doesn't
-- cascade-delete with Postgres rows.
-- ─────────────────────────────────────────────────────────────────────
