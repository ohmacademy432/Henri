-- Henri — fix: invitees cannot read their own invitation by token
--
-- Context: we removed the email field from new invitations (token is the
-- capability), but the original `invitations_select` RLS policy only let
-- people read an invitation if they were already a caregiver of the baby
-- OR their signed-in email matched the invitation email. Token-only
-- invitations have email = NULL, so new invitees hit "could not be found"
-- on the Accept screen.
--
-- The fix: a SECURITY DEFINER RPC function that returns exactly the row
-- whose token matches — no broader SELECT access is granted. Someone
-- needs to know (or guess — infeasible with random UUIDs) the token to
-- see the row.
--
-- Run in the Supabase SQL editor.

create or replace function public.invitation_by_token(_token uuid)
returns table (
  id           uuid,
  baby_id      uuid,
  display_name text,
  relationship text,
  accepted     boolean,
  expires_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select id, baby_id, display_name, relationship, accepted, expires_at
  from invitations
  where token = _token
  limit 1;
$$;

grant execute on function public.invitation_by_token(uuid) to anon, authenticated;
