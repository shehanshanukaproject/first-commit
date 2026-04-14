import { auth } from '@clerk/nextjs/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseServer()

    // Get plan
    const { data: planData } = await supabase
      .from('user_plans')
      .select('plan')
      .eq('user_id', userId)
      .single()

    // Get lecture count this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('lectures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)

    return Response.json({
      plan: planData?.plan || 'free',
      lecturesThisMonth: count || 0,
      lectureLimit: 3,
    })
  } catch {
    return Response.json({ plan: 'free', lecturesThisMonth: 0, lectureLimit: 3 })
  }
}
