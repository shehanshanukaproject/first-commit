import { getPayPalBaseUrl, getAccessToken } from '@/lib/paypal'
import { getSupabaseServer } from '@/lib/supabase-server'

// Disable body parsing so we can read raw bytes for signature verification
export const config = { api: { bodyParser: false } }

// ── Verify PayPal webhook signature ───────────────────────────────────────
// PayPal signs every webhook — we MUST verify before trusting it.

async function verifyWebhookSignature(request, rawBody) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) {
      console.warn('[Webhook] PAYPAL_WEBHOOK_ID not set — skipping signature verification (unsafe!)')
      return true
    }

    const accessToken = await getAccessToken()

    const headers = {
      'paypal-auth-algo':         request.headers.get('paypal-auth-algo')         || '',
      'paypal-cert-url':          request.headers.get('paypal-cert-url')          || '',
      'paypal-transmission-id':   request.headers.get('paypal-transmission-id')   || '',
      'paypal-transmission-sig':  request.headers.get('paypal-transmission-sig')  || '',
      'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
    }

    const verifyRes = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo:         headers['paypal-auth-algo'],
        cert_url:          headers['paypal-cert-url'],
        transmission_id:   headers['paypal-transmission-id'],
        transmission_sig:  headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id:        webhookId,
        webhook_event:     JSON.parse(rawBody),
      }),
    })

    const result = await verifyRes.json()
    console.log('[Webhook] Signature verification result:', result.verification_status)
    return result.verification_status === 'SUCCESS'

  } catch (err) {
    console.error('[Webhook] Signature verification error:', err.message)
    return false
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────

async function handleSubscriptionActivated(event) {
  const sub    = event.resource
  const userId = sub.custom_id || sub.subscriber?.payer_id
  const subId  = sub.id

  if (!userId) { console.warn('[Webhook] ACTIVATED — no custom_id/userId'); return }

  console.log(`[Webhook] ACTIVATED — upgrading user ${userId} (sub: ${subId})`)

  const supabase = getSupabaseServer()
  const { error } = await supabase.from('user_plans').upsert(
    {
      user_id:       userId,
      plan:          'pro',
      lemon_order_id: subId,
      updated_at:    new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) console.error('[Webhook] DB upsert error (ACTIVATED):', error.message)
  else       console.log(`[Webhook] ✅ User ${userId} → pro`)
}

async function handleSubscriptionCancelled(event) {
  const sub    = event.resource
  const userId = sub.custom_id || sub.subscriber?.payer_id
  const subId  = sub.id

  if (!userId) { console.warn('[Webhook] CANCELLED — no custom_id/userId'); return }

  console.log(`[Webhook] CANCELLED — downgrading user ${userId} (sub: ${subId})`)

  const supabase = getSupabaseServer()
  const { error } = await supabase.from('user_plans').upsert(
    {
      user_id:       userId,
      plan:          'free',
      lemon_order_id: subId,
      updated_at:    new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) console.error('[Webhook] DB upsert error (CANCELLED):', error.message)
  else       console.log(`[Webhook] ✅ User ${userId} → free`)
}

async function handlePaymentCompleted(event) {
  const sale   = event.resource
  const amount = sale.amount?.total
  const subId  = sale.billing_agreement_id

  console.log(`[Webhook] PAYMENT.SALE.COMPLETED — sub: ${subId} amount: $${amount}`)
  // You can log this to a payments table here if needed
}

async function handleSubscriptionExpired(event) {
  // Same as cancelled — treat expired subscriptions as downgrade
  return handleSubscriptionCancelled(event)
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function POST(request) {
  let rawBody = ''

  try {
    rawBody = await request.text()
  } catch {
    return Response.json({ error: 'Cannot read body' }, { status: 400 })
  }

  // Verify signature (skip only if PAYPAL_WEBHOOK_ID not set — dev mode)
  const isValid = await verifyWebhookSignature(request, rawBody)
  if (!isValid) {
    console.error('[Webhook] ❌ Signature verification failed — rejecting request')
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event_type || ''
  console.log(`[Webhook] Event received: ${eventType}`)

  try {
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RENEWED':
        await handleSubscriptionActivated(event)
        break

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionCancelled(event)
        break

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event)
        break

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event)
        break

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`)
    }
  } catch (err) {
    console.error(`[Webhook] Handler error for ${eventType}:`, err.message)
    // Return 200 anyway so PayPal doesn't retry endlessly
  }

  // Always return 200 — tells PayPal we received the event
  return Response.json({ received: true }, { status: 200 })
}
