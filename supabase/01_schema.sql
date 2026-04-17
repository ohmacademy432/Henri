-- Henri — schema
-- Run this first in the Supabase SQL editor.

create extension if not exists pgcrypto;

-- Babies -----------------------------------------------------------
create table if not exists babies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  birth_time       timestamptz,
  birth_weight_oz  numeric,
  birth_length_in  numeric,
  birth_head_in    numeric,
  birth_location   text,
  birth_notes      text,
  owner_user_id    uuid references auth.users(id),
  created_at       timestamptz default now()
);

-- Caregivers -------------------------------------------------------
create table if not exists caregivers (
  id                        uuid primary key default gen_random_uuid(),
  baby_id                   uuid references babies(id) on delete cascade,
  user_id                   uuid references auth.users(id) on delete cascade,
  display_name              text not null,
  relationship              text,
  can_edit                  boolean default true,
  notify_meds               boolean default false,
  web_push_subscription     jsonb,
  save_to_device_gallery    boolean default true,
  created_at                timestamptz default now(),
  unique(baby_id, user_id)
);

-- Invitations ------------------------------------------------------
create table if not exists invitations (
  id            uuid primary key default gen_random_uuid(),
  baby_id       uuid references babies(id) on delete cascade,
  email         text not null,
  relationship  text,
  display_name  text,
  token         uuid default gen_random_uuid(),
  invited_by    uuid references caregivers(id),
  accepted      boolean default false,
  accepted_at   timestamptz,
  expires_at    timestamptz default (now() + interval '30 days'),
  created_at    timestamptz default now()
);

create index if not exists invitations_token_idx on invitations(token);
create index if not exists invitations_email_idx on invitations(lower(email));

-- Feeds ------------------------------------------------------------
create table if not exists feeds (
  id            uuid primary key default gen_random_uuid(),
  baby_id       uuid references babies(id) on delete cascade,
  type          text not null,
  amount_ml     numeric,
  duration_min  numeric,
  started_at    timestamptz not null,
  ended_at      timestamptz,
  notes         text,
  logged_by     uuid references caregivers(id),
  created_at    timestamptz default now()
);
create index if not exists feeds_baby_started_idx on feeds(baby_id, started_at desc);

-- Sleep ------------------------------------------------------------
create table if not exists sleep_sessions (
  id          uuid primary key default gen_random_uuid(),
  baby_id     uuid references babies(id) on delete cascade,
  started_at  timestamptz not null,
  ended_at    timestamptz,
  quality     text,
  location    text,
  logged_by   uuid references caregivers(id),
  created_at  timestamptz default now()
);
create index if not exists sleep_baby_started_idx on sleep_sessions(baby_id, started_at desc);

-- Diapers ----------------------------------------------------------
create table if not exists diapers (
  id           uuid primary key default gen_random_uuid(),
  baby_id      uuid references babies(id) on delete cascade,
  type         text not null,
  notes        text,
  occurred_at  timestamptz not null,
  logged_by    uuid references caregivers(id),
  created_at   timestamptz default now()
);
create index if not exists diapers_baby_occurred_idx on diapers(baby_id, occurred_at desc);

-- Medications ------------------------------------------------------
create table if not exists medications (
  id                uuid primary key default gen_random_uuid(),
  baby_id           uuid references babies(id) on delete cascade,
  name              text not null,
  generic_name      text,
  dose_amount       numeric not null,
  dose_unit         text not null,
  frequency_hours   numeric not null,
  max_per_day       integer,
  reason            text,
  prescribed_by     text,
  active            boolean default true,
  start_date        date default current_date,
  end_date          date,
  created_at        timestamptz default now()
);

-- Doses ------------------------------------------------------------
create table if not exists doses (
  id             uuid primary key default gen_random_uuid(),
  medication_id  uuid references medications(id) on delete cascade,
  given_at       timestamptz not null,
  amount         numeric,
  given_by       uuid references caregivers(id),
  notes          text,
  created_at     timestamptz default now()
);
create index if not exists doses_med_given_idx on doses(medication_id, given_at desc);

