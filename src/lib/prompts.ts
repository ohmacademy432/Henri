import { supabase } from './supabase';
import type { Prompt } from './types';
import { ageInDays } from './utils/age';

/**
 * Pick a prompt whose age window fits the baby today.
 * Prefers unanswered. Falls back to already-answered if needed.
 * Returns null if no prompts at all.
 */
export async function pickTodaysPrompt(
  babyId: string,
  birthTime: string | null
): Promise<Prompt | null> {
  const days = birthTime ? ageInDays(birthTime) : 0;
  const isPrenatal = !birthTime;

  let query = supabase.from('prompts').select('*').eq('baby_id', babyId);

  if (isPrenatal) {
    // Pregnancy prompts have age_min_days IS NULL and age_max_days = 0
    query = query.is('age_min_days', null);
  } else {
    query = query
      .or(`age_min_days.is.null,age_min_days.lte.${days}`)
      .or(`age_max_days.is.null,age_max_days.gte.${days}`);
  }

  const { data } = await query;
  const rows = (data ?? []) as Prompt[];
  if (rows.length === 0) return null;

  const unanswered = rows.filter((p) => !p.answered_memory_id);
  const pool = unanswered.length > 0 ? unanswered : rows;

  // Stable-for-the-day selection: use the YYYY-MM-DD to index into the pool.
  const today = new Date().toISOString().slice(0, 10);
  const seed = hash(`${babyId}:${today}`);
  return pool[seed % pool.length];
}

/**
 * Unanswered prompts that fit the baby's current life stage.
 * Excludes today's pick so it doesn't repeat.
 */
export async function fetchSuggestedPrompts(
  babyId: string,
  birthTime: string | null,
  excludeId?: string,
  limit = 6
): Promise<Prompt[]> {
  const days = birthTime ? ageInDays(birthTime) : 0;
  const isPrenatal = !birthTime;

  let query = supabase
    .from('prompts')
    .select('*')
    .eq('baby_id', babyId)
    .is('answered_memory_id', null);

  if (isPrenatal) {
    query = query.is('age_min_days', null);
  } else {
    query = query
      .or(`age_min_days.is.null,age_min_days.lte.${days}`)
      .or(`age_max_days.is.null,age_max_days.gte.${days}`);
  }

  const { data } = await query;
  let rows = (data ?? []) as Prompt[];
  if (excludeId) rows = rows.filter((p) => p.id !== excludeId);

  // Stable-for-the-day rotation so the same six are offered all day,
  // not a different set every render.
  const today = new Date().toISOString().slice(0, 10);
  const seed = hash(`${babyId}:${today}:list`);
  const sorted = [...rows].sort((a, b) => {
    const ka = hash(seed + a.id);
    const kb = hash(seed + b.id);
    return ka - kb;
  });

  return sorted.slice(0, limit);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}
