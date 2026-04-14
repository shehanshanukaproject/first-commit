import { getSupabaseServer } from '@/lib/supabase-server'

export async function getUserSubscription(userId) {
  const supabase = getSupabaseServer()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data || null
}

export function isProUser(subscription) {
  return subscription !== null && subscription?.status === 'active'
}
