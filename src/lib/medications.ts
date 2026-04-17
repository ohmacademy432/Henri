import { supabase } from './supabase';
import type { Dose, Medication } from './types';

export async function listMedications(babyId: string): Promise<Medication[]> {
  const { data } = await supabase
    .from('medications')
    .select('*')
    .eq('baby_id', babyId)
    .order('active', { ascending: false })
    .order('created_at', { ascending: false });
  return (data ?? []) as Medication[];
}

export async function fetchMedication(id: string): Promise<Medication | null> {
  const { data } = await supabase.from('medications').select('*').eq('id', id).maybeSingle();
  return (data as Medication) ?? null;
}

export async function listDoses(medicationId: string, limit = 50): Promise<Dose[]> {
  const { data } = await supabase
    .from('doses')
    .select('*')
    .eq('medication_id', medicationId)
    .order('given_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Dose[];
}

export async function listRecentDosesForBaby(babyId: string, limit = 10): Promise<Array<Dose & { medication: Medication | null }>> {
  const meds = await listMedications(babyId);
  const map = new Map(meds.map((m) => [m.id, m]));
  const ids = meds.map((m) => m.id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from('doses')
    .select('*')
    .in('medication_id', ids)
    .order('given_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((d) => {
    const dose = d as Dose;
    return { ...dose, medication: map.get(dose.medication_id) ?? null };
  });
}

export async function createMedication(
  babyId: string,
  input: Omit<Medication, 'id' | 'baby_id' | 'created_at' | 'active' | 'start_date' | 'end_date'> & { active?: boolean; start_date?: string; end_date?: string | null }
): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .insert({ ...input, baby_id: babyId })
    .select()
    .single();
  if (error) throw error;
  return data as Medication;
}

export async function logDose(
  medicationId: string,
  caregiverId: string | null,
  input: { given_at: string; amount?: number | null; notes?: string | null }
): Promise<Dose> {
  const { data, error } = await supabase
    .from('doses')
    .insert({
      medication_id: medicationId,
      given_at: input.given_at,
      amount: input.amount ?? null,
      notes: input.notes ?? null,
      given_by: caregiverId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Dose;
}

export type CountdownState = {
  nextSafe: Date | null;
  msRemaining: number;
  pastDue: boolean;
};

export function nextSafeDose(med: Medication, lastDose: Dose | null, now: Date = new Date()): CountdownState {
  if (!lastDose) {
    return { nextSafe: now, msRemaining: 0, pastDue: false };
  }
  const next = new Date(new Date(lastDose.given_at).getTime() + med.frequency_hours * 3600_000);
  const ms = next.getTime() - now.getTime();
  return {
    nextSafe: next,
    msRemaining: ms,
    pastDue: ms <= 0,
  };
}
