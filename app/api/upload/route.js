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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 300 // 5 min timeout for large files

const LIMITS = {
  pdf:   50  * 1024 * 1024,  // 50 MB
  audio: 100 * 1024 * 1024,  // 100 MB
  video: 500 * 1024 * 1024,  // 500 MB
}
const WHISPER_LIMIT = 24 * 1024 * 1024  // 24 MB (Whisper hard limit is 25 MB)

// ── File type detection ────────────────────────────────────────────────────

function detectFileType(file) {
  const mime = file.type || ''
  const ext  = path.extname(file.name || '').toLowerCase()

  if (mime === 'application/pdf' || ext === '.pdf') return 'pdf'

  const videoMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/avi']
  const videoExts  = ['.mp4', '.mov', '.avi', '.webm']
  if (videoMimes.includes(mime) || videoExts.includes(ext)) return 'video'

  const audioMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a']
  const audioExts  = ['.mp3', '.wav', '.m4a']
  if (audioMimes.includes(mime) || audioExts.includes(ext)) return 'audio'

  return null
}

// ── ffmpeg helpers (same approach as existing transcribe route) ────────────

function getFfmpeg() {
  const ffmpeg      = require('fluent-ffmpeg')
  const ffmpegPath  = require('ffmpeg-static')
  const { path: ffprobePath } = require('@ffprobe-installer/ffprobe')
  ffmpeg.setFfmpegPath(ffmpegPath)
  ffmpeg.setFfprobePath(ffprobePath)
  return ffmpeg
}

function compressAudio(inputPath, outputPath) {
  const ffmpeg = getFfmpeg()
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-vn', '-ar', '16000', '-ac', '1', '-b:a', '32k'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error('Audio compression failed: ' + err.message)))
      .run()
  })
}

function splitAudio(inputPath, outputPattern, segmentSeconds) {
  const ffmpeg = getFfmpeg()
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-f', 'segment',
        '-segment_time', String(segmentSeconds),
        '-c', 'copy',
        '-reset_timestamps', '1',
      ])
      .output(outputPattern)
      .on('end', resolve)
      .on('error', (err) => reject(new Error('Audio split failed: ' + err.message)))
      .run()
  })
}

async function transcribeWhisper(filePath, filename) {
  const fileBuffer = await fs.readFile(filePath)
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })
  const file = new File([blob], filename, { type: 'audio/mpeg' })
  const result = await openai.audio.transcriptions.create({ file, model: 'whisper-1' })
  return result.text
}

// ── Transcription: compress → split if needed → Whisper ──────────────────

async function transcribeAudioVideo(inputPath, tmpDir) {
  const compressedPath = path.join(tmpDir, 'compressed.mp3')
  await compressAudio(inputPath, compressedPath)

  const stat = await fs.stat(compressedPath)

  if (stat.size <= WHISPER_LIMIT) {
    return await transcribeWhisper(compressedPath, 'audio.mp3')
  }

  // Too large after compression — split into 20-min chunks
  const chunkPattern = path.join(tmpDir, 'chunk_%03d.mp3')
  await splitAudio(compressedPath, chunkPattern, 1200)

  const chunkFiles = (await fs.readdir(tmpDir))
    .filter(f => f.startsWith('chunk_') && f.endsWith('.mp3'))
    .sort()

  const parts = []
  for (const chunkFile of chunkFiles) {
    const text = await transcribeWhisper(path.join(tmpDir, chunkFile), chunkFile)
    parts.push(text)
  }
  return parts.join(' ')
}

// ── Claude: generate structured notes ─────────────────────────────────────

