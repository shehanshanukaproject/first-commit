import crypto from 'crypto'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-signature')
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

    // Verify webhook signature
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret)
      const digest = hmac.update(rawBody).digest('hex')
      if (digest !== signature) {
        console.error('Webhook signature mismatch')
        return Response.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload?.meta?.event_name

    // Handle relevant events
    if (
      eventName === 'order_created' ||
      eventName === 'subscription_created' ||
      eventName === 'subscription_updated'
    ) {
      const userId = payload?.meta?.custom_data?.user_id
      const orderId = payload?.data?.id
      const status = payload?.data?.attributes?.status

      // Only activate Pro for paid/active orders
      const isActive =
        status === 'paid' || status === 'active' || status === 'on_trial'

      if (userId && isActive) {
        const supabase = getSupabaseServer()
        const { error } = await supabase
          .from('user_plans')
          .upsert(
            {
              user_id: userId,
              plan: 'pro',
              lemon_order_id: String(orderId),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )

        if (error) {
          console.error('Supabase upsert error:', error)
          // Return 200 to prevent Lemon Squeezy retrying — log and investigate manually
        }
      }
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      const userId = payload?.meta?.custom_data?.user_id
      if (userId) {
        const supabase = getSupabaseServer()
        await supabase
          .from('user_plans')
          .upsert(
            {
              user_id: userId,
              plan: 'free',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
      }
    }

    return Response.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
