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
    .replace(/\r\n/g, '\n')                              // normalise line endings
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // strip control chars only — keeps accents, CJK, emoji
    .replace(/\n{3,}/g, '\n\n')                          // collapse excessive blank lines
    .replace(/ {2,}/g, ' ')                              // collapse multiple spaces
    .trim()
    .slice(0, 50000)
}