async function generateNotes(content) {
  const trimmed = content.slice(0, 60000)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are an expert academic tutor. Analyze this lecture content and return ONLY a valid JSON object with exactly this structure — no extra text, no markdown fences:
{
  "title": "string",
  "summary": "3-4 sentence overview",
  "concepts": [{ "name": "string", "explanation": "string", "example": "string", "examTip": "string" }],
  "keyPoints": ["string"],
  "resources": [{ "type": "youtube", "title": "string", "search": "string" }],
  "glossary": [{ "term": "string", "definition": "string" }]
}

Content:
${trimmed}`
    }]
  })

  const raw = message.content[0].text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(raw)
}

// ── Update user_knowledge: prepend newest content, cap at 200k chars ───────

async function updateUserKnowledge(supabase, userId, newContent) {
  const { data: existing } = await supabase
    .from('user_knowledge')
    .select('combined_knowledge, total_uploads')
    .eq('user_id', userId)
    .single()

  const MAX_KNOWLEDGE = 200000
  const separator = '\n\n---NEW UPLOAD---\n\n'

  let combined
  let totalUploads

  if (existing) {
    combined     = (newContent + separator + (existing.combined_knowledge || '')).slice(0, MAX_KNOWLEDGE)
    totalUploads = (existing.total_uploads || 0) + 1
  } else {
    combined     = newContent.slice(0, MAX_KNOWLEDGE)
    totalUploads = 1
  }

  await supabase
    .from('user_knowledge')
    .upsert({
      user_id:           userId,
      combined_knowledge: combined,
      total_uploads:      totalUploads,
      last_updated:       new Date().toISOString(),
    }, { onConflict: 'user_id' })
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function POST(request) {
  const tmpDir = path.join(os.tmpdir(), 'lectureai-' + crypto.randomUUID())

  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServer()

    // ── Pro / free limit check ─────────────────────────────────────────────
    const subscription = await getUserSubscription(userId)
    const isPro        = isProUser(subscription)

    if (!isPro) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count } = await supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth)

      if (count >= 3) {
        return Response.json({ error: 'limit_reached' }, { status: 403 })
      }
    }

    // ── Parse form data ────────────────────────────────────────────────────
    const formData = await request.formData()
    const file     = formData.get('file')

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided.' }, { status: 400 })
    }

    // ── Detect file type ───────────────────────────────────────────────────
    const fileType = detectFileType(file)
    if (!fileType) {
      return Response.json(
        { error: 'Unsupported file type. Please upload a video (MP4, MOV, AVI, WEBM), audio (MP3, WAV, M4A), or PDF.' },
        { status: 400 }
      )
    }

    // ── File size limits ───────────────────────────────────────────────────
    const sizeLimit = LIMITS[fileType]
    if (file.size > sizeLimit) {
      const labels = { pdf: '50 MB', audio: '100 MB', video: '500 MB' }
      return Response.json(
        { error: `File is too large. ${fileType.charAt(0).toUpperCase() + fileType.slice(1)} files must be under ${labels[fileType]}.` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let transcript   = ''
    let pdfText      = ''
    let sizeWarning  = null

    // ── Extract content ────────────────────────────────────────────────────
    if (fileType === 'pdf') {
      pdfText = cleanText(await extractFromPDF(buffer))
    } else {
      // Video or audio — write to disk, compress, transcribe
      await fs.mkdir(tmpDir, { recursive: true })
      const ext       = path.extname(file.name || '') || (fileType === 'video' ? '.mp4' : '.mp3')
      const inputPath = path.join(tmpDir, 'input' + ext)
      await fs.writeFile(inputPath, buffer)

      if (fileType === 'video' && file.size > 25 * 1024 * 1024) {
        sizeWarning = 'Video transcription works best under 25 MB. For large videos, extracting the audio first (as MP3) will give faster, more accurate results.'
      }

      transcript = await transcribeAudioVideo(inputPath, tmpDir)
      transcript = cleanText(transcript)

      if (!transcript) {
        return Response.json({ error: 'No speech detected in the audio. Please check the file and try again.' }, { status: 422 })
      }
    }

    // ── Combined content for Claude + knowledge base ───────────────────────
    const combinedContent = [transcript, pdfText].filter(Boolean).join('\n\n')

    // ── Generate structured notes via Claude ───────────────────────────────
    const notes = await generateNotes(combinedContent)

    // ── Save lecture to Supabase ───────────────────────────────────────────
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

    if (dbError) {
      // Still return notes even if DB save fails
      return Response.json({ notes, lectureId: null, file_type: fileType, title: notes.title, warning: sizeWarning })
    }

    // ── Update user knowledge base ─────────────────────────────────────────
    await updateUserKnowledge(supabase, userId, combinedContent)

    // ── Upsert users table (monthly upload counter) ────────────────────────
    const { data: existingUser } = await supabase
      .from('users')
      .select('uploads_this_month')
      .eq('id', userId)
      .single()

    await supabase
      .from('users')
      .upsert({
        id:                 userId,
        uploads_this_month: (existingUser?.uploads_this_month || 0) + 1,
      }, { onConflict: 'id' })

    return Response.json({
      lectureId: lecture.id,
      notes,
      title:     notes.title,
      file_type: fileType,
      ...(sizeWarning ? { warning: sizeWarning } : {}),
    })

  } catch (error) {
    const msg = error.message || 'Upload failed. Please try again.'
    // Surface user-friendly messages for known errors
    if (msg.includes('No text found') || msg.includes('No speech detected')) {
      return Response.json({ error: msg }, { status: 422 })
    }
    if (msg.includes('Failed to extract') || msg.includes('Audio compression')) {
      return Response.json({ error: msg }, { status: 500 })
    }
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
