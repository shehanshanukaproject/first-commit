import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript } = await request.json()
    if (!transcript) {
      return Response.json({ error: 'No transcript provided.' }, { status: 400 })
    }

    const trimmed = transcript.length > 60000 ? transcript.slice(0, 60000) : transcript

    let lastError
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          messages: [
            {
              role: 'user',
              content: `You are an expert CS tutor creating a quiz from a lecture transcript. Generate exactly 10 multiple-choice questions that test understanding of the key concepts covered.

Return ONLY a JSON array with exactly this structure — no extra text, no markdown fences:
[
  {
    "question": "question text",
    "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
    "answer": "A"
  }
]

Rules:
- Each question must have exactly 4 options labelled A, B, C, D
- The "answer" field must be just the letter: A, B, C, or D
- Questions should vary in difficulty (easy, medium, hard)
- Focus on concepts, definitions, and application — not trivial details
- Make wrong options plausible but clearly incorrect to someone who understood the lecture

Transcript:
${trimmed}`
            }
          ]
        })

        const raw = message.content[0].text
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()
        const questions = JSON.parse(raw)

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error('Invalid quiz format returned by AI.')
        }

        return Response.json({ questions })
      } catch (err) {
        lastError = err
        if (err.status !== 529 && err.status !== 429) break
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
      }
    }

    console.error('Quiz generation error:', lastError)
    const isOverloaded = lastError?.status === 529
    return Response.json(
      { error: isOverloaded ? 'AI is busy — please try again in a moment.' : (lastError?.message ?? 'Failed to generate quiz.') },
      { status: isOverloaded ? 503 : 500 }
    )
  } catch (error) {
    console.error('Quiz error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
