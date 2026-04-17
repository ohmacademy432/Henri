// Supabase Edge Function: send-invitation
//
// Sends a branded invitation email when a row is created in `invitations`.
// Called from the client via supabase.functions.invoke('send-invitation', { body: { invitation_id } }).
//
// Email is sent via the Resend API (https://resend.com — free tier: 100/day, 3k/month).
// You can swap this for any HTTP-based email provider.
//
// Required secrets:
//   RESEND_API_KEY   (from https://resend.com/api-keys)
//   FROM_EMAIL       (verified sender, e.g. henri@yourdomain.com)
//   APP_URL          (e.g. https://henrirobert.netlify.app)
//   SUPABASE_URL                (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY   (auto-injected)
//
// Deploy with:
//   supabase functions deploy send-invitation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { invitation_id } = await req.json();
    if (!invitation_id) {
      return new Response('missing invitation_id', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: inv, error } = await supabase
      .from('invitations')
      .select('id, email, token, display_name, relationship, baby_id, invited_by')
      .eq('id', invitation_id)
      .single();
    if (error || !inv) return new Response('invitation not found', { status: 404 });

    const { data: baby }    = await supabase.from('babies').select('name').eq('id', inv.baby_id).single();
    const { data: inviter } = await supabase.from('caregivers').select('display_name').eq('id', inv.invited_by!).single();

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';
    const link = `${appUrl}/accept/${inv.token}`;
    const babyName = baby?.name ?? 'a child';
    const inviterName = inviter?.display_name ?? 'A friend';
    const greeting = inv.display_name ? `${inv.display_name},` : 'Hello,';

    const subject = `${inviterName} has opened ${babyName}\u2019s book to you`;

    const html = `
<!doctype html>
<html>
<body style="margin:0;background:#F4EDE0;font-family:Georgia,'Iowan Old Style',serif;color:#2A1F18;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#F9F4EA;border-radius:18px;padding:48px 36px;">
        <tr><td align="center">
          <div style="font-style:italic;font-size:48px;color:#2A1F18;line-height:1;">Henri</div>
          <div style="height:1px;width:48px;background:#B8895A;margin:24px auto;"></div>
          <p style="font-style:italic;font-size:18px;color:#4A3C32;line-height:1.5;margin:0 0 24px;">${greeting}</p>
          <p style="font-size:17px;line-height:1.6;color:#2A1F18;margin:0 0 28px;">
            ${inviterName} has invited you to read ${babyName}\u2019s book —
            a private, kept place of his days, his pictures, and his story.
          </p>
          <p style="margin:0 0 28px;">
            <a href="${link}"
               style="display:inline-block;background:#2A1F18;color:#F9F4EA;text-decoration:none;
                      font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.18em;
                      text-transform:uppercase;padding:14px 28px;border-radius:999px;">
              Open ${babyName}\u2019s book
            </a>
          </p>
          <p style="font-style:italic;font-size:14px;color:#8B7B6E;line-height:1.5;margin:0;">
            If the button does not open, copy this link into your browser:<br>
            <span style="word-break:break-all;">${link}</span>
          </p>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#8B7B6E;margin-top:24px;font-family:Helvetica,Arial,sans-serif;">
        This invitation expires in thirty days.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') ?? 'Henri <henri@example.com>',
        to: inv.email,
        subject,
        html,
      }),
    });

    if (!resend.ok) {
      const errText = await resend.text();
      return new Response(`email send failed: ${errText}`, { status: 502 });
    }

    return new Response('sent', { status: 200 });
  } catch (e) {
    return new Response(`error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
});
