import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseServer } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an intelligent study assistant trained on a student's uploaded lecture materials. Answer questions clearly and accurately based on the provided lecture content.

Rules:
- Answer ONLY based on the provided lecture content
- If the answer is not in the content, say "This topic was not covered in your uploaded lectures"
- Give detailed explanations with examples when possible
- If asked for practice questions, generate them based on the content
- Format code examples in code blocks
- Be encouraging and supportive

You have access to:
1. The specific lecture they are asking about (if provided)
2. All their previously uploaded lecture knowledge`

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, messages, lectureId } = await request.json()

    // Support both single `message` (new API) and `messages` array (legacy)
    const userMessage = message || (messages && messages[messages.length - 1]?.content)
    if (!userMessage) {
      return Response.json({ error: 'No message provided.' }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // ── Fetch user's full knowledge base ────────────────────────────────────
    const { data: knowledge } = await supabase
      .from('user_knowledge')
      .select('combined_knowledge, total_uploads, last_updated')
      .eq('user_id', userId)
      .single()

    // ── Fetch specific lecture content if lectureId provided ────────────────
    let lectureContent = null
    if (lectureId) {
      const { data: lecture } = await supabase
        .from('lectures')
        .select('combined_content, title, file_type')
        .eq('id', lectureId)
        .eq('user_id', userId)
        .single()

      if (lecture?.combined_content) {
        lectureContent = {
          content: lecture.combined_content.slice(0, 80000),
          title:   lecture.title,
          type:    lecture.file_type,
        }
      }
    }

    // ── Build context block ──────────────────────────────────────────────────
    const contextParts = []

    if (lectureContent) {
      contextParts.push(
        `=== PRIMARY LECTURE: "${lectureContent.title}" ===\n${lectureContent.content}`
      )
    }

    if (knowledge?.combined_knowledge) {
      const secondary = knowledge.combined_knowledge.slice(0, lectureContent ? 40000 : 120000)
      contextParts.push(
        `=== ALL UPLOADED LECTURES (knowledge base) ===\n${secondary}`
      )
    }

    if (contextParts.length === 0) {
      return Response.json({
        reply: "You haven't uploaded any lectures yet. Upload a lecture first and I'll be able to answer questions about it!"
      })
    }

    const context = contextParts.join('\n\n')

    // ── Build message history ────────────────────────────────────────────────
    // Support both legacy `messages` array and new single-message format
    let history = []
    if (messages && Array.isArray(messages) && messages.length > 1) {
      // Legacy: full messages array passed from frontend
      history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    }

    const claudeMessages = [
      ...history,
      { role: 'user', content: userMessage },
    ]

    // ── Stream response from Claude ──────────────────────────────────────────
    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model:      'claude-sonnet-4-6',
            max_tokens: 2000,
            system:     `${SYSTEM_PROMPT}\n\n${context}`,
            messages:   claudeMessages,
          })

          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta?.type === 'text_delta' &&
              chunk.delta.text
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }

          controller.close()
        } catch (err) {
          const isOverloaded = err?.status === 529 || err?.type === 'overloaded_error'
          const msg = isOverloaded
            ? 'Claude is busy right now — please try again in a moment.'
            : 'Something went wrong. Please try again.'
          controller.enqueue(encoder.encode(`__ERROR__:${msg}`))
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })

  } catch (error) {
    return Response.json({ error: error.message || 'Chat failed.' }, { status: 500 })
  }
}
