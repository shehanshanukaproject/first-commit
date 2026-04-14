import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * Fetch the subscription row for a given userId.
 * Returns the single row object, or null if not found / on error.
 */
export async function getUserSubscription(userId) {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

/**
 * Returns true only if the subscription exists and is active.
 */
export function isProUser(subscription) {
  return subscription !== null && subscription?.status === 'active'
}

/**
 * Returns the Paddle customer ID for a user, creating one if it doesn't exist.
 * Saves the customer ID to the subscriptions table so it is only created once.
 */
export async function getOrCreateCustomer(userId, email) {
  const supabase = getSupabaseServer()

  // 1. Check if a paddle_customer_id already exists for this user
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('paddle_customer_id')
    .eq('user_id', userId)
    .single()

  if (existing?.paddle_customer_id) {
    return existing.paddle_customer_id
  }

  // 2. Create a new customer in Paddle
  const response = await fetch('https://api.paddle.com/customers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      custom_data: { user_id: userId },
    }),
  })

  const result = await response.json()
  const customerId = result?.data?.id

  if (!customerId) {
    throw new Error(`Paddle customer creation failed: ${JSON.stringify(result)}`)
  }

  // 3. Save the customer ID to Supabase
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      paddle_customer_id: customerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return customerId
}
