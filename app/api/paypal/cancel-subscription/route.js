import { auth } from '@clerk/nextjs/server'
import { getAccessToken, getPayPalBaseUrl } from '@/lib/paypal'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseServer()

    // Get the user's PayPal subscription ID from DB
    const { data: planData, error: planError } = await supabase
      .from('user_plans')
      .select('lemon_order_id, plan')
      .eq('user_id', userId)
      .single()

    if (planError || !planData?.lemon_order_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 })
    }

    if (planData.plan !== 'pro') {
      return Response.json({ error: 'You are not on the Pro plan' }, { status: 400 })
    }

    const subscriptionId = planData.lemon_order_id

    // Cancel on PayPal
    const accessToken = await getAccessToken()
    const cancelRes = await fetch(
      `${getPayPalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Cancelled by user from account page' }),
      }
    )

    // PayPal returns 204 No Content on success
    if (cancelRes.status !== 204 && cancelRes.status !== 200) {
      const errBody = await cancelRes.json().catch(() => ({}))
      console.error('[PayPal cancel] Failed:', cancelRes.status, errBody)
      return Response.json(
        { error: errBody.message || 'Failed to cancel subscription with PayPal' },
        { status: 500 }
      )
    }

    // Downgrade user to free in DB
    const { error: upsertError } = await supabase.from('user_plans').upsert(
      {
        user_id: userId,
        plan: 'free',
        lemon_order_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (upsertError) {
      console.error('[PayPal cancel] DB update failed:', upsertError)
      return Response.json({ error: 'Subscription cancelled on PayPal but DB update failed' }, { status: 500 })
    }

    console.log(`[PayPal cancel] User ${userId} cancelled subscription ${subscriptionId}`)
    return Response.json({ success: true })
  } catch (err) {
    console.error('[PayPal cancel] Unhandled error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
