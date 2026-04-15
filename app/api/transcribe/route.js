import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { getSupabaseServer } from '@/lib/supabase-server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_FILE_SIZE = 200 * 1024 * 1024   // 200 MB upload limit
const WHISPER_LIMIT = 24 * 1024 * 1024   // 24 MB (Whisper hard limit is 25 MB)

// Increase Next.js body size limit for this route
export const maxDuration = 120 // 2 min timeout

function getFfmpeg() {
  const ffmpeg = require('fluent-ffmpeg')
  const ffmpegPath = require('ffmpeg-static')
  const { path: ffprobePath } = require('@ffprobe-installer/ffprobe')
  ffmpeg.setFfmpegPath(ffmpegPath)
  ffmpeg.setFfprobePath(ffprobePath)
  return ffmpeg
}

// Convert any audio/video to a small mono MP3 suitable for Whisper
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

// Get audio duration in seconds using ffprobe
function getDuration(filePath) {
  const ffmpeg = getFfmpeg()
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata.format.duration || 0)
    })
  })
}

// Split audio into fixed-duration segments (seconds)
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

async function transcribeFile(filePath, filename) {
  const fileBuffer = await fs.readFile(filePath)
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })
  const file = new File([blob], filename, { type: 'audio/mpeg' })
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  })
  return result.text
}

export async function POST(request) {
  const tmpDir = path.join(os.tmpdir(), 'lectureai-' + crypto.randomUUID())
  try {
    let userId
    try {
      const authResult = await auth()
      userId = authResult.userId
    } catch (authErr) {
      console.error('Auth error:', authErr)
      return Response.json({ error: 'Authentication failed: ' + authErr.message }, { status: 401 })
    }
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check
    let count = 0
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const result = await getSupabaseServer()
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth)
      count = result.count ?? 0
    } catch (dbErr) {
      console.error('Rate limit check error:', dbErr)
      // Allow through if rate limit check fails — don't block the user
    }
    if (count >= 3) {
      return Response.json({ error: 'Free plan limit reached. Upgrade to Pro for unlimited lectures.' }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 200 MB.' }, { status: 400 })
    }

    // Create temp directory
    await fs.mkdir(tmpDir, { recursive: true })

    // Write uploaded file to disk
    const ext = path.extname(file.name) || '.tmp'
    const inputPath = path.join(tmpDir, 'input' + ext)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(inputPath, buffer)

    // Compress to small mono MP3 (handles video + audio, strips video track)
    const compressedPath = path.join(tmpDir, 'compressed.mp3')
    try {
      await compressAudio(inputPath, compressedPath)
    } catch (ffmpegErr) {
      console.error('FFmpeg compression error:', ffmpegErr)
      return Response.json({ error: 'Failed to process audio: ' + ffmpegErr.message }, { status: 500 })
    }

    const stat = await fs.stat(compressedPath)
    let transcript = ''

    if (stat.size <= WHISPER_LIMIT) {
      // Small enough — send directly
      transcript = await transcribeFile(compressedPath, 'audio.mp3')
    } else {
      // Too large — split into 20-minute chunks and transcribe each
      const chunkPattern = path.join(tmpDir, 'chunk_%03d.mp3')
      await splitAudio(compressedPath, chunkPattern, 1200) // 1200s = 20 min

      // Collect all chunk files in order
      const files = (await fs.readdir(tmpDir))
        .filter(f => f.startsWith('chunk_') && f.endsWith('.mp3'))
        .sort()

      const parts = []
      for (const chunkFile of files) {
        const chunkPath = path.join(tmpDir, chunkFile)
        const text = await transcribeFile(chunkPath, chunkFile)
        parts.push(text)
      }
      transcript = parts.join(' ')
    }

    if (!transcript.trim()) {
      return Response.json({ error: 'No speech detected in the audio.' }, { status: 422 })
    }

    return Response.json({ transcript })

  } catch (error) {
    console.error('Transcription error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  } finally {
    // Always clean up temp files
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
