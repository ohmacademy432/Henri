-- Henri — Row Level Security policies
-- Run after 01_schema.sql.

-- Helper: is the current user a caregiver for a given baby?
create or replace function public.is_caregiver(_baby_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from caregivers
    where caregivers.baby_id = _baby_id
      and caregivers.user_id = auth.uid()
  );
$$;

-- Helper: the caregiver-ids of the current user
create or replace function public.my_caregiver_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from caregivers where user_id = auth.uid();
$$;

-- Enable RLS --------------------------------------------------------
alter table babies              enable row level security;
alter table caregivers          enable row level security;
alter table invitations         enable row level security;
alter table feeds               enable row level security;
alter table sleep_sessions      enable row level security;
alter table diapers             enable row level security;
alter table medications         enable row level security;
alter table doses               enable row level security;
alter table growth_measurements enable row level security;
alter table vaccinations        enable row level security;
alter table illnesses           enable row level security;
alter table memories            enable row level security;
alter table prompts             enable row level security;
alter table audio_capsules      enable row level security;
alter table family_members      enable row level security;
alter table milestones          enable row level security;
alter table reminders           enable row level security;

-- Babies ------------------------------------------------------------
drop policy if exists babies_select on babies;
create policy babies_select on babies for select
  using (is_caregiver(id) or owner_user_id = auth.uid());

drop policy if exists babies_insert on babies;
create policy babies_insert on babies for insert
  with check (owner_user_id = auth.uid());

drop policy if exists babies_update on babies;
create policy babies_update on babies for update
  using (is_caregiver(id))
  with check (is_caregiver(id));

drop policy if exists babies_delete on babies;
create policy babies_delete on babies for delete
  using (owner_user_id = auth.uid());

-- Caregivers --------------------------------------------------------
drop policy if exists caregivers_select on caregivers;
create policy caregivers_select on caregivers for select
  using (user_id = auth.uid() or is_caregiver(baby_id));

drop policy if exists caregivers_insert on caregivers;
create policy caregivers_insert on caregivers for insert
  with check (
    user_id = auth.uid() or is_caregiver(baby_id)
  );

drop policy if exists caregivers_update on caregivers;
create policy caregivers_update on caregivers for update
  using (user_id = auth.uid() or is_caregiver(baby_id))
  with check (user_id = auth.uid() or is_caregiver(baby_id));

drop policy if exists caregivers_delete on caregivers;
create policy caregivers_delete on caregivers for delete
  using (
    is_caregiver(baby_id)
  );

