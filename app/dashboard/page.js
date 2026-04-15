'use client'
import { UserButton } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  accent:      '#4f46e5',
  accentDark:  '#3730a3',
  accentLight: '#eef2ff',
  gray50:      '#f9fafb',
  gray100:     '#f3f4f6',
  gray200:     '#e5e7eb',
  gray400:     '#9ca3af',
  gray600:     '#4b5563',
  gray800:     '#1f2937',
  green:       '#059669',
  greenLight:  '#ecfdf5',
}
const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const FILE_ICONS   = { video: '🎥', audio: '🎵', pdf: '📄' }
const SUGGEST_QS   = [
  'Explain the key concepts in simple terms',
  'Give me 5 practice questions',
  'What are the most important topics for exams?',
  'Summarize this lecture briefly',
]

// ── Helpers ────────────────────────────────────────────────────────────────
function detectFileType(file) {
  const mime = (file.type || '').toLowerCase()
  const ext  = (file.name || '').split('.').pop().toLowerCase()
  if (mime === 'application/pdf' || ext === 'pdf')                         return 'pdf'
  if (['mp4','mov','avi','webm'].includes(ext) || mime.startsWith('video/')) return 'video'
  if (['mp3','wav','m4a'].includes(ext)        || mime.startsWith('audio/')) return 'audio'
  return null
}

