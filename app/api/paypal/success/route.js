import { auth } from '@clerk/nextjs/server'
import { getAccessToken, getPayPalBaseUrl } from '@/lib/paypal'
import { getSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('token')

    if (!subscriptionId) {
      console.warn('[PayPal success] No subscription_id in URL — redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Verify the subscription with PayPal
    const accessToken = await getAccessToken()
    const res = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const subscription = await res.json()

    console.log(`[PayPal success] subscription_id=${subscriptionId} status=${subscription.status} custom_id=${subscription.custom_id}`)

    // Prefer custom_id (set to Clerk userId at creation) over active session
    const { userId: sessionUserId } = await auth()
    const userId = subscription.custom_id || sessionUserId

    if (!userId) {
      console.error('[PayPal success] No userId found — cannot update plan')
      return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url))
    }

    // Accept any status that means the user has agreed to pay:
    // APPROVAL_PENDING, APPROVED, ACTIVE are all valid post-approval states
    const validStatuses = ['ACTIVE', 'APPROVED', 'APPROVAL_PENDING']
    if (validStatuses.includes(subscription.status)) {
      const supabase = getSupabaseServer()
      const { error: upsertError } = await supabase.from('user_plans').upsert(
        {
          user_id: userId,
          plan: 'pro',
          lemon_order_id: subscriptionId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      if (upsertError) {
        console.error('[PayPal success] Supabase upsert failed:', upsertError)
      } else {
        console.log(`[PayPal success] User ${userId} upgraded to pro ✅`)
      }
    } else {
      console.warn(`[PayPal success] Unexpected subscription status: ${subscription.status} — skipping DB update`)
    }

    return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url))
  } catch (err) {
    console.error('[PayPal success] Unhandled error:', err)
    return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url))
  }
}
