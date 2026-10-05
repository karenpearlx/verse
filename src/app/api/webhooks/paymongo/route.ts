import { apiError } from '@/lib/api';
import { paymongoLivemodeExpected, verifyPaymongoSignature } from '@/lib/paymongo';
import { createServiceClient } from '@/lib/supabase/service';

type Json = Record<string, unknown>;
const object = (value: unknown): Json => value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
const text = (value: unknown) => typeof value === 'string' ? value : null;
const integer = (value: unknown) => Number.isInteger(value) ? Number(value) : null;

function eventParts(payload: Json) {
  const envelope = object(payload.data);
  const attributes = object(envelope.attributes);
  // Standard webhook envelope uses data.attributes; Hosted Checkout's current
  // docs also show a send.webhook wrapper with fields directly under data.
  const eventType = text(attributes.type) ?? text(envelope.type);
  const livemode = typeof attributes.livemode === 'boolean'
    ? attributes.livemode
    : typeof envelope.livemode === 'boolean' ? envelope.livemode : false;
  const resource = object(attributes.data ?? envelope.data);
  return {
    eventId: text(envelope.id) ?? `${eventType ?? 'event'}:${text(resource.id) ?? 'unknown'}:${text(envelope.updated_at) ?? integer(attributes.updated_at) ?? 'unknown'}`,
    eventType,
    livemode,
    resource,
  };
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    let payload: Json;
    try {
      payload = object(JSON.parse(raw));
    } catch {
      return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
    }

    const event = eventParts(payload);
    const signature = request.headers.get('x-paymongo-signature') ?? request.headers.get('paymongo-signature');
    if (!verifyPaymongoSignature(raw, signature, event.livemode)) {
      return Response.json({ error: 'Invalid signature.' }, { status: 401 });
    }
    if (event.livemode !== paymongoLivemodeExpected()) return Response.json({ received: true, ignored: 'mode' });
    if (!event.eventType || !event.eventId) return Response.json({ received: true, ignored: 'shape' });

    const db = createServiceClient();
    const resourceId = text(event.resource.id);
    const attrs = object(event.resource.attributes);

    if (event.eventType === 'checkout_session.payment.paid' && resourceId) {
      const metadata = object(attrs.metadata);
      const userId = text(metadata.user_id);
      if (userId && text(metadata.tier) === 'pro') {
        const payments = Array.isArray(attrs.payments) ? attrs.payments.map(object) : [];
        const paid = object(payments.find((item) => text(object(item.attributes).status) === 'paid')?.attributes);
        const { error } = await db.rpc('activate_pro_checkout', {
          event_id: event.eventId,
          account_id: userId,
          checkout_id: resourceId,
          paid_amount: integer(paid.amount),
          paid_currency: text(paid.currency) ?? 'PHP',
          event_metadata: metadata,
        });
        if (error) throw error;
      }
      return Response.json({ received: true });
    }

    // Pro is a one-off prepaid purchase through Hosted Checkout, so the paid
    // checkout session above is the only event that changes an account.
    // Recurring subscription.* events are ignored on purpose: handling them
    // once put "Renews on" in front of a product whose pitch is no auto-renew.
    return Response.json({ received: true, ignored: 'type' });
  } catch (error) {
    return apiError(error);
  }
}
