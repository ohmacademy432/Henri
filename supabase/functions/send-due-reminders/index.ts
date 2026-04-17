// Supabase Edge Function: send-due-reminders
//
// Run on a schedule (Supabase → Database → Cron, or external cron) every minute.
// Picks up reminders.fire_at <= now AND sent_at is null AND cancelled_at is null,
// sends a Web Push to every caregiver with notify_meds = true and a subscription,
// then marks the reminder as sent.
//
// Required secrets (Project Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT  (e.g. mailto:dana@example.com)
//   SUPABASE_URL  (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY  (auto-injected)
//
// Deploy with:
//   supabase functions deploy send-due-reminders

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPub = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const vapidPriv = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:noreply@henri.app';

  webpush.setVapidDetails(subject, vapidPub, vapidPriv);

  const supabase = createClient(url, serviceKey);
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from('reminders')
    .select('id, baby_id, medication_id')
    .lte('fire_at', nowIso)
    .is('sent_at', null)
    .is('cancelled_at', null)
    .limit(100);

  if (error) {
    return new Response(`error fetching reminders: ${error.message}`, { status: 500 });
  }
  if (!due || due.length === 0) {
    return new Response('no reminders due', { status: 200 });
  }

  let sent = 0;
  for (const r of due) {
    const { data: med } = await supabase
      .from('medications')
      .select('name, dose_amount, dose_unit, baby_id')
      .eq('id', r.medication_id!)
      .single();

    const { data: babyRow } = await supabase
      .from('babies')
      .select('name')
      .eq('id', r.baby_id)
      .single();
    const babyName = babyRow?.name ?? 'baby';

    const { data: caregivers } = await supabase
      .from('caregivers')
      .select('id, web_push_subscription')
      .eq('baby_id', r.baby_id)
      .eq('notify_meds', true)
      .not('web_push_subscription', 'is', null);

    const payload = JSON.stringify({
      title: med ? `${babyName}\u2019s ${med.name} is due` : `${babyName}\u2019s medication is due`,
      body: med ? `Safe to give ${med.dose_amount} ${med.dose_unit} now.` : 'Safe to give now.',
      url: med ? `/medications/${r.medication_id}` : '/medications',
      tag: `med-${r.medication_id}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });

    for (const c of caregivers ?? []) {
      try {
        await webpush.sendNotification(c.web_push_subscription as object, payload);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 410 Gone or 404 — subscription is dead, clear it.
        if (status === 410 || status === 404) {
          await supabase
            .from('caregivers')
            .update({ web_push_subscription: null, notify_meds: false })
            .eq('id', c.id);
        }
        console.warn('push failed', c.id, err);
      }
    }

    await supabase
      .from('reminders')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', r.id);
    sent++;
  }

  return new Response(`sent ${sent} reminders`, { status: 200 });
});
