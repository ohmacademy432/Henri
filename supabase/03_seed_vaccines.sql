-- Henri — CDC immunization schedule seed
-- This inserts a due_at row for every baby whenever a new baby is created.
-- It also backfills any existing babies that don't yet have vaccine rows.

create or replace function public.seed_vaccinations_for_baby(_baby_id uuid)
returns void
language plpgsql
as $$
declare
  b_birth date;
begin
  select (birth_time at time zone 'UTC')::date
    into b_birth
    from babies where id = _baby_id;
  if b_birth is null then
    b_birth := current_date;
  end if;

  -- Only seed if no vaccinations rows exist for this baby yet.
  if exists (select 1 from vaccinations where baby_id = _baby_id) then
    return;
  end if;

  insert into vaccinations (baby_id, vaccine_name, due_at) values
    (_baby_id, 'Hepatitis B (1 of 3)',   b_birth),
    (_baby_id, 'Hepatitis B (2 of 3)',   b_birth + interval '1 month'),
    (_baby_id, 'Hepatitis B (3 of 3)',   b_birth + interval '6 months'),

    (_baby_id, 'RV (Rotavirus, 1 of 3)', b_birth + interval '2 months'),
    (_baby_id, 'RV (Rotavirus, 2 of 3)', b_birth + interval '4 months'),
    (_baby_id, 'RV (Rotavirus, 3 of 3)', b_birth + interval '6 months'),

    (_baby_id, 'DTaP (1 of 5)',          b_birth + interval '2 months'),
    (_baby_id, 'DTaP (2 of 5)',          b_birth + interval '4 months'),
    (_baby_id, 'DTaP (3 of 5)',          b_birth + interval '6 months'),
    (_baby_id, 'DTaP (4 of 5)',          b_birth + interval '15 months'),
    (_baby_id, 'DTaP (5 of 5)',          b_birth + interval '4 years'),

    (_baby_id, 'Hib (1 of 4)',           b_birth + interval '2 months'),
    (_baby_id, 'Hib (2 of 4)',           b_birth + interval '4 months'),
    (_baby_id, 'Hib (3 of 4)',           b_birth + interval '6 months'),
    (_baby_id, 'Hib (4 of 4)',           b_birth + interval '12 months'),

    (_baby_id, 'PCV13 (1 of 4)',         b_birth + interval '2 months'),
    (_baby_id, 'PCV13 (2 of 4)',         b_birth + interval '4 months'),
    (_baby_id, 'PCV13 (3 of 4)',         b_birth + interval '6 months'),
    (_baby_id, 'PCV13 (4 of 4)',         b_birth + interval '12 months'),

    (_baby_id, 'IPV (Polio, 1 of 4)',    b_birth + interval '2 months'),
    (_baby_id, 'IPV (Polio, 2 of 4)',    b_birth + interval '4 months'),
    (_baby_id, 'IPV (Polio, 3 of 4)',    b_birth + interval '6 months'),
    (_baby_id, 'IPV (Polio, 4 of 4)',    b_birth + interval '4 years'),

    (_baby_id, 'Influenza (annual)',     b_birth + interval '6 months'),

    (_baby_id, 'MMR (1 of 2)',           b_birth + interval '12 months'),
    (_baby_id, 'MMR (2 of 2)',           b_birth + interval '4 years'),

    (_baby_id, 'Varicella (1 of 2)',     b_birth + interval '12 months'),
    (_baby_id, 'Varicella (2 of 2)',     b_birth + interval '4 years'),

    (_baby_id, 'Hepatitis A (1 of 2)',   b_birth + interval '12 months'),
    (_baby_id, 'Hepatitis A (2 of 2)',   b_birth + interval '18 months');
end;
$$;

-- Trigger so every new baby gets the schedule pre-populated
create or replace function public.after_baby_insert_seed()
returns trigger
language plpgsql
as $$
begin
  perform public.seed_vaccinations_for_baby(new.id);
  perform public.seed_prompts_for_baby(new.id);
  return new;
end;
$$;

drop trigger if exists babies_after_insert_seed on babies;
create trigger babies_after_insert_seed
  after insert on babies
  for each row execute function public.after_baby_insert_seed();
