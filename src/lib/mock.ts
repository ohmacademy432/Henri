// Mock data for visual-first development before Supabase is wired.

export const mockBaby = {
  id: 'henri',
  name: 'Henri',
  birth_time: '2025-05-20T03:14:00Z',
};

export type MockEntry = {
  id: string;
  kind: 'feed' | 'sleep' | 'diaper';
  when: Date;
  primary: string;
  secondary?: string;
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

export const mockLastEntries: MockEntry[] = [
  {
    id: 'f1',
    kind: 'feed',
    when: hoursAgo(1.5),
    primary: 'Bottle · 4 oz',
    secondary: '18 minutes',
  },
  {
    id: 's1',
    kind: 'sleep',
    when: hoursAgo(4),
    primary: '2 h 12 m nap',
    secondary: 'In the bassinet',
  },
  {
    id: 'd1',
    kind: 'diaper',
    when: hoursAgo(2.2),
    primary: 'Wet',
    secondary: 'Unremarkable',
  },
];

export const mockPrediction = {
  label: 'Next likely nap',
  time: '2:40 PM',
  confidence: 'based on the last seven days',
};

export const mockPrompt = {
  question: 'What did his laughter sound like this week?',
  age_window: '11 weeks',
};

export const mockPhotos = [
  { id: 'p1', caption: 'first morning in the garden', url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop' },
  { id: 'p2', caption: 'asleep on dad', url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop' },
  { id: 'p3', caption: 'tiny hands', url: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800&auto=format&fit=crop' },
  { id: 'p4', caption: 'YahYah visits', url: 'https://images.unsplash.com/photo-1520013225692-fff4010c3a47?w=800&auto=format&fit=crop' },
];
