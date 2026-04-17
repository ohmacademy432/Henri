// Web Push subscription + service worker registration.
// VAPID public key comes from VITE_VAPID_PUBLIC_KEY (set after running
// `npx web-push generate-vapid-keys`). The matching private key lives only
// on the Supabase Edge Function side.

import { supabase } from './supabase';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushSupport =
  | { state: 'unsupported'; reason: string }
  | { state: 'supported'; permission: NotificationPermission };

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return { state: 'unsupported', reason: 'no window' };
  if (!('serviceWorker' in navigator)) return { state: 'unsupported', reason: 'no service worker' };
  if (!('PushManager' in window)) return { state: 'unsupported', reason: 'no Push API' };
  if (!('Notification' in window)) return { state: 'unsupported', reason: 'no Notification API' };
  return { state: 'supported', permission: Notification.permission };
}

/**
 * On iOS, web push only works when the PWA is installed to the Home Screen.
 * This is a best-effort detector for "is the app running standalone?"
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)');
  if (mq?.matches) return true;
  type IOSNav = Navigator & { standalone?: boolean };
  return (navigator as IOSNav).standalone === true;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return await navigator.serviceWorker.ready;
}

export async function subscribeToPush(caregiverId: string): Promise<PushSubscription | null> {
  const sup = pushSupport();
  if (sup.state === 'unsupported') {
    throw new Error(`Push not supported here: ${sup.reason}`);
  }
  if (!VAPID_PUBLIC) {
    throw new Error('Missing VITE_VAPID_PUBLIC_KEY — generate keys with `npx web-push generate-vapid-keys`.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notifications were not allowed.');
  }

  const reg = await ensureServiceWorker();
  if (!reg) throw new Error('Could not register service worker.');

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC).buffer as ArrayBuffer,
  });

  await supabase
    .from('caregivers')
    .update({
      web_push_subscription: sub.toJSON(),
      notify_meds: true,
    })
    .eq('id', caregiverId);

  return sub;
}

export async function unsubscribeFromPush(caregiverId: string): Promise<void> {
  const reg = await ensureServiceWorker();
  const existing = await reg?.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();
  await supabase
    .from('caregivers')
    .update({ web_push_subscription: null, notify_meds: false })
    .eq('id', caregiverId);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
