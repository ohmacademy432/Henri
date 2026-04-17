import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithEmail: async (email, redirectTo) => {
        const emailRedirectTo =
          redirectTo ?? `${window.location.origin}/today`;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo, shouldCreateUser: true },
        });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
