import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getUserSubscription, isProUser } from '@/lib/subscription'
import { extractFromPDF, cleanText } from '@/lib/extractContent'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 300

// File size limits
const LIMITS = {
  pdf:   50  * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  video: 500 * 1024 * 1024,
}
const WHISPER_LIMIT = 24 * 1024 * 1024

// Formats Whisper accepts natively — no ffmpeg needed
const WHISPER_NATIVE = new Set(['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.mpeg', '.mpga', '.ogg', '.flac'])
const MIME_MAP = {
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.wav':  'audio/wav',
  '.m4a':  'audio/m4a',
  '.webm': 'video/webm',
  '.mpeg': 'video/mpeg',
  '.mpga': 'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.flac': 'audio/flac',
}

// ── File type detection ────────────────────────────────────────────────────

function detectFileType(file) {
  const mime = (file.type || '').toLowerCase()
  const ext  = path.extname(file.name || '').toLowerCase()

  if (mime === 'application/pdf' || ext === '.pdf') return 'pdf'

  const videoExts  = ['.mp4', '.mov', '.avi', '.webm']
  const videoMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  if (videoExts.includes(ext) || videoMimes.includes(mime)) return 'video'

  const audioExts  = ['.mp3', '.wav', '.m4a']
  const audioMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a']
  if (audioExts.includes(ext) || audioMimes.includes(mime)) return 'audio'

  return null
}

// ── Whisper: send buffer directly (no ffmpeg) ─────────────────────────────

async function transcribeDirect(buffer, fileName) {
  const ext      = path.extname(fileName).toLowerCase()
  const mimeType = MIME_MAP[ext] || 'audio/mpeg'
  const blob     = new Blob([buffer], { type: mimeType })
  const whisperFile = new File([blob], fileName || 'audio.mp3', { type: mimeType })
  const result   = await openai.audio.transcriptions.create({ file: whisperFile, model: 'whisper-1' })
  return result.text
}

// ── ffmpeg fallback for MOV / AVI / files > 25 MB ─────────────────────────

function getFfmpeg() {
  const ffmpeg     = require('fluent-ffmpeg')
  const ffmpegPath = require('ffmpeg-static')
  const { path: ffprobePath } = require('@ffprobe-installer/ffprobe')
  ffmpeg.setFfmpegPath(ffmpegPath)
  ffmpeg.setFfprobePath(ffprobePath)
  return ffmpeg
}

function compressToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    getFfmpeg()(inputPath)
      .outputOptions(['-vn', '-ar', '16000', '-ac', '1', '-b:a', '32k'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', err => reject(new Error('Audio compression failed: ' + err.message)))
      .run()
  })
}

async function transcribeViaFfmpeg(buffer, fileName, tmpDir) {
  await fs.mkdir(tmpDir, { recursive: true })
  const ext       = path.extname(fileName) || '.tmp'
  const inputPath = path.join(tmpDir, 'input' + ext)
  const mp3Path   = path.join(tmpDir, 'compressed.mp3')
  await fs.writeFile(inputPath, buffer)
  await compressToMp3(inputPath, mp3Path)
  const stat = await fs.stat(mp3Path)
  if (stat.size > WHISPER_LIMIT) {
    throw new Error(
      'File is too long to transcribe after compression. ' +
      'Please trim it to under 2 hours or extract a shorter audio clip.'
    )
  }
  return await transcribeDirect(await fs.readFile(mp3Path), 'audio.mp3')
}

// ── Main transcription router ──────────────────────────────────────────────

async function transcribeAudioVideo(buffer, fileName, fileSize, fileType, tmpDir) {
  const ext = path.extname(fileName).toLowerCase()

  // Fast path: Whisper natively supports this format and it fits in one shot
  if (WHISPER_NATIVE.has(ext) && fileSize <= WHISPER_LIMIT) {
    return await transcribeDirect(buffer, fileName)
  }

  // For large but supported formats, still try direct first — Whisper may handle it
  if (WHISPER_NATIVE.has(ext) && fileSize <= LIMITS[fileType]) {
    try {
      return await transcribeDirect(buffer, fileName)
    } catch {
      // Fall through to ffmpeg
    }
  }

  // ffmpeg fallback: MOV, AVI, or oversized files
  return await transcribeViaFfmpeg(buffer, fileName, tmpDir)
}

// ── Claude: generate structured notes ─────────────────────────────────────

