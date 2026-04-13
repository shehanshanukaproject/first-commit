import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseServer } from '@/lib/supabase-server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript } = await request.json()

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count } = await getSupabaseServer()
      .from('lectures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)
    if (count >= 3) {
      return Response.json({ error: 'Free plan limit reached. Upgrade to Pro for unlimited lectures.' }, { status: 429 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are an expert CS tutor. Analyze this lecture transcript and return a JSON object with exactly this structure:

{
  "title": "lecture title",
  "summary": "2-3 sentence overview",
  "concepts": [
    {
      "name": "concept name",
      "explanation": "clear plain-English explanation",
      "example": "code example or analogy",
      "examTip": "common exam question about this"
    }
  ],
  "keyPoints": ["point 1", "point 2", "point 3"],
  "resources": [
    {
      "type": "youtube",
      "title": "resource title",
      "search": "search query to find it"
    }
  ]
}

Return only valid JSON, no extra text.

Transcript:
${transcript}`
        }
      ]
    })

    const raw = message.content[0].text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const notes = JSON.parse(raw)

    const { data: lecture, error: dbError } = await getSupabaseServer()
      .from('lectures')
      .insert({
        user_id: userId,
        title: notes.title,
        transcript,
        notes
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Supabase insert error:', dbError)
      // Still return notes even if save fails
      return Response.json({ notes, lectureId: null })
    }

    return Response.json({ notes, lectureId: lecture.id })

  } catch (error) {
    console.error('Notes error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}