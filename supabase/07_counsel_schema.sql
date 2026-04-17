-- Henri — chapter vi: Counsel (AI companion)
-- Chats are caregiver-private by default. Each chat belongs to the caregiver
-- who started it, not to the baby — because these are often reflective, personal
-- questions that a mother may not want shared with the extended family.

create table if not exists counsel_chats (
  id            uuid primary key default gen_random_uuid(),
  caregiver_id  uuid references caregivers(id) on delete cascade,
  baby_id       uuid references babies(id) on delete cascade,
  title         text,
  archived      boolean default false,
  created_at    timestamptz default now(),
  last_message_at timestamptz default now()
);

create index if not exists counsel_chats_caregiver_idx
  on counsel_chats(caregiver_id, last_message_at desc);

create table if not exists counsel_messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid references counsel_chats(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists counsel_messages_chat_idx
  on counsel_messages(chat_id, created_at asc);

-- RLS: only the caregiver who owns the chat can read/write it.
alter table counsel_chats    enable row level security;
alter table counsel_messages enable row level security;

drop policy if exists counsel_chats_select on counsel_chats;
create policy counsel_chats_select on counsel_chats for select
  using (caregiver_id in (select id from caregivers where user_id = auth.uid()));

drop policy if exists counsel_chats_insert on counsel_chats;
create policy counsel_chats_insert on counsel_chats for insert
  with check (caregiver_id in (select id from caregivers where user_id = auth.uid()));

drop policy if exists counsel_chats_update on counsel_chats;
create policy counsel_chats_update on counsel_chats for update
  using (caregiver_id in (select id from caregivers where user_id = auth.uid()))
  with check (caregiver_id in (select id from caregivers where user_id = auth.uid()));

drop policy if exists counsel_chats_delete on counsel_chats;
create policy counsel_chats_delete on counsel_chats for delete
  using (caregiver_id in (select id from caregivers where user_id = auth.uid()));

drop policy if exists counsel_messages_select on counsel_messages;
create policy counsel_messages_select on counsel_messages for select
  using (
    chat_id in (
      select id from counsel_chats
      where caregiver_id in (select id from caregivers where user_id = auth.uid())
    )
  );

drop policy if exists counsel_messages_insert on counsel_messages;
create policy counsel_messages_insert on counsel_messages for insert
  with check (
    chat_id in (
      select id from counsel_chats
      where caregiver_id in (select id from caregivers where user_id = auth.uid())
    )
  );

drop policy if exists counsel_messages_delete on counsel_messages;
create policy counsel_messages_delete on counsel_messages for delete
  using (
    chat_id in (
      select id from counsel_chats
      where caregiver_id in (select id from caregivers where user_id = auth.uid())
    )
  );
