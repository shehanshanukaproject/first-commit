import { auth } from '@clerk/nextjs/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET(request, { params }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await getSupabaseServer()
      .from('lectures')
      .select('id, title, transcript, notes, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Lecture not found' }, { status: 404 })
    }

    return Response.json({ lecture: data })
  } catch (error) {
    console.error('Lecture fetch error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
