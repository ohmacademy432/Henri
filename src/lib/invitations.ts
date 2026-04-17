import { supabase } from './supabase';
import type { Caregiver, Invitation } from './types';

export async function listInvitations(babyId: string): Promise<Invitation[]> {
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .eq('baby_id', babyId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Invitation[];
}

export async function listCaregivers(babyId: string): Promise<Caregiver[]> {
  const { data } = await supabase
    .from('caregivers')
    .select('*')
    .eq('baby_id', babyId)
    .order('created_at', { ascending: true });
  return (data ?? []) as Caregiver[];
}

const EXPIRY_DAYS = 3;

export async function createInvitation(
  babyId: string,
  inviterCaregiverId: string,
  input: { relationship: string; display_name?: string | null }
): Promise<Invitation> {
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      baby_id: babyId,
      invited_by: inviterCaregiverId,
      email: null,
      relationship: input.relationship,
      display_name: input.display_name?.trim() || null,
      expires_at: expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Invitation;
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.from('invitations').delete().eq('id', invitationId);
  if (error) throw error;
}

export async function revokeCaregiver(caregiverId: string): Promise<void> {
  const { error } = await supabase.from('caregivers').delete().eq('id', caregiverId);
  if (error) throw error;
}

// The production site URL — used when generating invitation links regardless
// of where the link is generated from (localhost dev, staging, etc.). Can be
// overridden per-environment with VITE_APP_URL if needed.
const PRODUCTION_APP_URL = 'https://henrirobert.netlify.app';

export function invitationLink(token: string): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined) ?? PRODUCTION_APP_URL;
  return `${base.replace(/\/$/, '')}/accept/${token}`;
}
