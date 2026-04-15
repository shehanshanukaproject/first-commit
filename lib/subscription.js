import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * Fetch the user_plans row for a given userId.
 * Returns the row object, or null if not found / on error.
 */
export async function getUserSubscription(userId) {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('user_plans')
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
 * Returns true only if the user has an active Pro plan.
 */
export function isProUser(subscription) {
  return subscription !== null && subscription?.plan === 'pro'
}
