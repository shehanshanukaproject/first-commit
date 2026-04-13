import { auth } from '@clerk/nextjs/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await getSupabaseServer()
      .from('lectures')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ lectures: data })
  } catch (error) {
    console.error('Lectures error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
