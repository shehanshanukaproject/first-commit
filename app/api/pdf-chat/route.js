import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, pdfText } = await request.json()

    if (!messages || !pdfText) {
      return Response.json({ error: 'Missing messages or PDF content.' }, { status: 400 })
    }

    if (messages.length > 40) {
      return Response.json(
        { error: 'Chat limit reached for this document. Please upload a new PDF to continue.' },
        { status: 429 }
      )
    }

    let lastError
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: `You are an expert document analyst and Q&A assistant. The user has uploaded a PDF document and wants to ask questions about it.

Answer questions accurately based on the document content below. If something is not covered in the document, say so clearly but still help with general knowledge if relevant. Format your answers clearly — use bullet points, numbered lists, or code blocks where appropriate.

PDF document content:
${pdfText}`,
          messages: messages.map((m) => ({ role: m.role, content: m.content }))
        })

        const textBlock = response.content.find((b) => b.type === 'text')
        return Response.json({ reply: textBlock?.text ?? 'No response generated.' })
      } catch (err) {
        lastError = err
        if (err.status !== 529 && err.status !== 429) break
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
      }
    }

    console.error('PDF chat error:', lastError)
    const isOverloaded = lastError?.status === 529
    return Response.json(
      { error: isOverloaded ? 'AI is busy — please try again in a moment.' : (lastError?.message ?? 'Unknown error') },
      { status: isOverloaded ? 503 : 500 }
    )
  } catch (error) {
    console.error('PDF chat error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
