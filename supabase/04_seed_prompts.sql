-- Henri — age-windowed prompts seed
-- Installs a library of prompts per baby. Runs from the after_baby_insert trigger.

create or replace function public.seed_prompts_for_baby(_baby_id uuid)
returns void
language plpgsql
as $$
begin
  if exists (select 1 from prompts where baby_id = _baby_id and custom = false) then
    return;
  end if;

  insert into prompts (baby_id, question, age_min_days, age_max_days, custom) values
    -- Pregnancy (before birth; leave age windows null, the client treats these as the opening pages)
    (_baby_id, 'What was the first day you knew he was coming?', null, 0, false),
    (_baby_id, 'Where were you when you first felt him move?', null, 0, false),
    (_baby_id, 'What did you hope for, quietly, in the long months of waiting?', null, 0, false),
    (_baby_id, 'Who was the first person you told, and what did they say?', null, 0, false),
    (_baby_id, 'What songs did you sing to him before he was born?', null, 0, false),
    (_baby_id, 'What names did you try on before you chose?', null, 0, false),
    (_baby_id, 'What did the nursery smell like the night before?', null, 0, false),
    (_baby_id, 'Write a letter to him from the last week you carried him.', null, 0, false),
    (_baby_id, 'What were you afraid of, and what did you do with the fear?', null, 0, false),
    (_baby_id, 'What meal did you eat on the day labor began?', null, 0, false),

    -- 0–30 days
    (_baby_id, 'Describe the exact moment you first saw his face.', 0, 30, false),
    (_baby_id, 'Who was in the room, and what did the light look like?', 0, 30, false),
    (_baby_id, 'What did his first cry sound like, in your ears, that day?', 0, 30, false),
    (_baby_id, 'What did the weight of him feel like, the very first time?', 0, 30, false),
    (_baby_id, 'What did you whisper to him in the first hour?', 0, 30, false),
    (_baby_id, 'What did his father look like, holding him?', 0, 30, false),
    (_baby_id, 'What did you not expect about the first week home?', 0, 30, false),
    (_baby_id, 'Who brought food, and what did they bring?', 0, 30, false),
    (_baby_id, 'What did 3 AM feel like that first week?', 0, 30, false),
    (_baby_id, 'What song did you rock him to?', 0, 30, false),
    (_baby_id, 'Describe the shape of his hands. His fingernails.', 0, 30, false),
    (_baby_id, 'What did he smell like, the top of his head?', 0, 30, false),

    -- 1–3 months
    (_baby_id, 'When did he first truly look at you, and know you?', 30, 90, false),
    (_baby_id, 'What makes him laugh this week?', 30, 90, false),
    (_baby_id, 'What does his smile do to you, every time?', 30, 90, false),
    (_baby_id, 'What sounds is he making, and what do they seem to mean?', 30, 90, false),
    (_baby_id, 'What is the small thing about his face you never want to forget?', 30, 90, false),
    (_baby_id, 'Who has he begun to recognize?', 30, 90, false),
    (_baby_id, 'What does he do with his hands when he''s happy?', 30, 90, false),
    (_baby_id, 'What hour of the day is his best hour?', 30, 90, false),
    (_baby_id, 'What has been the hardest thing, honestly?', 30, 90, false),
    (_baby_id, 'What has been the kindest thing anyone has done for you?', 30, 90, false),
    (_baby_id, 'What is his nickname — the one that slipped out on its own?', 30, 90, false),
    (_baby_id, 'What did he wear today, and why did you choose it?', 30, 90, false),

    -- 3–6 months
    (_baby_id, 'What did it feel like the first time he rolled over?', 90, 180, false),
    (_baby_id, 'Describe his laughter this week, as if to someone who has never heard it.', 90, 180, false),
    (_baby_id, 'What is the first food he tasted, and what did he do?', 90, 180, false),
    (_baby_id, 'What toy is he most in love with?', 90, 180, false),
    (_baby_id, 'Where does he look when someone walks into the room?', 90, 180, false),
    (_baby_id, 'What does he do that no one else''s baby does?', 90, 180, false),
    (_baby_id, 'What does his voice sound like when he is very, very upset?', 90, 180, false),
    (_baby_id, 'When he looks in a mirror, what happens?', 90, 180, false),
    (_baby_id, 'What does bath time look like, now?', 90, 180, false),
    (_baby_id, 'Who is his favorite person besides you, and how do you know?', 90, 180, false),
    (_baby_id, 'What do his feet do when he''s excited?', 90, 180, false),
    (_baby_id, 'What is the small, daily ritual the two of you have found?', 90, 180, false),

    -- 6–12 months
    (_baby_id, 'When did he first sit by himself, and where?', 180, 365, false),
    (_baby_id, 'What is his first word going to be, do you think? Why?', 180, 365, false),
    (_baby_id, 'Describe the first time he said a sound you understood.', 180, 365, false),
    (_baby_id, 'What is he crawling toward, most days?', 180, 365, false),
    (_baby_id, 'What food has he refused, and what does his face do when he refuses it?', 180, 365, false),
    (_baby_id, 'What is he afraid of, and what calms him?', 180, 365, false),
    (_baby_id, 'Who makes him laugh the hardest?', 180, 365, false),
    (_baby_id, 'Describe his first Halloween costume. Who chose it?', 180, 365, false),
    (_baby_id, 'What is his first holiday going to look like?', 180, 365, false),
    (_baby_id, 'What is his sleeping self like? Arms thrown up? Curled?', 180, 365, false),
    (_baby_id, 'What is he most proud of himself for, this month?', 180, 365, false),
    (_baby_id, 'What is the one thing about these days you want to keep forever?', 180, 365, false),

    -- 12–24 months
    (_baby_id, 'Describe his first steps. Who was there?', 365, 730, false),
    (_baby_id, 'What was his first birthday cake, and did he eat it or wear it?', 365, 730, false),
    (_baby_id, 'What words does he have now? List them, in the order they came.', 365, 730, false),
    (_baby_id, 'What does he do when he wants to be picked up?', 365, 730, false),
    (_baby_id, 'What is his funniest habit right now?', 365, 730, false),
    (_baby_id, 'What is the first book he asks for?', 365, 730, false),
    (_baby_id, 'What does he call you?', 365, 730, false),
    (_baby_id, 'What did he do today that felt older than he is?', 365, 730, false),
    (_baby_id, 'What game do the two of you play that no one else would understand?', 365, 730, false),
    (_baby_id, 'Who is his best friend, and how did that happen?', 365, 730, false),
    (_baby_id, 'What is he obsessed with this week?', 365, 730, false),
    (_baby_id, 'Describe the way he runs.', 365, 730, false),

    -- 2–3 years
    (_baby_id, 'What question is he asking over and over these days?', 730, 1095, false),
    (_baby_id, 'What does he think about the moon?', 730, 1095, false),
    (_baby_id, 'What is his imaginary life like?', 730, 1095, false),
    (_baby_id, 'Who is he when he thinks no one is watching?', 730, 1095, false),
    (_baby_id, 'What is the sentence he said this week that stopped you?', 730, 1095, false),
    (_baby_id, 'What does he pretend to be?', 730, 1095, false),
    (_baby_id, 'What does he say about his own feelings?', 730, 1095, false),
    (_baby_id, 'What is the question you hope he never stops asking?', 730, 1095, false),

    -- 3+ years
    (_baby_id, 'What has he told you about the world lately?', 1095, null, false),
    (_baby_id, 'Who does he say he wants to be when he grows up?', 1095, null, false),
    (_baby_id, 'What story does he ask for again and again?', 1095, null, false),
    (_baby_id, 'What is the thing he is stubborn about?', 1095, null, false),
    (_baby_id, 'Describe his handwriting the first time he writes his own name.', 1095, null, false),
    (_baby_id, 'What does he know about love, already?', 1095, null, false);
end;
$$;

-- If there are already babies in the table, seed them now.
do $$
declare
  b record;
begin
  for b in select id from babies loop
    perform public.seed_prompts_for_baby(b.id);
    perform public.seed_vaccinations_for_baby(b.id);
  end loop;
end $$;
