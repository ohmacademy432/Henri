import { supabase } from './supabase';
import type { FamilyMember } from './types';

export async function listFamily(babyId: string): Promise<FamilyMember[]> {
  const { data } = await supabase
    .from('family_members')
    .select('*')
    .eq('baby_id', babyId)
    .order('generation', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });
  return (data ?? []) as FamilyMember[];
}

export async function fetchFamilyMember(id: string): Promise<FamilyMember | null> {
  const { data } = await supabase.from('family_members').select('*').eq('id', id).maybeSingle();
  return (data as FamilyMember) ?? null;
}

export async function createFamilyMember(
  babyId: string,
  input: Partial<FamilyMember> & { name: string; relationship: string }
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .insert({ ...input, baby_id: babyId })
    .select()
    .single();
  if (error) throw error;
  return data as FamilyMember;
}

export async function updateFamilyMember(
  id: string,
  patch: Partial<FamilyMember>
): Promise<void> {
  const { error } = await supabase.from('family_members').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw error;
}
