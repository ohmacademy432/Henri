import { supabase } from './supabase';

export type CounselChat = {
  id: string;
  caregiver_id: string;
  baby_id: string | null;
  title: string | null;
  archived: boolean;
  created_at: string;
  last_message_at: string;
};

export type CounselMessage = {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export async function listChats(caregiverId: string): Promise<CounselChat[]> {
  const { data } = await supabase
    .from('counsel_chats')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .eq('archived', false)
    .order('last_message_at', { ascending: false });
  return (data ?? []) as CounselChat[];
}

export async function createChat(caregiverId: string, babyId: string | null, firstLine: string): Promise<CounselChat> {
  const title = firstLine.slice(0, 60).replace(/\s+/g, ' ').trim() || null;
  const { data, error } = await supabase
    .from('counsel_chats')
    .insert({ caregiver_id: caregiverId, baby_id: babyId, title })
    .select()
    .single();
  if (error) throw error;
  return data as CounselChat;
}

export async function fetchMessages(chatId: string): Promise<CounselMessage[]> {
  const { data } = await supabase
    .from('counsel_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  return (data ?? []) as CounselMessage[];
}

export async function saveUserMessage(chatId: string, content: string): Promise<CounselMessage> {
  const { data, error } = await supabase
    .from('counsel_messages')
    .insert({ chat_id: chatId, role: 'user', content })
    .select()
    .single();
  if (error) throw error;
  return data as CounselMessage;
}

export async function deleteChat(chatId: string): Promise<void> {
  await supabase.from('counsel_chats').delete().eq('id', chatId);
}

/**
 * Streams a reply from the counsel edge function, calling `onToken` for each
 * incremental text chunk.
 */
export async function streamReply(
  chatId: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onToken: (t: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error('not signed in');

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const resp = await fetch(`${url}/functions/v1/counsel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat_id: chatId, messages: history }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text();
    throw new Error(text || `counsel responded ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value, { stream: true }));
  }
}

// Starter prompts tailored to the user's life stage. Used in empty states
// (curated, not blank — a new mother should have somewhere to start).
export function starterPromptsFor(isPrenatal: boolean, hasBabyName: boolean, babyName: string): string[] {
  if (isPrenatal) {
    return [
      'I\u2019m in the third trimester and I keep feeling like I\u2019m running out of time. Help me settle.',
      `What would a traditional Ayurvedic postpartum (the 40-day container) look like for someone preparing for ${hasBabyName ? babyName : 'a new baby'}?`,
      'I\u2019m scared I won\u2019t know what to do when the baby comes. How do I trust myself?',
      'What does polyvagal theory say about the nervous system of a baby being born?',
      'How do I prepare my home so it feels calm when we bring him back from the hospital?',
    ];
  }
  return [
    `${hasBabyName ? babyName : 'My baby'} has been so fussy in the evenings. Help me understand what his nervous system might be asking for.`,
    'I\u2019m exhausted and I snapped at my partner this morning. How do I come back from that without shame?',
    'What did Daniel Siegel mean by "name it to tame it," and how do I use it with a baby who has no words?',
    'I feel like I\u2019m losing myself. What does Shefali Tsabary have to say about that?',
    'What\u2019s an Ayurvedic lens on sleep for a baby this age?',
  ];
}
