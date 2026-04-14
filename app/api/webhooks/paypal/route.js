import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const eventType = body.event_type
    const resource = body.resource

    const supabase = getSupabaseServer()

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const userId = resource.custom_id
      const subscriptionId = resource.id
      if (userId) {
        await supabase.from('user_plans').upsert(
          { user_id: userId, plan: 'pro', lemon_order_id: subscriptionId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        console.log(`[PayPal] User ${userId} upgraded to pro (subscription: ${subscriptionId})`)
      }
    }

    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
      const userId = resource.custom_id
      if (userId) {
        await supabase.from('user_plans').upsert(
          { user_id: userId, plan: 'free', lemon_order_id: null, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        console.log(`[PayPal] User ${userId} downgraded to free (${eventType})`)
      }
    }

    if (eventType === 'PAYMENT.SALE.COMPLETED') {
      console.log(`[PayPal] Payment completed: ${resource.id} — amount: ${resource.amount?.total} ${resource.amount?.currency}`)
    }

    return Response.json({ received: true })
  } catch (err) {
    console.error('PayPal webhook error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
