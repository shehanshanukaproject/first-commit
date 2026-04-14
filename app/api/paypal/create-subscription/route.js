import { auth } from '@clerk/nextjs/server'
import { getAccessToken, getOrCreatePlanId, getPayPalBaseUrl } from '@/lib/paypal'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const accessToken = await getAccessToken()
    const planId = await getOrCreatePlanId(accessToken)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
    if (!subscription.id) {
      throw new Error(subscription.message || 'Failed to create PayPal subscription')
    }

    const approvalUrl = subscription.links?.find(l => l.rel === 'approve')?.href
    if (!approvalUrl) throw new Error('No approval URL returned from PayPal')

    return Response.json({ subscriptionId: subscription.id, approvalUrl })
  } catch (err) {
    console.error('PayPal create-subscription error:', err)
    const isConfig = err.message?.includes('not configured')
    return Response.json(
      { error: isConfig ? 'Payment service is temporarily unavailable. Please try again later.' : 'Failed to start checkout. Please try again.' },
      { status: 500 }
    )
  }
}
