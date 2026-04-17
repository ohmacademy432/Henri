-- Henri — invitation refinements:
--   1. Expiration default becomes 3 days (was 30)
--   2. Email is no longer required (the token alone is the capability)
--
-- Run in the Supabase SQL editor after 01–08.

alter table invitations
  alter column expires_at set default (now() + interval '3 days');

alter table invitations
  alter column email drop not null;

-- Note: existing rows keep their original expires_at and email values.
-- This migration only affects defaults for NEW invitations.
