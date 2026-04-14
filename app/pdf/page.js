'use client'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

const accent = '#4f46e5'
const accentLight = '#eef2ff'
const gray50 = '#f9fafb'
const gray100 = '#f3f4f6'
const gray200 = '#e5e7eb'
const gray400 = '#9ca3af'
const gray600 = '#4b5563'

export default function PdfPage() {
  const [file, setFile] = useState(null)
  const [pdfText, setPdfText] = useState('')
  const [pdfMeta, setPdfMeta] = useState(null) // { pages, truncated, name }
  const [status, setStatus] = useState('idle') // idle | extracting | ready
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      return
    }
    setFile(selected)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    if (dropped.type !== 'application/pdf') {
      setError('Please drop a PDF file.')
      return
    }
    setFile(dropped)
    setError('')
  }

  const handleExtract = async () => {
    if (!file) return
    setError('')
    setStatus('extracting')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/pdf-extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPdfText(data.text)
      setPdfMeta({ pages: data.pages, truncated: data.truncated, name: file.name })
      setMessages([])
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/pdf-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, pdfText })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: err.message || 'Something went wrong. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPdfText('')
    setPdfMeta(null)
    setMessages([])
    setInput('')
    setStatus('idle')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '64px', borderBottom: `1px solid ${gray200}`, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/dashboard" style={{ fontSize: '18px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none' }}>
            Lecture<span style={{ color: accent }}>AI</span>
          </Link>
          <span style={{ color: gray200 }}>|</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: accent }}>PDF Analyzer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard" style={{ fontSize: '13px', color: gray600, textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${gray200}` }}>
            ← Dashboard
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* UPLOAD STATE */}
        {status === 'idle' && (
          <div style={{ maxWidth: '560px', margin: '0 auto', width: '100%', paddingTop: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '56px', height: '56px', background: accentLight, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 16px' }}>📄</div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0a0a0a', marginBottom: '8px', letterSpacing: '-0.5px' }}>PDF Analyzer</h1>
              <p style={{ fontSize: '15px', color: gray600 }}>Upload a PDF and ask questions about it using AI</p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${file ? accent : gray200}`, borderRadius: '14px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: file ? accentLight : gray50, transition: 'all 0.2s', marginBottom: '16px' }}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📎</div>
                  <p style={{ fontWeight: 600, color: accent, marginBottom: '4px', wordBreak: 'break-word' }}>{file.name}</p>
                  <p style={{ fontSize: '13px', color: gray400 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#0a0a0a', marginBottom: '4px' }}>Drop your PDF here</p>
                  <p style={{ fontSize: '13px', color: gray400 }}>or click to browse — max 50 MB</p>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={!file}
              style={{ width: '100%', padding: '13px', background: file ? accent : gray200, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
            >
              Analyse PDF
            </button>

            <p style={{ textAlign: 'center', fontSize: '12px', color: gray400, marginTop: '12px' }}>Supports text-based PDFs. Scanned/image PDFs require OCR.</p>
          </div>
        )}

        {/* EXTRACTING STATE */}
        {status === 'extracting' && (
          <div style={{ textAlign: 'center', paddingTop: '80px' }}>
            <div style={{ width: '52px', height: '52px', border: `4px solid ${accentLight}`, borderTop: `4px solid ${accent}`, borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Extracting text…</h2>
            <p style={{ color: gray400, fontSize: '14px' }}>Reading your PDF — this only takes a moment</p>
          </div>
        )}

        {/* READY STATE — PDF info + chat */}
        {status === 'ready' && pdfMeta && (
          <>
            {/* PDF info bar */}
            <div style={{ background: accentLight, border: `1px solid ${accent}20`, borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>📄</span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '1px', wordBreak: 'break-word' }}>{pdfMeta.name}</p>
                  <p style={{ fontSize: '12px', color: gray600 }}>{pdfMeta.pages} page{pdfMeta.pages !== 1 ? 's' : ''}{pdfMeta.truncated ? ' · First 500 000 chars used' : ' · Full document loaded'}</p>
                </div>
              </div>
              <button onClick={reset} style={{ fontSize: '12px', color: gray600, background: '#fff', border: `1px solid ${gray200}`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                Upload new PDF
              </button>
            </div>

            {pdfMeta.truncated && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#92400e' }}>
                ⚠️ This is a very large document — only the first 500 000 characters were sent to the AI. Questions about content near the very end may be less accurate.
              </div>
            )}

            {/* Chat */}
            <div style={{ border: `1px solid ${gray200}`, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
              {/* Chat header */}
              <div style={{ padding: '14px 18px', background: gray50, borderBottom: `1px solid ${gray200}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', background: accent, borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>Ask anything about this document</span>
                {messages.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: gray400 }}>{Math.floor(messages.length / 2)}/20 questions used</span>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '320px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', paddingTop: '32px', color: gray400 }}>
                    <p style={{ fontSize: '32px', marginBottom: '10px' }}>💬</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', color: gray600 }}>Ask anything about this PDF</p>
                    {/* Suggested questions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                      {['Summarise this document', 'What are the key points?', 'What topics are covered?'].map((q) => (
                        <button key={q} onClick={() => setInput(q)} style={{ fontSize: '12px', padding: '6px 12px', background: '#fff', border: `1px solid ${gray200}`, borderRadius: '100px', cursor: 'pointer', color: gray600, transition: 'all 0.15s' }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? accent : gray100,
                      color: msg.role === 'user' ? '#fff' : '#0a0a0a',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ background: gray100, padding: '10px 14px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[0, 0.2, 0.4].map((d, i) => (
                        <span key={i} style={{ width: '7px', height: '7px', background: gray400, borderRadius: '50%', display: 'inline-block', animation: `bounce 1s ease-in-out ${d}s infinite` }} />
                      ))}
                      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input row */}
              <div style={{ padding: '12px 14px', borderTop: `1px solid ${gray200}`, display: 'flex', gap: '8px', background: '#fff' }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask a question about the PDF…"
                  disabled={chatLoading}
                  style={{ flex: 1, padding: '10px 14px', border: `1px solid ${gray200}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: chatLoading ? gray50 : '#fff' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || chatLoading}
                  style={{ padding: '10px 18px', background: input.trim() && !chatLoading ? accent : gray200, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: input.trim() && !chatLoading ? 'pointer' : 'not-allowed', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
