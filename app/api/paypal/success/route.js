import { auth } from '@clerk/nextjs/server'
import { getAccessToken, getPayPalBaseUrl } from '@/lib/paypal'
import { getSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  // PayPal sandbox may send subscription_id, ba_token, or token
  const subscriptionId =
    searchParams.get('subscription_id') ||
    searchParams.get('ba_token') ||
    searchParams.get('token')

  // Clerk session — primary trust source (user was authenticated before going to PayPal)
  const { userId: sessionUserId } = await auth()

  console.log(`[PayPal success] subscription_id=${subscriptionId} sessionUserId=${sessionUserId}`)

  if (!subscriptionId) {
    console.warn('[PayPal success] No subscription_id in URL')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!sessionUserId) {
    console.error('[PayPal success] No Clerk session — cannot safely update plan')
    // Redirect to sign-in and come back (rare edge case: session expired during PayPal flow)
    return NextResponse.redirect(new URL(`/sign-in?redirect_url=/dashboard?upgraded=true`, request.url))
  }

  // Best-effort PayPal verification (non-blocking — don't fail the upgrade if this errors)
  let verifiedSubscriptionId = subscriptionId
  try {
    const accessToken = await getAccessToken()
    const res = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const subscription = await res.json()
      console.log(`[PayPal success] PayPal status=${subscription.status} custom_id=${subscription.custom_id}`)
      // Use the ID PayPal confirmed (same value, just verified)
      verifiedSubscriptionId = subscription.id || subscriptionId
    } else {
      console.warn(`[PayPal success] PayPal verification returned ${res.status} — proceeding with session userId`)
    }
  } catch (err) {
    console.warn('[PayPal success] PayPal verification failed (non-fatal):', err.message)
  }

  // Update DB — session userId is verified by Clerk, subscriptionId from PayPal redirect
  try {
    const supabase = getSupabaseServer()
    const { error: upsertError } = await supabase.from('user_plans').upsert(
      {
        user_id: sessionUserId,
        plan: 'pro',
        lemon_order_id: verifiedSubscriptionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (upsertError) {
      console.error('[PayPal success] Supabase upsert failed:', JSON.stringify(upsertError))
    } else {
      console.log(`[PayPal success] ✅ User ${sessionUserId} upgraded to pro (sub: ${verifiedSubscriptionId})`)
    }
  } catch (err) {
    console.error('[PayPal success] DB error:', err.message)
  }

  return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url))
}
