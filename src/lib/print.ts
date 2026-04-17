import { supabase } from './supabase';
import type { Diaper, Feed, FamilyMember, GrowthMeasurement, Illness, Medication, Memory, SleepSession, Vaccination, Dose } from './types';

export type Bundle = {
  feeds: Feed[];
  sleeps: SleepSession[];
  diapers: Diaper[];
  growth: GrowthMeasurement[];
  vaccines: Vaccination[];
  illnesses: Illness[];
  medications: Medication[];
  doses: Dose[];
  memories: Memory[];
  family: FamilyMember[];
};

/**
 * Bulk-fetch the printable contents of the book within a date window.
 * Days back of 0 means "everything kept."
 */
export async function fetchBundle(babyId: string, daysBack = 0): Promise<Bundle> {
  const sinceIso =
    daysBack > 0
      ? new Date(Date.now() - daysBack * 86_400_000).toISOString()
      : null;
  const sinceDate = sinceIso ? sinceIso.slice(0, 10) : null;

  const [feeds, sleeps, diapers, growth, vaccines, illnesses, meds, memories, family] = await Promise.all([
    rangedDesc('feeds', 'started_at', babyId, sinceIso),
    rangedDesc('sleep_sessions', 'started_at', babyId, sinceIso),
    rangedDesc('diapers', 'occurred_at', babyId, sinceIso),
    rangedDesc('growth_measurements', 'measured_at', babyId, sinceIso),
    fetchAll('vaccinations', 'due_at', babyId, true),
    rangedDesc('illnesses', 'started_at', babyId, sinceDate),
    fetchAll('medications', 'created_at', babyId, false),
    rangedDesc('memories', 'occurred_on', babyId, sinceDate),
    fetchAll('family_members', 'generation', babyId, true),
  ]);

  // Doses are scoped via medications.
  const medIds = (meds as Medication[]).map((m) => m.id);
  let doses: Dose[] = [];
  if (medIds.length) {
    const { data } = await supabase
      .from('doses')
      .select('*')
      .in('medication_id', medIds)
      .order('given_at', { ascending: false });
    doses = (data ?? []) as Dose[];
  }

  return {
    feeds:    feeds as Feed[],
    sleeps:   sleeps as SleepSession[],
    diapers:  diapers as Diaper[],
    growth:   growth as GrowthMeasurement[],
    vaccines: vaccines as Vaccination[],
    illnesses: illnesses as Illness[],
    medications: meds as Medication[],
    doses,
    memories: memories as Memory[],
    family:   family as FamilyMember[],
  };
}

async function rangedDesc(
  table: string,
  timeCol: string,
  babyId: string,
  sinceIsoOrDate: string | null
) {
  let q = supabase.from(table).select('*').eq('baby_id', babyId).order(timeCol, { ascending: false });
  if (sinceIsoOrDate) q = q.gte(timeCol, sinceIsoOrDate);
  const { data } = await q;
  return data ?? [];
}

async function fetchAll(table: string, orderCol: string, babyId: string, ascending: boolean) {
  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('baby_id', babyId)
    .order(orderCol, { ascending, nullsFirst: ascending });
  return data ?? [];
}
