import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type MenuState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const Ctx = createContext<MenuState | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo<MenuState>(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMenu(): MenuState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMenu must be used inside <MenuProvider>');
  return v;
}
