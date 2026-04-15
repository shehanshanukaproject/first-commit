import { auth } from '@clerk/nextjs/server'

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return Response.json({ error: 'File must be a PDF.' }, { status: 400 })
    }

    const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'PDF is too large. Maximum size is 50 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const pdfParseMod = await import('pdf-parse')
    const pdfParse = pdfParseMod.default ?? pdfParseMod
    const data = await pdfParse(buffer)

    const rawText = data.text?.trim() ?? ''
    if (!rawText) {
      return Response.json(
        { error: 'No text found in this PDF. It may be scanned or image-based and requires OCR.' },
        { status: 422 }
      )
    }

    const MAX_CHARS = 500000
    const truncated = rawText.length > MAX_CHARS
    const text = truncated ? rawText.slice(0, MAX_CHARS) : rawText

    return Response.json({ text, pages: data.numpages, truncated })
  } catch (error) {
    console.error('PDF extract error:', error)
    return Response.json(
      { error: 'Failed to parse PDF. The file may be corrupted or password-protected.' },
      { status: 500 }
    )
  }
}
