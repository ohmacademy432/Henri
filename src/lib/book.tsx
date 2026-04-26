// Keeps the "current baby" + caregiver for the signed-in user.
// First caregiver row -> first baby. Most users have one; the spec doesn't
// ask for a switcher in v1.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  // Sequence # so an older in-flight refresh can't overwrite a newer one's
  // results — important during accept-invitation, where signup triggers an
  // auto-refresh while Accept.tsx is also calling refresh() after the
  // caregiver insert.
  const seqRef = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++seqRef.current;

    // Read the freshest session directly — relying on the closure-captured
    // `user` here would be racy: during signup, this function is invoked
    // before React has propagated the new auth state through the provider.
    const { data: { session } } = await supabase.auth.getSession();
    const u = session?.user ?? null;

    if (!u) {
      if (seq === seqRef.current) {
        setBaby(null);
        setCaregiver(null);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    const { data: careRows } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', u.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (seq !== seqRef.current) return;
    const care = (careRows?.[0] as Caregiver | undefined) ?? null;

    if (!care) {
      setCaregiver(null);
      setBaby(null);
      setLoading(false);
      return;
    }

    const { data: babyRow } = await supabase
      .from('babies')
      .select('*')
      .eq('id', care.baby_id)
      .single();

    if (seq !== seqRef.current) return;
    setCaregiver(care);
    setBaby((babyRow as Baby | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [user, refresh]);

  const value = useMemo(() => ({ baby, caregiver, loading, refresh }), [baby, caregiver, loading, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBook(): BookState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBook must be used inside <BookProvider>');
  return v;
}
