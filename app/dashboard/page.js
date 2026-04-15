'use client'
import { UserButton } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'

const accent = '#4f46e5'
const accentDark = '#3730a3'
const accentLight = '#eef2ff'
const gray50 = '#f9fafb'
const gray100 = '#f3f4f6'
const gray200 = '#e5e7eb'
const gray400 = '#9ca3af'
const gray600 = '#4b5563'
const gray800 = '#1f2937'
const green = '#059669'

export default function Dashboard() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [notes, setNotes] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [pastLectures, setPastLectures] = useState([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeLectureId, setActiveLectureId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [userPlan, setUserPlan] = useState(null)
  const [lecturesThisMonth, setLecturesThisMonth] = useState(0)
  const [showBanner, setShowBanner] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const chatBottomRef = useRef(null)
  const paypalModalRef = useRef(null)

  useEffect(() => {
    fetchPastLectures()
    fetchUserPlan()
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    if (window.location.search.includes('upgraded=true')) {
      setShowUpgradeSuccess(true)
      fetchUserPlan()
      window.history.replaceState({}, '', '/dashboard')
    }
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Render PayPal buttons inside upgrade modal whenever it opens
  useEffect(() => {
    if (!paypalReady || !showUpgradeModal || !paypalModalRef.current || !window.paypal) return
    paypalModalRef.current.innerHTML = ''
    window.paypal.Buttons({
      style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
      createSubscription: async () => {
        const res = await fetch('/api/paypal/create-subscription', { method: 'POST' })
        if (!res.ok && res.status === 401) throw new Error('Please sign in to upgrade.')
        let data
        try { data = await res.json() } catch { throw new Error('Server error. Please try again.') }
        if (data.error) throw new Error(data.error)
        return data.subscriptionId
      },
      onApprove: (data) => {
        // Route through success handler so the DB is updated before redirect
        const subId = data.subscriptionID || data.orderID || ''
        window.location.href = subId
          ? `/api/paypal/success?subscription_id=${subId}`
          : '/dashboard?upgraded=true'
      },
      onError: (err) => {
        console.error('[PayPal] button error:', err)
        setUpgradeError('PayPal encountered an error. Please use the button below instead.')
      },
    }).render(paypalModalRef.current)
  }, [paypalReady, showUpgradeModal])

  const fetchUserPlan = async () => {
    try {
      const res = await fetch('/api/user/plan')
      const data = await res.json()
      setUserPlan(data.plan || 'free')
      setLecturesThisMonth(data.lecturesThisMonth || 0)
    } catch {
      setUserPlan('free')
    }
  }

  const handlePayPalUpgrade = async () => {
    setUpgradeError('')
    setUpgradeLoading(true)
    try {
      const res = await fetch('/api/paypal/create-subscription', { method: 'POST' })
      if (res.status === 401) { window.location.href = '/sign-in'; return }
      let data
      try { data = await res.json() } catch { throw new Error('Server error. Please try again.') }
      console.log('[PayPal] create-subscription response:', data)
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else {
        throw new Error(data.error || 'No redirect URL returned from PayPal')
      }
    } catch (err) {
      console.error('[PayPal] upgrade error:', err.message)
      setUpgradeError(err.message)
      setUpgradeLoading(false)
    }
  }

  const fetchPastLectures = async () => {
    try {
      const res = await fetch('/api/lectures')
      const data = await res.json()
      if (!data.error) setPastLectures(data.lectures)
    } catch (e) {}
    finally { setLoadingLectures(false) }
  }

  const handleUpload = async () => {
    if (!file) return
    setError('')
    try {
      setStatus('transcribing')
      const formData = new FormData()
      formData.append('file', file)
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const transcribeData = await transcribeRes.json()
      if (transcribeData.error) throw new Error(transcribeData.error)

      setStatus('generating')
      const notesRes = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcribeData.transcript })
      })
      const notesData = await notesRes.json()
      if (notesData.error) throw new Error(notesData.error)

      setNotes(notesData.notes)
      setTranscript(transcribeData.transcript)
      setActiveLectureId(notesData.lectureId)
      setMessages([])
      setActiveTab('notes')
      setStatus('done')
      fetchPastLectures()
      fetchUserPlan()
    } catch (err) {
      if (err.message?.toLowerCase().includes('limit reached') || err.message?.toLowerCase().includes('upgrade')) {
        setShowUpgradeModal(true)
        setStatus('idle')
      } else {
        setError(err.message)
        setStatus('idle')
      }
    }
  }

  const loadPastLecture = async (id) => {
    try {
      const res = await fetch(`/api/lectures/${id}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNotes(data.lecture.notes)
      setTranscript(data.lecture.transcript)
      setActiveLectureId(id)
      setMessages([])
      setActiveTab('notes')
      setStatus('done')
      setFile(null)
      setError('')
      if (isMobile) setSidebarOpen(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const reset = () => {
    setNotes(null); setTranscript(''); setFile(null)
    setStatus('idle'); setError(''); setMessages([])
    setActiveTab('notes'); setActiveLectureId(null)
    setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false)
    if (isMobile) setSidebarOpen(false)
  }

  const generateQuiz = async () => {
    if (!transcript || quizLoading) return
    setQuizLoading(true)
    setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false)
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuiz(data.questions)
    } catch (err) {
      setError(err.message)
    } finally {
      setQuizLoading(false)
    }
  }

  const quizScore = quiz ? quiz.filter((q, i) => quizAnswers[i] === q.answer).length : 0

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, transcript })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      if (err.message?.toLowerCase().includes('limit reached') || err.message?.toLowerCase().includes('upgrade')) {
        setShowUpgradeModal(true)
        setMessages(newMessages)
      } else {
        setMessages([...newMessages, { role: 'assistant', content: err.message || 'Sorry, something went wrong. Please try again.' }])
      }
    } finally {
      setChatLoading(false)
    }
  }

  const youtubeUrl = (search) =>
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(search)

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const ff = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  return (
    <div style={{ minHeight: '100vh', fontFamily: ff, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .dash-sidebar-overlay { display: none; }
        @media (max-width: 767px) {
          .dash-sidebar { position: fixed !important; left: -280px !important; top: 0 !important; height: 100vh !important; z-index: 200 !important; transition: left .25s ease !important; box-shadow: 4px 0 24px rgba(0,0,0,.15) !important; }
          .dash-sidebar.open { left: 0 !important; }
          .dash-sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 199; }
          .dash-main { padding: 24px 16px !important; }
          .dash-content-wrap { flex-direction: column !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dash-sidebar { width: 220px !important; }
          .dash-main { padding: 28px 24px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${gray200}`, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 150 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}
              aria-label="Menu"
            >
              <span style={{ display: 'block', width: '20px', height: '2px', background: gray800 }} />
              <span style={{ display: 'block', width: '20px', height: '2px', background: gray800 }} />
              <span style={{ display: 'block', width: '20px', height: '2px', background: gray800 }} />
            </button>
          )}
          <Link href="/" style={{ fontSize: '20px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none' }}>
            Lecture<span style={{ color: accent }}>AI</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/account" style={{ fontSize: '13px', fontWeight: 600, color: gray600, textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${gray200}`, background: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {userPlan === 'pro' && <span style={{ fontSize: '11px' }}>⭐</span>}
            Account
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* FREE PLAN BANNER */}
      {userPlan === 'free' && showBanner && (
        <div style={{ background: '#fffbeb', borderBottom: `1px solid #fde68a`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '13px', color: '#92400e', fontWeight: 500, margin: 0, flex: 1 }}>
            ⚡ <strong>Free plan</strong> — {lecturesThisMonth}/3 lectures used this month. Upgrade for unlimited access.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{ padding: '5px 12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Upgrade to Pro →
            </button>
            <button onClick={() => setShowBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>
        </div>
      )}

      {/* PADDLE UPGRADE BANNER */}
      {userPlan !== 'pro' && (
        <div style={{ background: accent, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#fff', fontWeight: 500, margin: 0 }}>
            You&apos;re on the <strong>Free plan</strong> — 3 lectures/month.{' '}
            Upgrade to <strong>Pro</strong> for <strong>$6/month</strong> for unlimited lectures, chats, and PDF export.
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{ padding: '6px 16px', background: '#fff', color: accent, border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && sidebarOpen && (
        <div className="dash-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="dash-content-wrap" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside
          className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{ width: '260px', borderRight: `1px solid ${gray200}`, padding: '20px 16px', flexShrink: 0, background: gray50, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        >
          {/* Mobile close */}
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: gray600, marginBottom: '8px', marginTop: '-4px' }}>×</button>
          )}

          <button
            onClick={reset}
            style={{ width: '100%', padding: '10px 16px', background: accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px', transition: 'background .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = accentDark}
            onMouseLeave={e => e.currentTarget.style.background = accent}
          >
            + New lecture
          </button>

          {/* PDF Analyzer link */}
          <Link href="/pdf" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: '#fdf4ff', border: '1px solid #e9d5ff', textDecoration: 'none', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#7c3aed' }}>
            <span>📄</span> PDF Analyzer
          </Link>

          {/* PLAN BADGE / UPGRADE */}
          {userPlan === 'pro' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #6ee7b7', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>⭐</span>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', margin: 0 }}>Pro Plan</p>
                <p style={{ fontSize: '11px', color: '#059669', margin: 0 }}>Unlimited access</p>
              </div>
            </div>
          ) : userPlan === 'free' ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{ width: '100%', padding: '10px 12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🚀</span>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Upgrade to Pro</p>
                <p style={{ margin: 0, fontSize: '11px', opacity: 0.85 }}>$6/mo — unlimited everything</p>
              </div>
            </button>
          ) : null}

          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: gray400, marginBottom: '10px', paddingLeft: '4px' }}>
            Past lectures
          </div>

          {loadingLectures && <p style={{ fontSize: '13px', color: gray400, paddingLeft: '4px' }}>Loading...</p>}
          {!loadingLectures && pastLectures.length === 0 && (
            <p style={{ fontSize: '13px', color: gray400, paddingLeft: '4px' }}>No lectures yet</p>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {pastLectures.map((lecture) => (
              <div
                key={lecture.id}
                onClick={() => loadPastLecture(lecture.id)}
                style={{
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                  background: activeLectureId === lecture.id ? accentLight : 'transparent',
                  border: activeLectureId === lecture.id ? `1px solid rgba(79,70,229,0.2)` : '1px solid transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (activeLectureId !== lecture.id) e.currentTarget.style.background = gray100 }}
                onMouseLeave={e => { if (activeLectureId !== lecture.id) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: activeLectureId === lecture.id ? accent : gray800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                  {lecture.title}
                </div>
                <div style={{ fontSize: '11px', color: gray400 }}>{formatDate(lecture.created_at)}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main className="dash-main" style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>

          {/* UPLOAD */}
          {status === 'idle' && !notes && (
            <div style={{ textAlign: 'center', paddingTop: '40px', maxWidth: '560px', margin: '0 auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: accentLight, color: accent, padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, marginBottom: '24px', border: `1px solid rgba(79,70,229,0.2)` }}>
                🎙️ AI-powered transcription
              </div>
              <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '10px', color: '#0a0a0a' }}>
                Upload your lecture
              </h2>
              <p style={{ fontSize: '15px', color: gray600, marginBottom: '32px' }}>Supports MP3, MP4, WAV, M4A — up to 200MB</p>

              <div
                onClick={() => document.getElementById('fileInput').click()}
                style={{ border: `2px dashed ${file ? accent : gray200}`, borderRadius: '12px', padding: '48px 24px', cursor: 'pointer', background: file ? accentLight : gray50, marginBottom: '20px', transition: 'all .2s' }}
                onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = accent }}
                onMouseLeave={e => { if (!file) e.currentTarget.style.borderColor = gray200 }}
              >
                {file ? (
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                    <p style={{ fontWeight: 700, color: accent, fontSize: '15px', wordBreak: 'break-all' }}>{file.name}</p>
                    <p style={{ fontSize: '13px', color: gray600, marginTop: '4px' }}>Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎙️</div>
                    <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: gray800 }}>Drop your lecture file here</p>
                    <p style={{ color: gray400, fontSize: '14px' }}>or click to browse</p>
                  </div>
                )}
              </div>

              <input id="fileInput" type="file" accept="audio/*,video/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', textAlign: 'left' }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file}
                style={{ padding: '14px 40px', background: file ? accent : gray200, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed', transition: 'all .2s', boxShadow: file ? '0 4px 16px rgba(79,70,229,0.3)' : 'none', width: '100%', maxWidth: '320px' }}
                onMouseEnter={e => { if (file) e.currentTarget.style.background = accentDark }}
                onMouseLeave={e => { if (file) e.currentTarget.style.background = accent }}
              >
                Process lecture
              </button>
            </div>
          )}

          {/* LOADING */}
          {(status === 'transcribing' || status === 'generating') && (
            <div style={{ textAlign: 'center', paddingTop: '80px' }}>
              <div style={{ width: '64px', height: '64px', border: `4px solid ${accentLight}`, borderTop: `4px solid ${accent}`, borderRadius: '50%', margin: '0 auto 28px', animation: 'spin 1s linear infinite' }} />
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px', color: '#0a0a0a' }}>
                {status === 'transcribing' ? 'Transcribing your lecture...' : 'Generating study notes...'}
              </h2>
              <p style={{ color: gray600, fontSize: '15px' }}>
                {status === 'transcribing' ? 'This takes 1–3 minutes depending on length' : 'Claude is analysing the transcript...'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px', fontSize: '13px', color: gray400 }}>
                <span style={{ width: '8px', height: '8px', background: accent, borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                {status === 'transcribing' ? 'Powered by OpenAI Whisper' : 'Powered by Claude AI'}
              </div>
            </div>
          )}

          {/* NOTES VIEW */}
          {status === 'done' && notes && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a', marginBottom: '4px' }}>{notes.title}</h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: green, padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                    ✓ Notes ready
                  </div>
                </div>
                <button
                  onClick={reset}
                  style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${gray200}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: gray600, transition: 'all .2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = gray200}
                >
                  New lecture
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '2px', borderBottom: `1px solid ${gray200}`, marginBottom: '28px', overflowX: 'auto' }}>
                {['notes', 'chat', 'quiz'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); if (tab === 'quiz' && !quiz && !quizLoading) generateQuiz() }}
                    style={{ padding: '10px 18px', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? accent : gray600, cursor: 'pointer', borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent', marginBottom: '-1px', transition: 'all .15s', whiteSpace: 'nowrap' }}
                  >
                    {tab === 'notes' ? '📝 Notes' : tab === 'chat' ? '💬 Chat' : '🧠 Quiz'}
                  </button>
                ))}
              </div>

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div>
                  <div style={{ background: accentLight, border: `1px solid rgba(79,70,229,0.15)`, borderLeft: `4px solid ${accent}`, borderRadius: '10px', padding: '18px 20px', marginBottom: '28px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: accent, marginBottom: '8px' }}>Summary</div>
                    <p style={{ fontSize: '14px', color: gray800, lineHeight: '1.7' }}>{notes.summary}</p>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: accent, color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>KEY POINTS</span>
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '28px' }}>
                    {notes.keyPoints.map((point, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: gray800, marginBottom: '8px', lineHeight: '1.6' }}>
                        <span style={{ color: green, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#7c3aed', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>CONCEPTS</span>
                  </h3>
                  {notes.concepts.map((concept, i) => (
                    <div key={i} style={{ border: `1px solid ${gray200}`, borderRadius: '12px', padding: '20px', marginBottom: '14px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', marginBottom: '8px' }}>{concept.name}</h4>
                      <p style={{ fontSize: '14px', color: gray600, marginBottom: '10px', lineHeight: '1.7' }}>{concept.explanation}</p>
                      {concept.example && (
                        <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px', overflowX: 'auto' }}>
                          <p style={{ fontSize: '13px', fontFamily: '"Courier New", monospace', color: '#a5f3fc', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{concept.example}</p>
                        </div>
                      )}
                      {concept.examTip && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '100px' }}>
                          ⚠️ Exam tip: {concept.examTip}
                        </div>
                      )}
                    </div>
                  ))}

                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', marginBottom: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#0891b2', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>RESOURCES</span>
                  </h3>
                  {notes.resources.map((res, i) => (
                    <div key={i} style={{ border: `1px solid ${gray200}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'center', background: '#fff' }}>
                      <div style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
                        {res.type}
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: gray800, marginBottom: '4px' }}>{res.title}</p>
                        <a href={youtubeUrl(res.search)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: accent, textDecoration: 'none', fontWeight: 500 }}>
                          Search on YouTube →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CHAT TAB */}
              {activeTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: 'clamp(400px, 60vh, 560px)' }}>
                  <div style={{ background: accentLight, border: `1px solid rgba(79,70,229,0.15)`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: accent, fontWeight: 500 }}>
                    💬 Ask anything about this lecture — I have the full transcript as context.
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', paddingTop: '60px', color: gray400, fontSize: '14px' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤖</div>
                        <p style={{ fontWeight: 600, color: gray600, marginBottom: '4px' }}>AI Tutor ready</p>
                        <p>Ask a question about the lecture content</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={i} style={{
                        maxWidth: '82%',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? accent : gray100,
                        color: msg.role === 'user' ? '#fff' : gray800,
                        padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                      }}>
                        {msg.content}
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ alignSelf: 'flex-start', background: gray100, padding: '12px 16px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {[0, 0.2, 0.4].map((d, i) => (
                          <span key={i} style={{ width: '7px', height: '7px', background: gray400, borderRadius: '50%', display: 'inline-block', animation: `bounce 1s ease-in-out ${d}s infinite` }} />
                        ))}
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${gray200}` }}>
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Ask a question about this lecture..."
                      disabled={chatLoading}
                      style={{ flex: 1, padding: '12px 16px', border: `1px solid ${gray200}`, borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s', minWidth: 0 }}
                      onFocus={e => e.currentTarget.style.borderColor = accent}
                      onBlur={e => e.currentTarget.style.borderColor = gray200}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      style={{ padding: '12px 18px', background: chatInput.trim() && !chatLoading ? accent : gray200, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed', transition: 'all .2s', flexShrink: 0 }}
                      onMouseEnter={e => { if (chatInput.trim() && !chatLoading) e.currentTarget.style.background = accentDark }}
                      onMouseLeave={e => { if (chatInput.trim() && !chatLoading) e.currentTarget.style.background = accent }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* QUIZ TAB */}
              {activeTab === 'quiz' && (
                <div>
                  {quizLoading && (
                    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                      <div style={{ width: '52px', height: '52px', border: `4px solid ${accentLight}`, borderTop: `4px solid ${accent}`, borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a0a0a', marginBottom: '8px' }}>Generating quiz…</h3>
                      <p style={{ color: gray400, fontSize: '14px' }}>Claude is writing 10 questions from your lecture</p>
                    </div>
                  )}
                  {!quizLoading && !quiz && (
                    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#0a0a0a' }}>Test your knowledge</h3>
                      <p style={{ color: gray600, fontSize: '14px', marginBottom: '24px' }}>Generate a 10-question multiple-choice quiz from this lecture</p>
                      <button onClick={generateQuiz} style={{ padding: '12px 32px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                        Generate Quiz
                      </button>
                    </div>
                  )}
                  {!quizLoading && quiz && !quizSubmitted && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <p style={{ fontSize: '13px', color: gray400 }}>{Object.keys(quizAnswers).length}/{quiz.length} answered</p>
                        <button onClick={() => { setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false) }} style={{ fontSize: '12px', color: gray600, background: '#fff', border: `1px solid ${gray200}`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                          Regenerate
                        </button>
                      </div>
                      {quiz.map((q, qi) => (
                        <div key={qi} style={{ border: `1px solid ${gray200}`, borderRadius: '12px', padding: '20px', marginBottom: '14px', background: '#fff' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px', lineHeight: '1.5' }}>
                            <span style={{ color: accent, marginRight: '6px' }}>Q{qi + 1}.</span>{q.question}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options.map((opt, oi) => {
                              const letter = ['A', 'B', 'C', 'D'][oi]
                              const selected = quizAnswers[qi] === letter
                              return (
                                <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: letter }))}
                                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${selected ? accent : gray200}`, background: selected ? accentLight : '#fff', color: selected ? accent : gray800, fontSize: '13px', fontWeight: selected ? 600 : 400, cursor: 'pointer', transition: 'all .15s', lineHeight: '1.5' }}>
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(quizAnswers).length < quiz.length}
                        style={{ width: '100%', padding: '14px', background: Object.keys(quizAnswers).length === quiz.length ? accent : gray200, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: Object.keys(quizAnswers).length === quiz.length ? 'pointer' : 'not-allowed', marginTop: '8px', transition: 'background .2s' }}>
                        Submit Quiz
                      </button>
                    </div>
                  )}
                  {!quizLoading && quiz && quizSubmitted && (
                    <div>
                      <div style={{ background: quizScore >= 7 ? '#ecfdf5' : quizScore >= 5 ? '#fffbeb' : '#fef2f2', border: `1px solid ${quizScore >= 7 ? '#6ee7b7' : quizScore >= 5 ? '#fde68a' : '#fecaca'}`, borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', fontWeight: 800, color: quizScore >= 7 ? green : quizScore >= 5 ? '#d97706' : '#dc2626', marginBottom: '6px' }}>
                          {quizScore}/{quiz.length}
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>
                          {quizScore === quiz.length ? '🎉 Perfect score!' : quizScore >= 7 ? '✅ Great work!' : quizScore >= 5 ? '📚 Keep studying!' : '💪 Review the lecture and try again!'}
                        </p>
                        <p style={{ fontSize: '13px', color: gray600 }}>{Math.round((quizScore / quiz.length) * 100)}% correct</p>
                      </div>
                      {quiz.map((q, qi) => {
                        const userAns = quizAnswers[qi]
                        const correct = userAns === q.answer
                        return (
                          <div key={qi} style={{ border: `1.5px solid ${correct ? '#6ee7b7' : '#fecaca'}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '12px', background: correct ? '#f0fdf4' : '#fef2f2' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '10px', lineHeight: '1.5' }}>
                              <span style={{ marginRight: '6px' }}>{correct ? '✅' : '❌'}</span>
                              <span style={{ color: accent, marginRight: '6px' }}>Q{qi + 1}.</span>{q.question}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {q.options.map((opt, oi) => {
                                const letter = ['A', 'B', 'C', 'D'][oi]
                                const isCorrect = letter === q.answer
                                const isUser = letter === userAns
                                return (
                                  <div key={oi} style={{ padding: '8px 12px', borderRadius: '7px', fontSize: '13px', lineHeight: '1.5', background: isCorrect ? '#dcfce7' : isUser && !isCorrect ? '#fee2e2' : '#fff', border: `1px solid ${isCorrect ? '#86efac' : isUser && !isCorrect ? '#fca5a5' : gray200}`, fontWeight: isCorrect || isUser ? 600 : 400, color: isCorrect ? '#166534' : isUser && !isCorrect ? '#991b1b' : gray600 }}>
                                    {opt} {isCorrect && '✓'}{isUser && !isCorrect && '✗'}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false) }}
                        style={{ width: '100%', padding: '13px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}>
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', maxWidth: '440px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'modalIn .2s ease', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0a0a0a', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              You've reached your Free plan limit
            </h2>
            <p style={{ fontSize: '14px', color: gray600, marginBottom: '24px', lineHeight: '1.6' }}>
              Upgrade to Pro to continue using LectureAI with unlimited lectures, AI chat, and more.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', textAlign: 'left' }}>
              {['Unlimited lecture uploads', 'Unlimited AI chat messages', 'Practice quizzes', 'PDF export', 'Priority processing'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: gray800 }}>
                  <span style={{ color: green, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            {/* PayPal JS SDK buttons (card + PayPal) — renders when SDK loads */}
            <div ref={paypalModalRef} style={{ marginBottom: paypalReady ? '10px' : '0' }} />
            {/* Direct redirect button — always visible, guaranteed to work */}
            <button
              onClick={handlePayPalUpgrade}
              disabled={upgradeLoading}
              style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${accent}, #7c3aed)`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: upgradeLoading ? 'wait' : 'pointer', marginBottom: '10px', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
            >
              {upgradeLoading ? 'Redirecting to PayPal…' : 'Get Pro — $6/month'}
            </button>
            {upgradeError && (
              <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '10px', textAlign: 'center' }}>
                ⚠️ {upgradeError}
              </p>
            )}
            <button
              onClick={() => { setShowUpgradeModal(false); setUpgradeError('') }}
              style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${gray200}`, borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: gray600, cursor: 'pointer' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* UPGRADE SUCCESS BANNER */}
      {showUpgradeSuccess && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 999, maxWidth: '480px', width: 'calc(100% - 32px)' }}>
          <span style={{ fontSize: '20px' }}>🎉</span>
          <p style={{ margin: 0, fontSize: '14px', color: '#065f46', fontWeight: 600, flex: 1 }}>
            You&apos;re now on Pro! Unlimited lectures, AI chat, and PDF export unlocked.
          </p>
          <button onClick={() => setShowUpgradeSuccess(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
      )}

      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription&enable-funding=card`}
        onLoad={() => setPaypalReady(true)}
      />
    </div>
  )
}
