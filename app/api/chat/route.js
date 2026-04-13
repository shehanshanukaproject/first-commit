import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Truncate transcript to ~60k chars to stay within context limits
function trimTranscript(transcript) {
  const MAX = 60000
  if (!transcript || transcript.length <= MAX) return transcript
  return transcript.slice(0, MAX) + '\n\n[Transcript truncated for context limit]'
}

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, transcript } = await request.json()

    if (!messages || !transcript) {
      return Response.json({ error: 'Missing messages or transcript' }, { status: 400 })
    }

    if (messages.length > 20) {
      return Response.json({ error: 'Chat limit reached for this lecture. Start a new lecture to continue.' }, { status: 429 })
    }

    const trimmed = trimTranscript(transcript)

    let lastError
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // First call — Claude may decide to use web search
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: `You are an expert CS tutor and study assistant. You have access to the full lecture transcript below AND a web search tool to look up additional information when needed.

Your goal: give precise, correct, deeply knowledgeable answers. When the lecture alone isn't enough to give a complete answer, use web search to supplement your knowledge. Always cite whether your answer comes from the lecture, your training knowledge, or a web search.

Rules:
- Be thorough but concise. Prioritise accuracy over speed.
- If a concept from the lecture needs more depth, expand on it using your training knowledge.
- Use web search when asked about current documentation, specific syntax, real-world examples, or anything you're uncertain about.
- Format answers clearly: use bullet points, numbered steps, or code blocks where appropriate.

Lecture transcript:
${trimmed}`,
          tools: [
            {
              type: 'web_search_20250305',
              name: 'web_search',
            }
          ],
          messages: messages.map((m) => ({ role: m.role, content: m.content }))
        })

        // Handle tool use — Claude called web_search, loop to get final answer
        let finalResponse = response
        while (finalResponse.stop_reason === 'tool_use') {
          const toolUseBlock = finalResponse.content.find(b => b.type === 'tool_use')
          if (!toolUseBlock) break

          // Feed tool result back to Claude
          finalResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: `You are an expert CS tutor and study assistant. You have access to the full lecture transcript below AND a web search tool.

Your goal: give precise, correct, deeply knowledgeable answers. Always cite whether your answer comes from the lecture, your training knowledge, or a web search.

Lecture transcript:
${trimmed}`,
            tools: [
              {
                type: 'web_search_20250305',
                name: 'web_search',
              }
            ],
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'assistant', content: finalResponse.content },
              {
                role: 'user',
                content: finalResponse.content
                  .filter(b => b.type === 'tool_use')
                  .map(b => ({
                    type: 'tool_result',
                    tool_use_id: b.id,
                    content: b.input?.query ? `Search results for: ${b.input.query}` : 'No results'
                  }))
              }
            ]
          })
        }

        const textBlock = finalResponse.content.find(b => b.type === 'text')
        return Response.json({ reply: textBlock?.text || 'No response generated.' })

      } catch (err) {
        lastError = err
        if (err.status !== 529 && err.status !== 429) break
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)))
      }
    }

    console.error('Chat error:', lastError)
    const isOverloaded = lastError?.status === 529 || lastError?.type === 'overloaded_error'
    return Response.json(
      { error: isOverloaded ? 'Claude is busy right now — please try again in a moment.' : (lastError?.message || 'Unknown error') },
      { status: isOverloaded ? 503 : 500 }
    )
  } catch (error) {
    console.error('Chat error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
