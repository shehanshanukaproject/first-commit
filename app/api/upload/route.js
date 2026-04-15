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

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 300

const WHISPER_LIMIT = 24 * 1024 * 1024   // 24 MB

// Formats Whisper handles natively — no ffmpeg needed
const WHISPER_NATIVE = new Set(['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.mpeg', '.mpga', '.ogg', '.flac'])
const MIME_MAP = {
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.wav': 'audio/wav',
  '.m4a': 'audio/m4a', '.webm': 'video/webm', '.mpeg': 'video/mpeg',
  '.mpga': 'audio/mpeg', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
}

// ── File type detection ────────────────────────────────────────────────────

function detectFileType(fileName, mime) {
  const ext  = path.extname(fileName || '').toLowerCase()
  const type = (mime || '').toLowerCase()

  if (type === 'application/pdf' || ext === '.pdf') return 'pdf'

  const videoExts  = ['.mp4', '.mov', '.avi', '.webm']
  const videoMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  if (videoExts.includes(ext) || videoMimes.includes(type)) return 'video'

  const audioExts  = ['.mp3', '.wav', '.m4a']
  const audioMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a']
  if (audioExts.includes(ext) || audioMimes.includes(type)) return 'audio'

  return null
}

// ── Whisper: send buffer directly ─────────────────────────────────────────

async function transcribeDirect(buffer, fileName) {
  const ext      = path.extname(fileName).toLowerCase()
  const mimeType = MIME_MAP[ext] || 'audio/mpeg'
  const blob     = new Blob([buffer], { type: mimeType })
  const f        = new File([blob], fileName, { type: mimeType })
  const result   = await openai.audio.transcriptions.create({ file: f, model: 'whisper-1' })
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
      .on('error', err => reject(new Error('Compression failed: ' + err.message)))
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
    throw new Error('File is too long to transcribe. Please use a shorter clip (under ~2 hours).')
  }
  return await transcribeDirect(await fs.readFile(mp3Path), 'audio.mp3')
}

async function transcribeAudioVideo(buffer, fileName, tmpDir) {
  const ext = path.extname(fileName).toLowerCase()
  // Fast path: Whisper supports this format and it fits in one shot
  if (WHISPER_NATIVE.has(ext) && buffer.length <= WHISPER_LIMIT) {
    return await transcribeDirect(buffer, fileName)
  }
  // ffmpeg fallback for unsupported formats or large files
  return await transcribeViaFfmpeg(buffer, fileName, tmpDir)
}

// ── Claude: generate structured notes ─────────────────────────────────────

async function generateNotes(content) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 4000,
    messages: [{
      role: 'user',
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
  const raw = message.content[0].text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(raw)
}

// ── Update knowledge base (non-fatal) ────────────────────────────────────

async function updateUserKnowledge(supabase, userId, newContent) {
  try {
    const { data: existing } = await supabase
      .from('user_knowledge').select('combined_knowledge, total_uploads').eq('user_id', userId).single()
    const MAX = 200000
    const combined     = existing
      ? (newContent + '\n\n---NEW UPLOAD---\n\n' + (existing.combined_knowledge || '')).slice(0, MAX)
      : newContent.slice(0, MAX)
    const totalUploads = (existing?.total_uploads || 0) + 1
    await supabase.from('user_knowledge').upsert(
      { user_id: userId, combined_knowledge: combined, total_uploads: totalUploads, last_updated: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  } catch {}
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
        .from('lectures').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', startOfMonth)
      if (count >= 3) return Response.json({ error: 'limit_reached' }, { status: 403 })
    }

    // ── Resolve file buffer ────────────────────────────────────────────────
    // Two paths: (A) storage-backed JSON body — new flow for large files
    //            (B) direct multipart upload — legacy / tiny files
    let buffer, fileName, fileSize, fileType

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // ── Path A: file already in Supabase Storage ────────────────────────
      const body = await request.json()
      const { storagePath, fileName: fn, fileSize: fs_, fileType: ft } = body

      if (!storagePath) return Response.json({ error: 'storagePath required' }, { status: 400 })

      fileName = fn || 'upload'
      fileSize = fs_ || 0
      fileType = ft || detectFileType(fileName, '')

      const { data: blob, error: dlErr } = await supabase.storage
        .from('lecture-uploads').download(storagePath)

      if (dlErr || !blob) {
        return Response.json({ error: 'Could not retrieve your uploaded file. Please try again.' }, { status: 500 })
      }

      buffer = Buffer.from(await blob.arrayBuffer())

      // Delete from storage immediately — we have it in memory
      supabase.storage.from('lecture-uploads').remove([storagePath]).catch(() => {})

    } else {
      // ── Path B: direct multipart (small files / fallback) ───────────────
      const formData = await request.formData()
      const file     = formData.get('file')
      if (!file || typeof file === 'string') return Response.json({ error: 'No file provided.' }, { status: 400 })
      fileName = file.name || 'upload'
      fileSize = file.size || 0
      fileType = detectFileType(file.name, file.type)
      buffer   = Buffer.from(await file.arrayBuffer())
    }

    if (!fileType) {
      return Response.json(
        { error: 'Unsupported file type. Please upload MP4, MOV, AVI, WEBM, MP3, WAV, M4A, or PDF.' },
        { status: 400 }
      )
    }

    // ── Extract content ────────────────────────────────────────────────────
    let transcript = ''
    let pdfText    = ''
    let warning    = null

    if (fileType === 'pdf') {
      pdfText = cleanText(await extractFromPDF(buffer))
    } else {
      if (fileSize > 25 * 1024 * 1024) {
        warning = 'Large files take longer — transcription may take several minutes.'
      }
      transcript = cleanText(await transcribeAudioVideo(buffer, fileName, tmpDir))
      if (!transcript) {
        return Response.json({ error: 'No speech detected. Please check the file has audio.' }, { status: 422 })
      }
    }

    const combinedContent = [transcript, pdfText].filter(Boolean).join('\n\n')

    // ── Generate notes ─────────────────────────────────────────────────────
    const notes = await generateNotes(combinedContent)

    // ── Save lecture ───────────────────────────────────────────────────────
    let lectureId = null
    try {
      const { data: lecture, error: dbErr } = await supabase
        .from('lectures')
        .insert({
          user_id: userId, title: notes.title,
          file_type: fileType, file_name: fileName, file_size: fileSize,
          transcript: transcript || null, pdf_text: pdfText || null,
          combined_content: combinedContent, notes,
        })
        .select('id').single()
      if (!dbErr) lectureId = lecture.id
    } catch {}

    // ── Knowledge base + user counter (non-fatal) ─────────────────────────
    await updateUserKnowledge(supabase, userId, combinedContent)
    try {
      const { data: u } = await supabase.from('users').select('uploads_this_month').eq('id', userId).single()
      await supabase.from('users').upsert(
        { id: userId, uploads_this_month: (u?.uploads_this_month || 0) + 1 },
        { onConflict: 'id' }
      )
    } catch {}

    return Response.json({ lectureId, notes, title: notes.title, file_type: fileType, ...(warning ? { warning } : {}) })

  } catch (error) {
    const msg = error.message || ''
    if (msg.includes('No text found') || msg.includes('No speech detected')) return Response.json({ error: msg }, { status: 422 })
    if (msg.includes('too long') || msg.includes('Compression failed')) return Response.json({ error: msg }, { status: 400 })
    return Response.json({ error: 'Upload failed: ' + (msg || 'unknown error') }, { status: 500 })
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
