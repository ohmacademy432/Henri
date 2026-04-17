// Keeps the "current baby" + caregiver for the signed-in user.
// First caregiver row -> first baby. Most users have one; the spec doesn't
// ask for a switcher in v1.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from './supabase';
import type { Baby, Caregiver } from './types';
import { useAuth } from './auth';

type BookState = {
  baby: Baby | null;
  caregiver: Caregiver | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<BookState | null>(null);

export function BookProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [baby, setBaby] = useState<Baby | null>(null);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBaby(null);
      setCaregiver(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: careRows } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    const care = (careRows?.[0] as Caregiver | undefined) ?? null;
    setCaregiver(care);

    if (care) {
      const { data: babyRow } = await supabase
        .from('babies')
        .select('*')
        .eq('id', care.baby_id)
        .single();
      setBaby((babyRow as Baby | null) ?? null);
    } else {
      setBaby(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ baby, caregiver, loading, refresh }), [baby, caregiver, loading, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBook(): BookState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBook must be used inside <BookProvider>');
  return v;
}
