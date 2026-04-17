import { supabase } from './supabase';
import type { Diaper, Feed, SleepSession } from './types';

export async function fetchLastFeed(babyId: string): Promise<Feed | null> {
  const { data } = await supabase
    .from('feeds')
    .select('*')
    .eq('baby_id', babyId)
    .order('started_at', { ascending: false })
    .limit(1);
  return (data?.[0] as Feed | undefined) ?? null;
}

export async function fetchLastSleep(babyId: string): Promise<SleepSession | null> {
  const { data } = await supabase
    .from('sleep_sessions')
    .select('*')
    .eq('baby_id', babyId)
    .order('started_at', { ascending: false })
    .limit(1);
  return (data?.[0] as SleepSession | undefined) ?? null;
}

export async function fetchLastDiaper(babyId: string): Promise<Diaper | null> {
  const { data } = await supabase
    .from('diapers')
    .select('*')
    .eq('baby_id', babyId)
    .order('occurred_at', { ascending: false })
    .limit(1);
  return (data?.[0] as Diaper | undefined) ?? null;
}

export async function fetchSleepSessionsSince(
  babyId: string,
  sinceIso: string
): Promise<SleepSession[]> {
  const { data } = await supabase
    .from('sleep_sessions')
    .select('*')
    .eq('baby_id', babyId)
    .gte('started_at', sinceIso)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true });
  return (data ?? []) as SleepSession[];
}

export type NewFeed = {
  type: Feed['type'];
  amount_ml?: number | null;
  duration_min?: number | null;
  started_at: string;
  ended_at?: string | null;
  notes?: string | null;
};

export async function logFeed(
  babyId: string,
  caregiverId: string | null,
  input: NewFeed
): Promise<Feed> {
  const { data, error } = await supabase
    .from('feeds')
    .insert({ ...input, baby_id: babyId, logged_by: caregiverId })
    .select()
    .single();
  if (error) throw error;
  return data as Feed;
}

export type NewSleep = {
  started_at: string;
  ended_at?: string | null;
  quality?: string | null;
  location?: string | null;
};

export async function logSleep(
  babyId: string,
  caregiverId: string | null,
  input: NewSleep
): Promise<SleepSession> {
  const { data, error } = await supabase
    .from('sleep_sessions')
    .insert({ ...input, baby_id: babyId, logged_by: caregiverId })
    .select()
    .single();
  if (error) throw error;
  return data as SleepSession;
}

export type NewDiaper = {
  type: string;
  occurred_at: string;
  notes?: string | null;
};

export async function logDiaper(
  babyId: string,
  caregiverId: string | null,
  input: NewDiaper
): Promise<Diaper> {
  const { data, error } = await supabase
    .from('diapers')
    .insert({ ...input, baby_id: babyId, logged_by: caregiverId })
    .select()
    .single();
  if (error) throw error;
  return data as Diaper;
}
