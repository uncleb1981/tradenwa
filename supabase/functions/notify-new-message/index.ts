import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const message = payload.record;

    if (!message) return new Response('no record', { status: 200 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Only send email on the very first message in the conversation
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', message.conversation_id);

    if ((count ?? 0) > 1) {
      return new Response('not first message', { status: 200 });
    }

    // Get conversation + listing + both users
    const { data: conv } = await supabase
      .from('conversations')
      .select(`
        id, user_1_id, user_2_id,
        listings(title, offering),
        user1:profiles!conversations_user_1_id_fkey(id, name),
        user2:profiles!conversations_user_2_id_fkey(id, name)
      `)
      .eq('id', message.conversation_id)
      .single();

    if (!conv) return new Response('no conversation', { status: 200 });

    // Recipient is whoever did NOT send the message
    const recipientId = message.sender_id === conv.user_1_id ? conv.user_2_id : conv.user_1_id;
    const senderProfile = message.sender_id === conv.user_1_id ? conv.user1 : conv.user2;
    const recipientProfile = message.sender_id === conv.user_1_id ? conv.user2 : conv.user1;

    // Get recipient email from auth.users
    const { data: { user: recipientUser } } = await supabase.auth.admin.getUserById(recipientId);
    if (!recipientUser?.email) return new Response('no email', { status: 200 });

    const listingTitle = conv.listings?.title || 'your listing';
    const senderName = senderProfile?.name || 'Someone';
    const recipientName = recipientProfile?.name || 'there';
    const chatUrl = `https://tradenwa.com/inbox/${conv.id}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2D4B8E;padding:32px;text-align:center;">
            <div style="font-size:32px;font-weight:900;color:white;letter-spacing:-1px;">TradeNWA</div>
            <div style="font-size:14px;color:#EAB308;font-weight:600;margin-top:4px;">Swap Happens</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#6B7280;">Hi ${recipientName},</p>
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#111827;">You have a new trade offer</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              <strong>${senderName}</strong> has reached out about your listing <strong>"${listingTitle}"</strong>.
            </p>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px;">
                  <a href="${chatUrl}" style="display:inline-block;background:#2D4B8E;color:white;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;">
                    View Message
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
              Reply directly on TradeNWA to keep the conversation going. You will only receive this email once per trade offer.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;padding:20px 32px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">TradeNWA &middot; Local barter for Northwest Arkansas</p>
            <p style="margin:4px 0 0;font-size:12px;color:#D1D5DB;">tradenwa.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TradeNWA <noreply@tradenwa.com>',
        to: recipientUser.email,
        subject: `${senderName} sent you a trade offer on TradeNWA`,
        html: emailHtml,
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      console.error('Resend send failed:', resendResp.status, errBody);
      return new Response('resend error', { status: 502 });
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('error', { status: 500 });
  }
});
