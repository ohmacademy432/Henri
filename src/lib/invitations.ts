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

export async function createInvitation(
  babyId: string,
  inviterCaregiverId: string,
  input: { email: string; relationship: string; display_name?: string | null }
): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      baby_id: babyId,
      invited_by: inviterCaregiverId,
      email: input.email.trim().toLowerCase(),
      relationship: input.relationship,
      display_name: input.display_name?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;

  // Best-effort: ask the edge function to send the email. If the function isn't
  // deployed yet, the invitation row still exists and can be shared by link.
  try {
    await supabase.functions.invoke('send-invitation', {
      body: { invitation_id: (data as Invitation).id },
    });
  } catch (e) {
    console.warn('[henri] send-invitation edge function not available yet:', e);
  }

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

export function invitationLink(token: string): string {
  return `${window.location.origin}/accept/${token}`;
}
