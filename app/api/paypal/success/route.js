import { auth } from '@clerk/nextjs/server'
import { getAccessToken, getPayPalBaseUrl } from '@/lib/paypal'
import { getSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('token')

    if (!subscriptionId) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Verify the subscription with PayPal
    const accessToken = await getAccessToken()
    const res = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const subscription = await res.json()

    // Prefer custom_id (set to Clerk userId at creation) over session
    const { userId: sessionUserId } = await auth()
    const userId = subscription.custom_id || sessionUserId

    if (userId && ['ACTIVE', 'APPROVED'].includes(subscription.status)) {
      const supabase = getSupabaseServer()
      await supabase.from('user_plans').upsert(
        { user_id: userId, plan: 'pro', lemon_order_id: subscriptionId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }

    return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url))
  } catch (err) {
    console.error('PayPal success error:', err)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
