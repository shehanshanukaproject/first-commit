// pdf-parse is loaded dynamically inside the function to avoid module
// initialisation errors on Vercel (the package runs test-file code on load).

export async function extractFromPDF(buffer) {
  try {
    const { default: pdfParse } = await import('pdf-parse')
    const data = await pdfParse(buffer)
    if (!data.text || !data.text.trim()) {
      throw new Error('No text found in this PDF. It may be scanned or image-based.')
    }
    return data.text
  } catch (error) {
    if (error.message.includes('No text found')) throw error
    throw new Error('Failed to extract PDF text: ' + error.message)
  }
}

export function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim()
    .slice(0, 50000)
}
