import { auth } from '@clerk/nextjs/server'
import { getAccessToken, getOrCreatePlanId, getPayPalBaseUrl, getAppUrl } from '@/lib/paypal'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    console.log(`[PayPal] Creating subscription for user: ${userId}`)

    const accessToken = await getAccessToken()
    console.log('[PayPal] Access token obtained')

    const planId = await getOrCreatePlanId(accessToken)
    console.log(`[PayPal] Using plan ID: ${planId}`)

    const appUrl = getAppUrl()
    console.log(`[PayPal] App URL: ${appUrl}`)

    const res = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${userId}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: userId,
        application_context: {
          brand_name: 'LectureAI',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${appUrl}/api/paypal/success`,
          cancel_url: `${appUrl}/api/paypal/cancel`,
        },
      }),
    })

    const subscription = await res.json()
    console.log('[PayPal] Subscription response:', JSON.stringify(subscription).slice(0, 300))

    if (!subscription.id) {
      throw new Error(subscription.message || subscription.details?.[0]?.description || 'Failed to create subscription')
    }

    const approvalUrl = subscription.links?.find(l => l.rel === 'approve')?.href
    if (!approvalUrl) throw new Error('No approval URL returned from PayPal')

    console.log(`[PayPal] Approval URL: ${approvalUrl}`)
    return Response.json({ subscriptionId: subscription.id, approvalUrl })

  } catch (err) {
    console.error('[PayPal] create-subscription error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