function formatBytes(b) {
  return b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_LABEL = {
  uploading:    'Uploading your file…',
  extracting:   'Extracting content…',
  transcribing: 'Transcribing audio…',
  analyzing:    'Claude is analyzing your content…',
  saving:       'Saving to your knowledge base…',
}
const STATUS_SUB = {
  uploading:    'Sending file to server',
  extracting:   'Reading your PDF',
  transcribing: 'Powered by OpenAI Whisper · 1–3 min for long recordings',
  analyzing:    'Generating notes, concepts & glossary',
  saving:       'Almost done…',
}

// ── Small shared component ─────────────────────────────────────────────────
function SectionLabel({ color, label }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ background: color, color: '#fff', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' }}>{label}</span>
    </h3>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {

  // Upload
  const [file,          setFile]          = useState(null)
  const [fileType,      setFileType]      = useState(null)
  const [dragOver,      setDragOver]      = useState(false)
  const [status,        setStatus]        = useState('idle')
  const [uploadWarning, setUploadWarning] = useState('')
  const [error,         setError]         = useState('')

  // Notes / lecture
  const [notes,            setNotes]            = useState(null)
  const [activeLectureId,  setActiveLectureId]  = useState(null)
  const [activeTab,        setActiveTab]        = useState('notes')
  const [selectedChapter,  setSelectedChapter]  = useState(null)   // null = overview

  // Chat
  const [messages,    setMessages]    = useState([])
  const [chatInput,   setChatInput]   = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Sidebar
  const [pastLectures,    setPastLectures]    = useState([])
  const [loadingLectures, setLoadingLectures] = useState(true)

  // User
  const [userPlan,          setUserPlan]          = useState(null)
  const [lecturesThisMonth, setLecturesThisMonth] = useState(0)

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeLoading,   setUpgradeLoading]   = useState(false)
  const [upgradeError,     setUpgradeError]     = useState('')
  const [paypalReady,      setPaypalReady]      = useState(false)

  // Support modal
  const [showSupportModal,   setShowSupportModal]   = useState(false)
  const [supportSubject,     setSupportSubject]     = useState('Bug Report')
  const [supportMessage,     setSupportMessage]     = useState('')
  const [supportEmail,       setSupportEmail]       = useState('')
  const [supportLoading,     setSupportLoading]     = useState(false)
  const [supportError,       setSupportError]       = useState('')
  const [supportSuccess,     setSupportSuccess]     = useState(false)

  // Mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)

  const chatBottomRef = useRef(null)
  const paypalRef     = useRef(null)
  const stageTimer    = useRef(null)

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPastLectures()
    fetchUserPlan()
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    if (window.location.search.includes('upgraded=true')) {
      fetchUserPlan()
      window.history.replaceState({}, '', '/dashboard')
    }
    return () => {
      window.removeEventListener('resize', check)
      clearInterval(stageTimer.current)
    }
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // PayPal buttons inside upgrade modal
  useEffect(() => {
    if (!paypalReady || !showUpgradeModal || !paypalRef.current || !window.paypal) return
    paypalRef.current.innerHTML = ''
    window.paypal.Buttons({
      style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
      createSubscription: async () => {
        const res = await fetch('/api/paypal/create-subscription', { method: 'POST' })
        if (res.status === 401) throw new Error('Please sign in to upgrade.')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        return data.subscriptionId
      },
      onApprove: (data) => {
        const subId = data.subscriptionID || data.orderID || ''
        window.location.href = subId
          ? `/api/paypal/success?subscription_id=${subId}`
          : '/dashboard?upgraded=true'
      },
      onError: () => setUpgradeError('PayPal encountered an error. Use the button below instead.'),
    }).render(paypalRef.current)
  }, [paypalReady, showUpgradeModal])

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchPastLectures = async () => {
    try {
      const res  = await fetch('/api/lectures')
      const data = await res.json()
      if (!data.error) setPastLectures(data.lectures || [])
    } catch {}
    finally { setLoadingLectures(false) }
  }

  const fetchUserPlan = async () => {
    try {
      const res  = await fetch('/api/user/plan')
      const data = await res.json()
      setUserPlan(data.plan || 'free')
      setLecturesThisMonth(data.lecturesThisMonth || 0)
    } catch { setUserPlan('free') }
  }

  // ── File selection ───────────────────────────────────────────────────────

  const pickFile = (f) => {
    if (!f) return
    const type = detectFileType(f)
    setFile(f)
    setFileType(type)
    setError('')
    setUploadWarning('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files[0])
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  // 3-step flow:
  //   1. GET presigned URL from /api/upload/presign
  //   2. PUT file directly to Supabase Storage (bypasses Vercel body limit)
  //   3. POST storagePath to /api/upload so the server can process it

  const handleUpload = async () => {
    if (!file || !fileType) return
    setError('')
    setUploadWarning('')

    try {
      // ── Step 1: get presigned upload URL ──────────────────────────────
      setStatus('uploading')

      const presignRes  = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })
      const presignRaw  = await presignRes.text()
      let presignData
      try { presignData = JSON.parse(presignRaw) } catch { throw new Error('Failed to prepare upload. Please try again.') }
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to prepare upload.')

      const { signedUrl, path: storagePath } = presignData

      // ── Step 2: upload file directly to Supabase Storage ──────────────
      // File never touches Vercel — no 4.5 MB limit here
      const uploadRes = await fetch(signedUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!uploadRes.ok) throw new Error(`Storage upload failed (${uploadRes.status}). Please try again.`)

      // ── Step 3: tell the server to process the uploaded file ───────────
      const stages = fileType === 'pdf'
        ? ['extracting', 'analyzing']
        : ['transcribing', 'analyzing']
      let idx = 0
      setStatus(stages[0])
      stageTimer.current = setInterval(() => {
        idx = Math.min(idx + 1, stages.length - 1)
        setStatus(stages[idx])
      }, 8000)

      const processRes = await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storagePath, fileName: file.name, fileSize: file.size, fileType }),
      })

      clearInterval(stageTimer.current)

      const raw = await processRes.text()
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        if (processRes.status === 504 || processRes.status === 502) {
          throw new Error('Processing timed out. For long videos, try a shorter clip or extract audio as MP3 first.')
        }
        throw new Error('Unexpected server error. Please try again.')
      }

      if (processRes.status === 403 && data.error === 'limit_reached') {
        setShowUpgradeModal(true)
        setStatus('idle')
        return
      }
      if (!processRes.ok) throw new Error(data.error || 'Processing failed.')

      if (data.warning) setUploadWarning(data.warning)

      setStatus('saving')
      await new Promise(r => setTimeout(r, 700))

      setNotes(data.notes)
      setActiveLectureId(data.lectureId)
      setMessages([])
      setActiveTab('notes')
      setSelectedChapter(null)
      setStatus('done')
      fetchPastLectures()
      fetchUserPlan()

    } catch (err) {
      clearInterval(stageTimer.current)
      setError(err.message || 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  // ── Load past lecture ────────────────────────────────────────────────────

  const loadPastLecture = async (id) => {
    setError('')
    try {
      const res  = await fetch(`/api/lectures/${id}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNotes(data.lecture.notes)
      setActiveLectureId(id)
      setMessages([])
      setActiveTab('notes')
      setSelectedChapter(null)
      setStatus('done')
      setFile(null)
      setFileType(null)
      setUploadWarning('')
      if (isMobile) setSidebarOpen(false)
    } catch (err) { setError(err.message) }
  }

  const reset = () => {
    clearInterval(stageTimer.current)
    setNotes(null); setFile(null); setFileType(null)
    setStatus('idle'); setError(''); setMessages([])
    setActiveTab('notes'); setActiveLectureId(null); setUploadWarning('')
    setSelectedChapter(null)
    if (isMobile) setSidebarOpen(false)
  }

  // ── Streaming chat ───────────────────────────────────────────────────────

  const sendMessage = async (text) => {
    const msg = (text || chatInput).trim()
    if (!msg || chatLoading) return

    const userMsg  = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }])
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msg, lectureId: activeLectureId }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Chat failed.')
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk.startsWith('__ERROR__:')) { full = chunk.replace('__ERROR__:', ''); break }
        full += chunk
        setMessages(prev => {
          const arr = [...prev]
          arr[arr.length - 1] = { role: 'assistant', content: full, streaming: true }
          return arr
        })
      }

      setMessages(prev => {
        const arr = [...prev]
        arr[arr.length - 1] = { role: 'assistant', content: full || 'No response.', streaming: false }
        return arr
      })
    } catch (err) {
      setMessages(prev => {
        const arr = [...prev]
        arr[arr.length - 1] = { role: 'assistant', content: err.message || 'Something went wrong.', streaming: false }
        return arr
      })
    } finally { setChatLoading(false) }
  }

  // ── PayPal redirect fallback ──────────────────────────────────────────────

  const handlePayPalUpgrade = async () => {
    setUpgradeError('')
    setUpgradeLoading(true)
    try {
      const res  = await fetch('/api/paypal/create-subscription', { method: 'POST' })
      if (res.status === 401) { window.location.href = '/sign-in'; return }
      const data = await res.json()
      if (data.approvalUrl) { window.location.href = data.approvalUrl; return }
      throw new Error(data.error || 'No redirect URL returned from PayPal')
    } catch (err) {
      setUpgradeError(err.message)
      setUpgradeLoading(false)
    }
  }

  // ── Support submission ───────────────────────────────────────────────────

  const sendSupport = async () => {
    if (!supportMessage.trim() || supportLoading) return
    setSupportError('')
    setSupportLoading(true)
    try {
      const res  = await fetch('/api/support', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subject: supportSubject, message: supportMessage, userEmail: supportEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send.')
      setSupportSuccess(true)
      setSupportMessage('')
      setSupportEmail('')
    } catch (err) {
      setSupportError(err.message)
    } finally {
      setSupportLoading(false)
    }
  }

  const openSupport = () => {
    setSupportSuccess(false)
    setSupportError('')
    setSupportMessage('')
    setShowSupportModal(true)
  }

  const isPro      = userPlan === 'pro'
  const isLoading  = ['uploading','extracting','transcribing','analyzing','saving'].includes(status)
  const usagePct   = Math.min((lecturesThisMonth / 3) * 100, 100)

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', fontFamily: FF, display: 'flex', flexDirection: 'column', background: '#fff' }}>

      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`}
        data-sdk-integration-source="button-factory"
        onLoad={() => setPaypalReady(true)}
      />

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .lec-item:hover    { background:${C.gray100} !important; }
        .suggest-btn:hover { background:${C.accentLight} !important; border-color:${C.accent} !important; color:${C.accent} !important; }
        .upload-zone:hover { border-color:${C.accent} !important; }
        .tab-btn:hover     { color:${C.accent} !important; }
        @media (max-width:767px){
          .dash-sidebar { position:fixed !important; left:-280px !important; top:0 !important; height:100vh !important; z-index:200 !important; transition:left .25s ease !important; box-shadow:4px 0 24px rgba(0,0,0,.15) !important; width:260px !important; }
          .dash-sidebar.open { left:0 !important; }
          .mob-overlay { display:block !important; }
          .dash-main   { padding:20px 14px !important; }
          .dash-wrap   { flex-direction:column; }
        }
        @media (min-width:768px) and (max-width:1023px){
          .dash-sidebar { width:220px !important; }
          .dash-main    { padding:28px 24px !important; }
        }
      `}</style>

      {/* ── TOP NAV ──────────────────────────────────────────────────────── */}
      <nav style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: `1px solid ${C.gray200}`, background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 150, flexShrink: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 5 }} aria-label="Menu">
              {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: 20, height: 2, background: C.gray800 }} />)}
            </button>
          )}
          <Link href="/" style={{ fontSize: 19, fontWeight: 800, color: '#0a0a0a', textDecoration: 'none' }}>
            Lecture<span style={{ color: C.accent }}>AI</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isPro ? (
            <span style={{ fontSize: 11, fontWeight: 700, background: C.greenLight, color: C.green, border: '1px solid #6ee7b7', padding: '4px 10px', borderRadius: 100 }}>
              ⭐ Pro
            </span>
          ) : (
            <button onClick={() => setShowUpgradeModal(true)}
              style={{ fontSize: 13, fontWeight: 700, background: C.accent, color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer' }}>
              Upgrade to Pro
            </button>
          )}
          <button onClick={openSupport}
            style={{ fontSize: 13, fontWeight: 600, color: C.gray600, background: 'none', border: `1px solid ${C.gray200}`, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
            💬 Support
          </button>
          <Link href="/account" style={{ fontSize: 13, fontWeight: 600, color: C.gray600, textDecoration: 'none', padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.gray200}` }}>
            Account
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="mob-overlay" onClick={() => setSidebarOpen(false)}
          style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 199 }} />
      )}

      <div className="dash-wrap" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
        <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{ width: 250, borderRight: `1px solid ${C.gray200}`, padding: '14px 10px', flexShrink: 0, background: C.gray50, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>

          {isMobile && (
            <button onClick={() => setSidebarOpen(false)}
              style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.gray600, marginBottom: 2 }}>×</button>
          )}

          {/* New upload button */}
          <button onClick={reset}
            style={{ width: '100%', padding: '9px 12px', background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            + New Upload
          </button>

          {/* Plan / usage */}
          {isPro ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8, background: C.greenLight, border: '1px solid #6ee7b7', marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>⭐</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#065f46', margin: 0 }}>Pro Plan</p>
                <p style={{ fontSize: 11, color: C.green, margin: 0 }}>Unlimited uploads</p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 8, padding: '0 2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: C.gray600, fontWeight: 600 }}>{lecturesThisMonth} of 3 uploads this month</span>
                <button onClick={() => setShowUpgradeModal(true)}
                  style={{ fontSize: 11, color: C.accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Upgrade
                </button>
              </div>
              <div style={{ height: 4, background: C.gray200, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${usagePct}%`, background: lecturesThisMonth >= 3 ? '#ef4444' : C.accent, borderRadius: 100, transition: 'width .4s' }} />
              </div>
            </div>
          )}

          {/* Section label */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: C.gray400, padding: '6px 4px 2px' }}>
            Past Uploads
          </div>

          {loadingLectures && <p style={{ fontSize: 12, color: C.gray400, padding: '4px' }}>Loading…</p>}
          {!loadingLectures && pastLectures.length === 0 && (
            <p style={{ fontSize: 12, color: C.gray400, padding: '4px' }}>No uploads yet</p>
          )}

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pastLectures.map(lec => (
              <div key={lec.id} className="lec-item"
                onClick={() => loadPastLecture(lec.id)}
                style={{
                  padding: '8px 9px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 7,
                  background: activeLectureId === lec.id ? C.accentLight : 'transparent',
                  border: activeLectureId === lec.id ? `1px solid rgba(79,70,229,0.2)` : '1px solid transparent',
                  transition: 'background .15s',
                }}>
                <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{FILE_ICONS[lec.file_type] || '📎'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeLectureId === lec.id ? C.accent : C.gray800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lec.title || lec.file_name || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 10, color: C.gray400, marginTop: 1 }}>{formatDate(lec.created_at)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Knowledge base card */}
          {pastLectures.length > 0 && (
            <div style={{ marginTop: 10, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#ede9fe,#dbeafe)', border: '1px solid #c4b5fd', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5b21b6', marginBottom: 4 }}>🧠 Your AI Knowledge Base</div>
              <div style={{ fontSize: 12, color: '#4c1d95', fontWeight: 600 }}>
                Trained on {pastLectures.length} lecture{pastLectures.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 2 }}>
                Last updated: {formatDate(pastLectures[0].created_at)}
              </div>
              <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 4, fontStyle: 'italic' }}>
                Gets smarter with every upload ✨
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
        <main className="dash-main" style={{ flex: 1, padding: '36px 44px', overflowY: 'auto' }}>

          {/* ── UPLOAD BOX ── */}
          {status === 'idle' && !notes && (
            <div style={{ maxWidth: 540, margin: '0 auto', paddingTop: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.accentLight, color: C.accent, padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 14, border: `1px solid rgba(79,70,229,0.2)` }}>
                  🤖 AI-powered learning
                </div>
                <h2 style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a', marginBottom: 6 }}>
                  Upload your lecture
                </h2>
                <p style={{ fontSize: 13, color: C.gray600 }}>
                  Video, audio, or PDF — Claude analyzes everything and builds your personal knowledge base
                </p>
              </div>

              {/* Drop zone */}
              <div className="upload-zone"
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
                style={{
                  border: `2px dashed ${dragOver || file ? C.accent : C.gray200}`,
                  borderRadius: 14, padding: '36px 20px', cursor: 'pointer', textAlign: 'center',
                  background: dragOver ? C.accentLight : file ? '#f8f7ff' : C.gray50,
                  marginBottom: 16, transition: 'all .2s',
                }}>
                {file ? (
                  <div style={{ animation: 'fadeIn .25s ease' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{FILE_ICONS[fileType] || '📎'}</div>
                    <p style={{ fontWeight: 700, color: C.accent, fontSize: 14, wordBreak: 'break-all', marginBottom: 4 }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: C.gray600 }}>{formatBytes(file.size)} · {fileType ? fileType.toUpperCase() : 'Unknown'} · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.gray800, marginBottom: 12 }}>
                      {dragOver ? 'Drop it here!' : 'Drop your file here or click to browse'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, fontSize: 12, color: C.gray600 }}>
                      <span>🎥 Video <em style={{ color: C.gray400 }}>MP4 MOV AVI WEBM · 500MB</em></span>
                      <span>🎵 Audio <em style={{ color: C.gray400 }}>MP3 WAV M4A · 100MB</em></span>
                      <span>📄 PDF <em style={{ color: C.gray400 }}>50MB</em></span>
                    </div>
                  </div>
                )}
              </div>

              <input id="fileInput" type="file"
                accept="video/*,audio/*,.pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={e => pickFile(e.target.files[0])} />

              {file && !fileType && (
                <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', marginBottom: 10 }}>
                  Unsupported file type. Please use MP4, MOV, AVI, WEBM, MP3, WAV, M4A, or PDF.
                </p>
              )}

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleUpload} disabled={!file || !fileType}
                style={{
                  width: '100%', padding: 14, background: file && fileType ? C.accent : C.gray200,
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: file && fileType ? 'pointer' : 'not-allowed', transition: 'all .2s',
                  boxShadow: file && fileType ? '0 4px 16px rgba(79,70,229,.3)' : 'none',
                }}>
                Analyze Lecture →
              </button>
            </div>
          )}

          {/* ── LOADING STATES ── */}
          {isLoading && (
            <div style={{ textAlign: 'center', paddingTop: 80, maxWidth: 380, margin: '0 auto' }}>
              <div style={{ width: 60, height: 60, border: `4px solid ${C.accentLight}`, borderTop: `4px solid ${C.accent}`, borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
              <h2 style={{ fontSize: 21, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>
                {STATUS_LABEL[status] || 'Processing…'}
              </h2>
              <p style={{ color: C.gray600, fontSize: 13, marginBottom: 20 }}>{STATUS_SUB[status] || ''}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: C.gray400 }}>
                <span style={{ width: 7, height: 7, background: C.accent, borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                {status === 'transcribing' ? 'Keep this tab open — large files take a few minutes' : 'Please keep this tab open'}
              </div>
            </div>
          )}

          {/* ── NOTES VIEW ── */}
          {status === 'done' && notes && (
            <div style={{ maxWidth: 780 }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(17px,3vw,24px)', fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a', marginBottom: 6 }}>
                    {notes.title}
                  </h2>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.greenLight, color: C.green, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
                    ✓ Ready · Added to your knowledge base
                  </span>
                </div>
                <button onClick={reset}
                  style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${C.gray200}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: C.gray600, whiteSpace: 'nowrap' }}>
                  New Upload
                </button>
              </div>

              {uploadWarning && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18 }}>
                  ⚠️ {uploadWarning}
                </div>
              )}

              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.gray200}`, marginBottom: 26, overflowX: 'auto' }}>
                {[
                  { id: 'notes',     label: '📝 Notes' },
                  { id: 'chat',      label: '💬 Chat' },
                  { id: 'quiz',      label: '🧠 Quiz' },
                  { id: 'resources', label: '🔗 Resources' },
                ].map(t => (
                  <button key={t.id} className="tab-btn"
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: '9px 16px', border: 'none', background: 'transparent', fontSize: 13,
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                      fontWeight: activeTab === t.id ? 700 : 500,
                      color:      activeTab === t.id ? C.accent : C.gray600,
                      borderBottom: activeTab === t.id ? `2px solid ${C.accent}` : '2px solid transparent',
                      marginBottom: -1,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── NOTES TAB ── */}
              {activeTab === 'notes' && (() => {
                const hasChapters = Array.isArray(notes.chapters) && notes.chapters.length > 0
                const ch = hasChapters && selectedChapter !== null ? notes.chapters[selectedChapter] : null
                // Which set of notes to render
                const displaySummary  = ch ? ch.summary  : notes.summary
                const displayPoints   = ch ? (ch.keyPoints  || []) : (notes.keyPoints  || [])
                const displayConcepts = ch ? (ch.concepts   || []) : (notes.concepts   || [])
                const displayGlossary = ch ? (ch.glossary   || []) : (notes.glossary   || [])

                return (
                  <div style={{ animation: 'fadeIn .3s ease' }}>

                    {/* ── Chapter navigation pills ── */}
                    {hasChapters && (
                      <div style={{ marginBottom: 22 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: C.gray400, marginBottom: 10 }}>
                          Chapters
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {/* Overview pill */}
                          <button
                            onClick={() => setSelectedChapter(null)}
                            style={{
                              padding: '6px 14px', borderRadius: 100, border: `1px solid ${selectedChapter === null ? C.accent : C.gray200}`,
                              background: selectedChapter === null ? C.accent : '#fff',
                              color: selectedChapter === null ? '#fff' : C.gray600,
                              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: FF,
                            }}>
                            📋 Overview
                          </button>
                          {/* One pill per chapter */}
                          {notes.chapters.map((chapter, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedChapter(i)}
                              style={{
                                padding: '6px 14px', borderRadius: 100, border: `1px solid ${selectedChapter === i ? C.accent : C.gray200}`,
                                background: selectedChapter === i ? C.accentLight : '#fff',
                                color: selectedChapter === i ? C.accent : C.gray600,
                                fontSize: 12, fontWeight: selectedChapter === i ? 700 : 500,
                                cursor: 'pointer', transition: 'all .15s', fontFamily: FF,
                                maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                              {chapter.number}. {chapter.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Chapter header (when a chapter is selected) ── */}
                    {ch && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <span style={{ background: C.accent, color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                          Chapter {ch.number}
                        </span>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>{ch.title}</h3>
                      </div>
                    )}

                    {/* Summary */}
                    <div style={{ background: C.accentLight, borderLeft: `4px solid ${C.accent}`, borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 26 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: C.accent, marginBottom: 6 }}>Summary</div>
                      <p style={{ fontSize: 14, color: C.gray800, lineHeight: 1.7, margin: 0 }}>{displaySummary}</p>
                    </div>

                    {/* Key Points */}
                    {displayPoints.length > 0 && (
                      <>
                        <SectionLabel color={C.accent} label="KEY POINTS" />
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 26 }}>
                          {displayPoints.map((pt, i) => (
                            <li key={i} style={{ display: 'flex', gap: 9, fontSize: 14, color: C.gray800, marginBottom: 8, lineHeight: 1.6 }}>
                              <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>✓</span>{pt}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {/* Concepts */}
                    {displayConcepts.length > 0 && (
                      <>
                        <SectionLabel color="#7c3aed" label="CONCEPTS" />
                        {displayConcepts.map((c, i) => (
                          <div key={i} style={{ border: `1px solid ${C.gray200}`, borderRadius: 12, padding: 18, marginBottom: 12, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 7 }}>{c.name}</h4>
                            <p style={{ fontSize: 13, color: C.gray600, lineHeight: 1.7, marginBottom: 10 }}>{c.explanation}</p>
                            {c.example && (
                              <div style={{ background: '#0a0a0a', borderRadius: 8, padding: '11px 14px', marginBottom: 10, overflowX: 'auto' }}>
                                <pre style={{ fontSize: 12, fontFamily: '"Courier New",monospace', color: '#a5f3fc', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{c.example}</pre>
                              </div>
                            )}
                            {c.examTip && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100 }}>
                                ⚠️ Exam tip: {c.examTip}
                              </span>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {/* Glossary */}
                    {displayGlossary.length > 0 && (
                      <>
                        <SectionLabel color="#0891b2" label="GLOSSARY" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 26 }}>
                          {displayGlossary.map((g, i) => (
                            <div key={i} style={{ border: `1px solid ${C.gray200}`, borderRadius: 8, padding: '9px 14px', background: '#fff', display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: C.accent, fontSize: 13, flexShrink: 0 }}>{g.term}</span>
                              <span style={{ fontSize: 13, color: C.gray600, lineHeight: 1.6 }}>— {g.definition}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* ── CHAT TAB ── */}
              {activeTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: 'clamp(400px,62vh,580px)', animation: 'fadeIn .3s ease' }}>

                  {/* Message list */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>

                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', paddingTop: 36 }}>
                        <div style={{ fontSize: 38, marginBottom: 10 }}>🤖</div>
                        <p style={{ fontWeight: 600, color: C.gray800, marginBottom: 4, fontSize: 15 }}>AI Tutor ready</p>
                        <p style={{ fontSize: 13, color: C.gray600, marginBottom: 20 }}>
                          Ask anything — trained on this lecture
                          {pastLectures.length > 1 ? ` + all ${pastLectures.length} of your uploads` : ''}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
                          {SUGGEST_QS.map((q, i) => (
                            <button key={i} className="suggest-btn" onClick={() => sendMessage(q)}
                              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 100, border: `1px solid ${C.gray200}`, background: '#fff', color: C.gray600, cursor: 'pointer', transition: 'all .15s', fontFamily: FF }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((m, i) => (
                      <div key={i} style={{ animation: 'fadeIn .2s ease' }}>
                        <div style={{
                          maxWidth: '83%',
                          marginLeft: m.role === 'user' ? 'auto' : 0,
                          background: m.role === 'user' ? C.accent : C.gray100,
                          color: m.role === 'user' ? '#fff' : C.gray800,
                          padding: '11px 15px',
                          borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {m.content}
                          {m.streaming && (
                            <span style={{ display: 'inline-block', width: 7, height: 14, background: C.gray400, borderRadius: 2, marginLeft: 3, animation: 'pulse 1s infinite', verticalAlign: 'text-bottom' }} />
                          )}
                        </div>

                        {/* Suggested questions after first AI reply */}
                        {m.role === 'assistant' && i === 1 && messages.length === 2 && !m.streaming && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 4 }}>
                            {SUGGEST_QS.map((q, qi) => (
                              <button key={qi} className="suggest-btn" onClick={() => sendMessage(q)}
                                style={{ fontSize: 11, padding: '5px 10px', borderRadius: 100, border: `1px solid ${C.gray200}`, background: '#fff', color: C.gray600, cursor: 'pointer', transition: 'all .15s', fontFamily: FF }}>
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {chatLoading && messages[messages.length - 1]?.content === '' && (
                      <div style={{ alignSelf: 'flex-start', background: C.gray100, padding: '11px 15px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[0,.2,.4].map((d,i) => (
                          <span key={i} style={{ width: 7, height: 7, background: C.gray400, borderRadius: '50%', display: 'inline-block', animation: `bounce 1s ${d}s infinite` }} />
                        ))}
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input row */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: `1px solid ${C.gray200}`, marginTop: 6 }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Ask about this lecture…"
                      disabled={chatLoading}
                      style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.gray200}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: FF, minWidth: 0, transition: 'border-color .2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = C.accent}
                      onBlur={e => e.currentTarget.style.borderColor = C.gray200}
                    />
                    <button onClick={() => sendMessage()}
                      disabled={!chatInput.trim() || chatLoading}
                      style={{ padding: '10px 16px', background: chatInput.trim() && !chatLoading ? C.accent : C.gray200, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed', transition: 'all .2s', flexShrink: 0 }}>
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* ── QUIZ TAB ── */}
              {activeTab === 'quiz' && (
                <div style={{ textAlign: 'center', paddingTop: 56, animation: 'fadeIn .3s ease' }}>
                  <div style={{ fontSize: 46, marginBottom: 14 }}>🧠</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>Quiz — Coming Soon</h3>
                  <p style={{ fontSize: 14, color: C.gray600, marginBottom: 16 }}>
                    Auto-generated practice questions from your lecture.
                  </p>
                  <p style={{ fontSize: 13, color: C.gray400 }}>
                    Tip: Switch to the Chat tab and ask &ldquo;Give me 5 practice questions&rdquo;
                  </p>
                </div>
              )}

              {/* ── RESOURCES TAB ── */}
              {activeTab === 'resources' && (
                <div style={{ animation: 'fadeIn .3s ease' }}>
                  {(notes.resources || []).length === 0 ? (
                    <p style={{ color: C.gray400, fontSize: 14 }}>No resources found for this lecture.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {notes.resources.map((r, i) => (
                        <div key={i} style={{ border: `1px solid ${C.gray200}`, borderRadius: 10, padding: '13px 15px', display: 'flex', gap: 13, alignItems: 'center', background: '#fff' }}>
                          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
                            {r.type}
                          </span>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: C.gray800, marginBottom: 3 }}>{r.title}</p>
                            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(r.search)}`}
                              target="_blank" rel="noreferrer"
                              style={{ fontSize: 12, color: C.accent, textDecoration: 'none', fontWeight: 500 }}>
                              Search on YouTube →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* ── SUPPORT MODAL ──────────────────────────────────────────────── */}
      {showSupportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowSupportModal(false); setSupportSuccess(false) } }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '30px 26px', maxWidth: 460, width: '100%', animation: 'modalIn .2s ease', boxShadow: '0 20px 60px rgba(0,0,0,.2)', position: 'relative' }}>

            <button onClick={() => { setShowSupportModal(false); setSupportSuccess(false) }}
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.gray600, lineHeight: 1 }}>×</button>

            {supportSuccess ? (
              /* ── Success state ── */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginBottom: 8 }}>Message Sent!</h3>
                <p style={{ fontSize: 14, color: C.gray600, marginBottom: 20, lineHeight: 1.6 }}>
                  We&apos;ve received your message and will reply to your email within 24 hours.
                </p>
                <button onClick={() => { setShowSupportModal(false); setSupportSuccess(false) }}
                  style={{ padding: '10px 24px', background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginBottom: 4 }}>Contact Support</h3>
                  <p style={{ fontSize: 13, color: C.gray600 }}>We&apos;ll get back to you within 24 hours</p>
                </div>

                {/* Category */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, display: 'block', marginBottom: 6 }}>Category</label>
                  <select value={supportSubject} onChange={e => setSupportSubject(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, fontFamily: FF, background: '#fff', color: C.gray800, outline: 'none', cursor: 'pointer' }}>
                    <option>Bug Report</option>
                    <option>Upload Issue</option>
                    <option>Billing / Subscription</option>
                    <option>Feature Request</option>
                    <option>Account Issue</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Reply-to email */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, display: 'block', marginBottom: 6 }}>Your Email <span style={{ color: C.gray400, fontWeight: 400 }}>(so we can reply)</span></label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={e => setSupportEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, fontFamily: FF, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.gray200}
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea
                    value={supportMessage}
                    onChange={e => setSupportMessage(e.target.value)}
                    placeholder="Describe your issue in detail — what happened, what you expected, any error messages…"
                    rows={5}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, fontFamily: FF, resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accent}
                    onBlur={e => e.currentTarget.style.borderColor = C.gray200}
                  />
                  <div style={{ fontSize: 11, color: C.gray400, marginTop: 4, textAlign: 'right' }}>{supportMessage.length} chars</div>
                </div>

                {supportError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                    ⚠️ {supportError}
                  </div>
                )}

                <button onClick={sendSupport} disabled={!supportMessage.trim() || supportLoading}
                  style={{ width: '100%', padding: 13, background: supportMessage.trim() && !supportLoading ? C.accent : C.gray200, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: supportMessage.trim() && !supportLoading ? 'pointer' : 'not-allowed', transition: 'all .2s' }}>
                  {supportLoading ? 'Sending…' : 'Send Message'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: C.gray400, marginTop: 10 }}>
                  Or email us directly at <a href="mailto:support@lectureai.cc" style={{ color: C.accent }}>support@lectureai.cc</a>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── UPGRADE MODAL ──────────────────────────────────────────────── */}
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowUpgradeModal(false); setUpgradeError('') } }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '30px 26px', maxWidth: 400, width: '100%', animation: 'modalIn .2s ease', boxShadow: '0 20px 60px rgba(0,0,0,.2)', position: 'relative' }}>

            <button onClick={() => { setShowUpgradeModal(false); setUpgradeError('') }}
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.gray600, lineHeight: 1 }}>
              ×
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>🚀</div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: '#0a0a0a', marginBottom: 6 }}>Upgrade to Pro</h3>
              <p style={{ fontSize: 13, color: C.gray600 }}>
                You&apos;ve used all 3 free uploads this month.<br />
                Upgrade for unlimited uploads and a smarter AI.
              </p>
            </div>

            <div style={{ background: C.gray50, borderRadius: 10, padding: '13px 15px', marginBottom: 18 }}>
              {['Unlimited uploads every month','AI trained on all your lectures','Video, audio & PDF support','Priority processing'].map((f,i,a) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: C.gray800, marginBottom: i < a.length - 1 ? 7 : 0 }}>
                  <span style={{ color: C.green, fontWeight: 700 }}>✓</span>{f}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#0a0a0a', marginBottom: 14 }}>
              $6 <span style={{ fontSize: 13, fontWeight: 500, color: C.gray600 }}>/ month</span>
            </div>

            {upgradeError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                {upgradeError}
              </div>
            )}

            <div ref={paypalRef} style={{ marginBottom: 10 }} />

            <button onClick={handlePayPalUpgrade} disabled={upgradeLoading}
              style={{ width: '100%', padding: 13, background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: upgradeLoading ? 'not-allowed' : 'pointer', opacity: upgradeLoading ? 0.7 : 1 }}>
              {upgradeLoading ? 'Redirecting…' : 'Upgrade to Pro — $6/mo'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: C.gray400, marginTop: 8 }}>
              Secure payment via PayPal · Cancel anytime
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