async function generateNotes(content) {
  const message = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role:    'user',
      content: `You are an expert academic tutor. Analyze this lecture content and return ONLY a valid JSON object — no extra text, no markdown fences:
{
  "title": "string",
  "summary": "3-4 sentence overview",
  "concepts": [{ "name": "string", "explanation": "string", "example": "string", "examTip": "string" }],
  "keyPoints": ["string"],
  "resources": [{ "type": "youtube", "title": "string", "search": "string" }],
  "glossary": [{ "term": "string", "definition": "string" }]
}

Content:
${content.slice(0, 60000)}`,
    }],
  })

  const raw = message.content[0].text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(raw)
}

// ── Update knowledge base (non-fatal) ────────────────────────────────────

async function updateUserKnowledge(supabase, userId, newContent) {
  try {
    const { data: existing } = await supabase
      .from('user_knowledge')
      .select('combined_knowledge, total_uploads')
      .eq('user_id', userId)
      .single()

    const MAX = 200000
    const sep = '\n\n---NEW UPLOAD---\n\n'
    const combined     = existing
      ? (newContent + sep + (existing.combined_knowledge || '')).slice(0, MAX)
      : newContent.slice(0, MAX)
    const totalUploads = (existing?.total_uploads || 0) + 1

    await supabase
      .from('user_knowledge')
      .upsert({ user_id: userId, combined_knowledge: combined, total_uploads: totalUploads, last_updated: new Date().toISOString() }, { onConflict: 'user_id' })
  } catch {
    // Non-fatal — knowledge base update failing should not block the upload response
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function POST(request) {
  const tmpDir = path.join(os.tmpdir(), 'lectureai-' + crypto.randomUUID())

  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseServer()

    // Free plan limit check
    const subscription = await getUserSubscription(userId)
    if (!isProUser(subscription)) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count } = await supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth)
      if (count >= 3) return Response.json({ error: 'limit_reached' }, { status: 403 })
    }

    // Parse file
    const formData = await request.formData()
    const file     = formData.get('file')
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided.' }, { status: 400 })
    }

    const fileType = detectFileType(file)
    if (!fileType) {
      return Response.json(
        { error: 'Unsupported file type. Please upload MP4, MOV, AVI, WEBM, MP3, WAV, M4A, or PDF.' },
        { status: 400 }
      )
    }

    // Size check
    const sizeLabels = { pdf: '50 MB', audio: '100 MB', video: '500 MB' }
    if (file.size > LIMITS[fileType]) {
      return Response.json(
        { error: `File too large. ${fileType.charAt(0).toUpperCase() + fileType.slice(1)} must be under ${sizeLabels[fileType]}.` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let transcript = ''
    let pdfText    = ''
    let warning    = null

    // Extract content
    if (fileType === 'pdf') {
      pdfText = cleanText(await extractFromPDF(buffer))
    } else {
      if (file.size > 25 * 1024 * 1024) {
        warning = 'Large video/audio files take longer to process. For best results, extract the audio as MP3 first.'
      }
      transcript = cleanText(
        await transcribeAudioVideo(buffer, file.name || 'upload.mp4', file.size, fileType, tmpDir)
      )
      if (!transcript) {
        return Response.json({ error: 'No speech detected. Please check the file has audio and try again.' }, { status: 422 })
      }
    }

    const combinedContent = [transcript, pdfText].filter(Boolean).join('\n\n')

    // Generate notes
    const notes = await generateNotes(combinedContent)

    // Save to Supabase (non-fatal on column mismatch — Step 1 SQL may not have run yet)
    let lectureId = null
    try {
      const { data: lecture, error: dbError } = await supabase
        .from('lectures')
        .insert({
          user_id:          userId,
          title:            notes.title,
          file_type:        fileType,
          file_name:        file.name || 'upload',
          file_size:        file.size,
          transcript:       transcript || null,
          pdf_text:         pdfText    || null,
          combined_content: combinedContent,
          notes,
        })
        .select('id')
        .single()

      if (!dbError) lectureId = lecture.id
    } catch {}

    // Update knowledge base + user counter (both non-fatal)
    await updateUserKnowledge(supabase, userId, combinedContent)

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('uploads_this_month')
        .eq('id', userId)
        .single()
      await supabase
        .from('users')
        .upsert({ id: userId, uploads_this_month: (existingUser?.uploads_this_month || 0) + 1 }, { onConflict: 'id' })
    } catch {}

    return Response.json({
      lectureId,
      notes,
      title:     notes.title,
      file_type: fileType,
      ...(warning ? { warning } : {}),
    })

  } catch (error) {
    const msg = error.message || ''
    if (msg.includes('No text found') || msg.includes('No speech detected')) {
      return Response.json({ error: msg }, { status: 422 })
    }
    if (msg.includes('too long to transcribe') || msg.includes('Audio compression')) {
      return Response.json({ error: msg }, { status: 400 })
    }
    return Response.json({ error: 'Upload failed: ' + (msg || 'unknown error') }, { status: 500 })
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
