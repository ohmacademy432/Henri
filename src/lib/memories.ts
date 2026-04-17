import { supabase } from './supabase';
import { signPaths, uploadPhoto } from './photos';
import type { Memory } from './types';

export type NewMemoryInput = {
  babyId: string;
  caregiverId: string | null;
  occurredOn: string; // yyyy-MM-dd
  title?: string | null;
  body?: string | null;
  visibility: 'shared' | 'private';
  promptId?: string | null;
  files?: File[];
};

export async function createMemory(input: NewMemoryInput): Promise<Memory> {
  // Insert the memory row first so we have an id to scope photo storage by.
  const { data: memRow, error: memErr } = await supabase
    .from('memories')
    .insert({
      baby_id: input.babyId,
      authored_by: input.caregiverId,
      occurred_on: input.occurredOn,
      title: input.title ?? null,
      body: input.body ?? null,
      visibility: input.visibility,
      prompt_id: input.promptId ?? null,
    })
    .select()
    .single();

  if (memErr || !memRow) throw memErr ?? new Error('Could not save the memory.');

  const memory = memRow as Memory;
  const files = input.files ?? [];
  if (files.length === 0) return memory;

  const fullPaths: string[] = [];
  const thumbPaths: string[] = [];
  for (const f of files) {
    const { fullPath, thumbPath } = await uploadPhoto(input.babyId, memory.id, f);
    fullPaths.push(fullPath);
    thumbPaths.push(thumbPath);
  }

  const { data: updated, error: updErr } = await supabase
    .from('memories')
    .update({ photo_urls: fullPaths, thumbnail_urls: thumbPaths })
    .eq('id', memory.id)
    .select()
    .single();
  if (updErr || !updated) throw updErr ?? new Error('Could not attach photos.');

  // If answering a prompt, link the memory back so we don't repeat the question.
  if (input.promptId) {
    await supabase
      .from('prompts')
      .update({ answered_memory_id: memory.id })
      .eq('id', input.promptId);
  }

  return updated as Memory;
}

export async function listMemories(babyId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('baby_id', babyId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Memory[];
}

export async function fetchMemory(id: string): Promise<Memory | null> {
  const { data } = await supabase.from('memories').select('*').eq('id', id).maybeSingle();
  return (data as Memory) ?? null;
}

export type MemoryWithUrls = Memory & {
  full_signed_urls: string[];
  thumb_signed_urls: string[];
};

export async function withSignedUrls(m: Memory): Promise<MemoryWithUrls> {
  const full = m.photo_urls ?? [];
  const thumb = m.thumbnail_urls ?? [];
  const [fullSigned, thumbSigned] = await Promise.all([
    full.length ? signPaths(full) : Promise.resolve([]),
    thumb.length ? signPaths(thumb) : Promise.resolve([]),
  ]);
  return { ...m, full_signed_urls: fullSigned, thumb_signed_urls: thumbSigned };
}

export async function listMemoriesWithUrls(babyId: string): Promise<MemoryWithUrls[]> {
  const rows = await listMemories(babyId);
  return Promise.all(rows.map(withSignedUrls));
}
