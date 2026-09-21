import { ApiError, apiError, requireActiveUser } from '@/lib/api';
import { paymongoRequest } from '@/lib/paymongo';
import { PRO_PRICE_CENTAVOS, hasPaidAccess, readSubscription } from '@/lib/subscription';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireActiveUser();
    if (!user.email) throw new ApiError(400, 'Your account needs an email address before checkout.');
    const account = await readSubscription(supabase, user.id);
    if (hasPaidAccess(account)) throw new ApiError(409, 'Your paid plan is already active.');

    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const origin = configured ? new URL(configured).origin : new URL(request.url).origin;
    const reference = `VERSE-PRO-${user.id}-${Date.now()}`;
    const payload = await paymongoRequest<{
      data?: { id?: string; attributes?: { checkout_url?: string } };
    }>('/v2/checkout_sessions', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{
              name: 'Verse Pro, one month',
              description: 'Unlimited career tools, premium courses, and early job access for 30 days.',
              amount: PRO_PRICE_CENTAVOS,
              currency: 'PHP',
              quantity: 1,
            }],
            payment_method_types: ['qrph', 'card', 'gcash', 'paymaya'],
            success_url: `${origin}/settings?checkout=success`,
            cancel_url: `${origin}/pricing?checkout=cancelled`,
            customer_email: user.email,
            billing: { email: user.email, name: user.user_metadata?.full_name || user.email.split('@')[0] },
            description: 'Verse Pro — 30 days prepaid, no auto-renew',
            reference_number: reference,
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            metadata: { user_id: user.id, tier: 'pro', access_days: '30' },
          },
        },
      }),
    });

    const checkoutId = payload.data?.id;
    const checkoutUrl = payload.data?.attributes?.checkout_url;
    if (!checkoutId || !checkoutUrl) throw new ApiError(502, 'PayMongo returned an incomplete checkout session.');

    const { error } = await createServiceClient()
      .from('users')
      .update({ paymongo_checkout_session_id: checkoutId })
      .eq('id', user.id);
    if (error) throw error;
    return Response.json({ checkout_url: checkoutUrl }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