-- Invitations -------------------------------------------------------
-- Caregivers of the baby can read / manage invitations.
-- Invitees can read their own invite by email match.
drop policy if exists invitations_select on invitations;
create policy invitations_select on invitations for select
  using (
    is_caregiver(baby_id)
    or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

drop policy if exists invitations_insert on invitations;
create policy invitations_insert on invitations for insert
  with check (is_caregiver(baby_id));

drop policy if exists invitations_update on invitations;
create policy invitations_update on invitations for update
  using (
    is_caregiver(baby_id)
    or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  )
  with check (
    is_caregiver(baby_id)
    or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

drop policy if exists invitations_delete on invitations;
create policy invitations_delete on invitations for delete
  using (is_caregiver(baby_id));

-- Shared pattern for every caregiver-scoped table ------------------
-- (doses is handled separately below — it scopes via its medication.)
do $$
declare
  t text;
  tables text[] := array[
    'feeds','sleep_sessions','diapers','medications',
    'growth_measurements','vaccinations','illnesses','prompts',
    'audio_capsules','family_members','milestones','reminders'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I_select on %I;', t, t);
    execute format('drop policy if exists %I_insert on %I;', t, t);
    execute format('drop policy if exists %I_update on %I;', t, t);
    execute format('drop policy if exists %I_delete on %I;', t, t);

    execute format(
      'create policy %I_select on %I for select using (is_caregiver(baby_id));',
      t, t
    );
    execute format(
      'create policy %I_insert on %I for insert with check (is_caregiver(baby_id));',
      t, t
    );
    execute format(
      'create policy %I_update on %I for update using (is_caregiver(baby_id)) with check (is_caregiver(baby_id));',
      t, t
    );
    execute format(
      'create policy %I_delete on %I for delete using (is_caregiver(baby_id));',
      t, t
    );
  end loop;
end $$;

-- Doses is scoped via its medication's baby.
drop policy if exists doses_select on doses;
create policy doses_select on doses for select
  using (
    exists (
      select 1 from medications m
      where m.id = doses.medication_id and is_caregiver(m.baby_id)
    )
  );

drop policy if exists doses_insert on doses;
create policy doses_insert on doses for insert
  with check (
    exists (
      select 1 from medications m
      where m.id = doses.medication_id and is_caregiver(m.baby_id)
    )
  );

drop policy if exists doses_update on doses;
create policy doses_update on doses for update
  using (
    exists (
      select 1 from medications m
      where m.id = doses.medication_id and is_caregiver(m.baby_id)
    )
  )
  with check (
    exists (
      select 1 from medications m
      where m.id = doses.medication_id and is_caregiver(m.baby_id)
    )
  );

drop policy if exists doses_delete on doses;
create policy doses_delete on doses for delete
  using (
    exists (
      select 1 from medications m
      where m.id = doses.medication_id and is_caregiver(m.baby_id)
    )
  );

-- Memories: shared to all caregivers, private visible only to the author.
drop policy if exists memories_select on memories;
create policy memories_select on memories for select
  using (
    is_caregiver(baby_id)
    and (
      visibility = 'shared'
      or authored_by in (select id from caregivers where user_id = auth.uid())
    )
  );

drop policy if exists memories_insert on memories;
create policy memories_insert on memories for insert
  with check (is_caregiver(baby_id));

drop policy if exists memories_update on memories;
create policy memories_update on memories for update
  using (
    is_caregiver(baby_id)
    and (visibility = 'shared'
         or authored_by in (select id from caregivers where user_id = auth.uid()))
  )
  with check (is_caregiver(baby_id));

drop policy if exists memories_delete on memories;
create policy memories_delete on memories for delete
  using (
    is_caregiver(baby_id)
    and (visibility = 'shared'
         or authored_by in (select id from caregivers where user_id = auth.uid()))
  );

-- Storage policies --------------------------------------------------
-- Create the buckets in the dashboard first (memories, audio).
-- Then run these to scope access by baby_id folder.
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'objects') then
    execute $policy$
      drop policy if exists "caregivers can read memory photos" on storage.objects;
      create policy "caregivers can read memory photos"
        on storage.objects for select
        using (
          bucket_id = 'memories'
          and (storage.foldername(name))[1]::uuid in (
            select baby_id from caregivers where user_id = auth.uid()
          )
        );

      drop policy if exists "caregivers can write memory photos" on storage.objects;
      create policy "caregivers can write memory photos"
        on storage.objects for insert
        with check (
          bucket_id = 'memories'
          and (storage.foldername(name))[1]::uuid in (
            select baby_id from caregivers where user_id = auth.uid()
          )
        );

      drop policy if exists "caregivers can read audio capsules" on storage.objects;
      create policy "caregivers can read audio capsules"
        on storage.objects for select
        using (
          bucket_id = 'audio'
          and (storage.foldername(name))[1]::uuid in (
            select baby_id from caregivers where user_id = auth.uid()
          )
        );

      drop policy if exists "caregivers can write audio capsules" on storage.objects;
      create policy "caregivers can write audio capsules"
        on storage.objects for insert
        with check (
          bucket_id = 'audio'
          and (storage.foldername(name))[1]::uuid in (
            select baby_id from caregivers where user_id = auth.uid()
          )
        );
    $policy$;
  end if;
end $$;
