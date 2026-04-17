import { supabase } from './supabase';
import type { GrowthMeasurement, Illness, Vaccination } from './types';

export async function fetchGrowth(babyId: string): Promise<GrowthMeasurement[]> {
  const { data } = await supabase
    .from('growth_measurements')
    .select('*')
    .eq('baby_id', babyId)
    .order('measured_at', { ascending: false });
  return (data ?? []) as GrowthMeasurement[];
}

export async function fetchVaccinations(babyId: string): Promise<Vaccination[]> {
  const { data } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('baby_id', babyId)
    .order('due_at', { ascending: true, nullsFirst: false });
  return (data ?? []) as Vaccination[];
}

export async function fetchIllnesses(babyId: string): Promise<Illness[]> {
  const { data } = await supabase
    .from('illnesses')
    .select('*')
    .eq('baby_id', babyId)
    .order('started_at', { ascending: false });
  return (data ?? []) as Illness[];
}

export async function logGrowth(
  babyId: string,
  input: {
    weight_lb?: number | null;
    length_in?: number | null;
    head_circ_in?: number | null;
    measured_at: string;
    source?: string | null;
  }
): Promise<GrowthMeasurement> {
  const { data, error } = await supabase
    .from('growth_measurements')
    .insert({ ...input, baby_id: babyId })
    .select()
    .single();
  if (error) throw error;
  return data as GrowthMeasurement;
}

export async function logIllness(
  babyId: string,
  input: {
    name: string;
    symptoms?: string | null;
    started_at: string;
    resolved_at?: string | null;
    highest_temp_f?: number | null;
    notes?: string | null;
    doctor_notified?: boolean;
  }
): Promise<Illness> {
  const { data, error } = await supabase
    .from('illnesses')
    .insert({ ...input, baby_id: babyId })
    .select()
    .single();
  if (error) throw error;
  return data as Illness;
}

export async function markVaccineGiven(
  vaccinationId: string,
  input: { given_at: string; brand?: string | null; lot_number?: string | null; provider?: string | null; reaction_notes?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('vaccinations')
    .update(input)
    .eq('id', vaccinationId);
  if (error) throw error;
}
