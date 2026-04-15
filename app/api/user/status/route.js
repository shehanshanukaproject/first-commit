import { auth } from '@clerk/nextjs/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getUserSubscription, isProUser } from '@/lib/subscription'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServer()

    // Run all queries in parallel
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString()

    const [subscription, uploadCountResult, knowledgeResult] = await Promise.all([
      getUserSubscription(userId),

      // Uploads this month
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth),

      // User knowledge base info
      supabase
        .from('user_knowledge')
        .select('combined_knowledge, total_uploads, last_updated')
        .eq('user_id', userId)
        .single(),
    ])

    const isPro             = isProUser(subscription)
    const uploadsThisMonth  = uploadCountResult.count || 0
    const knowledge         = knowledgeResult.data
    const knowledgeSize     = knowledge?.combined_knowledge?.length || 0
    const totalUploads      = knowledge?.total_uploads || 0
    const lastUpdated       = knowledge?.last_updated || null

    return Response.json({
      is_pro:               isPro,
      uploads_this_month:   uploadsThisMonth,
      limit:                3,
      total_uploads:        totalUploads,
      knowledge_base_size:  knowledgeSize,
      last_updated:         lastUpdated,
    })

  } catch (error) {
    return Response.json({
      is_pro:              false,
      uploads_this_month:  0,
      limit:               3,
      total_uploads:       0,
      knowledge_base_size: 0,
      last_updated:        null,
    })
  }
}
