import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { getSupabaseServer } from '@/lib/supabase-server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count } = await getSupabaseServer()
      .from('lectures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)
    if (count >= 3) {
      return Response.json({ error: 'Free plan limit reached. Upgrade to Pro for unlimited lectures.' }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en'
    })

    return Response.json({ transcript: transcription.text })

  } catch (error) {
    console.error('Transcription error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}