-- Growth -----------------------------------------------------------
create table if not exists growth_measurements (
  id             uuid primary key default gen_random_uuid(),
  baby_id        uuid references babies(id) on delete cascade,
  weight_lb      numeric,
  length_in      numeric,
  head_circ_in   numeric,
  measured_at    timestamptz not null,
  source         text,
  created_at     timestamptz default now()
);

-- Vaccinations -----------------------------------------------------
create table if not exists vaccinations (
  id               uuid primary key default gen_random_uuid(),
  baby_id          uuid references babies(id) on delete cascade,
  vaccine_name     text not null,
  given_at         timestamptz,
  brand            text,
  lot_number       text,
  reaction_notes   text,
  provider         text,
  due_at           date,
  created_at       timestamptz default now()
);

-- Illnesses --------------------------------------------------------
create table if not exists illnesses (
  id                uuid primary key default gen_random_uuid(),
  baby_id           uuid references babies(id) on delete cascade,
  name              text not null,
  symptoms          text,
  started_at        date not null,
  resolved_at       date,
  highest_temp_f    numeric,
  notes             text,
  doctor_notified   boolean default false,
  created_at        timestamptz default now()
);

-- Memories ---------------------------------------------------------
create table if not exists memories (
  id              uuid primary key default gen_random_uuid(),
  baby_id         uuid references babies(id) on delete cascade,
  occurred_on     date not null,
  title           text,
  body            text,
  photo_urls      text[],
  thumbnail_urls  text[],
  audio_url       text,
  prompt_id       uuid,
  authored_by     uuid references caregivers(id),
  visibility      text default 'shared' check (visibility in ('shared', 'private')),
  created_at      timestamptz default now()
);
create index if not exists memories_baby_occurred_idx on memories(baby_id, occurred_on desc);

-- Prompts ----------------------------------------------------------
create table if not exists prompts (
  id                  uuid primary key default gen_random_uuid(),
  baby_id             uuid references babies(id) on delete cascade,
  question            text not null,
  age_min_days        integer,
  age_max_days        integer,
  custom              boolean default false,
  created_by          uuid references caregivers(id),
  delivered_at        timestamptz,
  answered_memory_id  uuid references memories(id),
  created_at          timestamptz default now()
);
create index if not exists prompts_baby_age_idx on prompts(baby_id, age_min_days);

-- Back-ref so a memory can link to its prompt (fk added after prompts exists)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'memories_prompt_id_fkey') then
    alter table memories
      add constraint memories_prompt_id_fkey
      foreign key (prompt_id) references prompts(id) on delete set null;
  end if;
end $$;

-- Audio capsules ---------------------------------------------------
create table if not exists audio_capsules (
  id              uuid primary key default gen_random_uuid(),
  baby_id         uuid references babies(id) on delete cascade,
  title           text not null,
  audio_url       text not null,
  duration_sec    numeric,
  captured_at     timestamptz not null,
  captured_by     uuid references caregivers(id),
  description     text,
  created_at      timestamptz default now()
);

-- Family tree ------------------------------------------------------
create table if not exists family_members (
  id            uuid primary key default gen_random_uuid(),
  baby_id       uuid references babies(id) on delete cascade,
  name          text not null,
  relationship  text not null,
  generation    integer,
  side          text,
  story         text,
  photo_url     text,
  birth_year    integer,
  death_year    integer,
  created_at    timestamptz default now()
);

-- Milestones -------------------------------------------------------
create table if not exists milestones (
  id           uuid primary key default gen_random_uuid(),
  baby_id      uuid references babies(id) on delete cascade,
  category     text,
  name         text not null,
  achieved_on  date,
  notes        text,
  photo_url    text,
  created_at   timestamptz default now()
);

-- Reminders (for scheduled web push) --------------------------------
create table if not exists reminders (
  id            uuid primary key default gen_random_uuid(),
  baby_id       uuid references babies(id) on delete cascade,
  medication_id uuid references medications(id) on delete cascade,
  kind          text not null default 'med_due',
  fire_at       timestamptz not null,
  sent_at       timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz default now()
);
create index if not exists reminders_due_idx on reminders(fire_at) where sent_at is null and cancelled_at is null;
