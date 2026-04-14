'use client'
import Link from 'next/link'
import Script from 'next/script'
import { useState, useEffect, useRef } from 'react'
import './landing.css'

const faqs = [
  {
    q: 'What is LectureAI?',
    a: 'LectureAI is an AI-powered study tool that transforms your lecture recordings into structured study notes, concept explanations, a personal AI tutor chatbot, and a practice quiz — all in under 2 minutes. Just upload your audio or video file and let the AI do the work.'
  },
  {
    q: 'What subjects does LectureAI support?',
    a: 'LectureAI works for any subject at any university level — Medicine, Law, Business, Engineering, Psychology, History, Biology, Economics, Computer Science, Arts, and more. If it can be taught in a lecture, LectureAI can turn it into study notes.'
  },
  {
    q: 'What audio and video file types are supported?',
    a: 'LectureAI supports MP3, MP4, WAV, and M4A files up to 25MB. This covers virtually all lecture recordings — whether recorded on a phone, laptop, or downloaded from your university portal.'
  },
  {
    q: 'How does the PDF analysis feature work?',
    a: 'Upload any text-based PDF — lecture slides, research papers, textbook chapters, case studies — and LectureAI extracts the content and lets you chat with it using AI. Ask questions, get summaries, and clarify concepts instantly.'
  },
  {
    q: 'Is my data private and secure?',
    a: 'Yes. Your audio files are processed and then discarded — we never permanently store your recordings. Your notes and transcripts are saved privately to your account and are never shared with or visible to other users. All data is encrypted in transit via HTTPS.'
  },
  {
    q: 'Can I use LectureAI on mobile?',
    a: 'Yes, LectureAI is fully responsive and works on smartphones and tablets. You can upload files, read your notes, and chat with the AI tutor from any device with a modern browser — no app download required.'
  },
  {
    q: "What's the difference between the Free and Pro plans?",
    a: 'The Free plan gives you 3 lectures per month with AI notes and chat. Pro ($6/month) unlocks unlimited lectures, unlimited AI chat, PDF export, and priority processing. Pro is ideal for students who rely on LectureAI throughout their semester.'
  },
  {
    q: 'How accurate is the transcription?',
    a: "We use OpenAI's Whisper model, which achieves approximately 98% word accuracy on clear audio. It handles lectures in multiple languages and accents well, though heavy background noise or very fast speech may slightly reduce accuracy."
  },
  {
    q: 'How do I cancel my Pro subscription?',
    a: "You can cancel anytime from your account settings or by contacting support. You'll keep full Pro access until the end of your billing period, then automatically revert to the free plan — no surprise charges."
  },
  {
    q: 'What if my PDF is scanned or image-based?',
    a: 'LectureAI currently supports text-based PDFs. Scanned or image-only PDFs require OCR processing, which is not yet supported. For best results, use PDFs exported directly from Word, PowerPoint, or your university portal.'
  },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null)
  const [paypalReady, setPaypalReady] = useState(false)
  const paypalContainerRef = useRef(null)

  useEffect(() => {
    if (!paypalReady || !paypalContainerRef.current || !window.paypal) return
    paypalContainerRef.current.innerHTML = ''
    window.paypal.Buttons({
      style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
      createSubscription: async () => {
        const res = await fetch('/api/paypal/create-subscription', { method: 'POST' })
        if (res.status === 401) { window.location.href = '/sign-up'; return }
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        return data.subscriptionId
      },
      onApprove: () => { window.location.href = '/dashboard?upgraded=true' },
      onError: (err) => { console.error('PayPal error:', err) },
    }).render(paypalContainerRef.current)
  }, [paypalReady])

  return (
    <>
      {/* NAV */}
      <nav className="l-nav">
        <Link href="/" className="l-nav-logo">Lecture<span>AI</span></Link>
        <div className="l-nav-links">
          <a href="#features" className="l-btn-ghost">Features</a>
          <a href="#pricing" className="l-btn-ghost">Pricing</a>
          <Link href="/sign-in" className="l-btn-ghost">Sign in</Link>
          <Link href="/sign-up" className="l-btn-primary">Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-badge">
          <span className="dot" />
          Powered by Claude AI &amp; OpenAI
        </div>
        <h1>Turn Any Lecture Into<br /><em>Perfect Study Notes</em></h1>
        <p>Upload your lecture recording and get structured notes, key concepts, exam tips, and an AI tutor — in under 2 minutes. Works for every subject.</p>
        <div className="l-hero-ctas">
          <Link href="/sign-up" className="l-btn-hero">Start for free — no credit card</Link>
          <a href="#demo" className="l-btn-hero-outline">See how it works ↓</a>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="l-trust-bar">
        <div className="l-trust-item"><span>🔒</span> Secure &amp; private</div>
        <div className="l-trust-item"><span>⚡</span> Results in under 2 minutes</div>
        <div className="l-trust-item"><span>🎓</span> For all university students</div>
        <div className="l-trust-item"><span>🤖</span> Claude + Whisper AI</div>
        <div className="l-trust-item"><span>✅</span> Free to start</div>
      </div>

      {/* STATS */}
      <section className="l-stats">
        <div className="l-stats-grid">
          <div><div className="l-stat-number">2<span>min</span></div><div className="l-stat-label">Average processing time</div></div>
          <div><div className="l-stat-number">98<span>%</span></div><div className="l-stat-label">Transcription accuracy</div></div>
          <div><div className="l-stat-number">5<span>x</span></div><div className="l-stat-label">Faster than manual note-taking</div></div>
          <div><div className="l-stat-number">50<span>+</span></div><div className="l-stat-label">Subjects supported</div></div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="l-section" id="demo">
        <div className="l-section-inner">
          <div className="l-section-label">How it works</div>
          <h2 className="l-section-title">From lecture to study guide<br />in 3 simple steps</h2>
          <p className="l-section-sub">No setup required. Just upload your lecture and LectureAI handles everything else.</p>
          <div className="l-steps-grid">
            <div className="l-step-card">
              <div className="l-step-number">1</div>
              <h3>Upload your lecture</h3>
              <p>Drag and drop any MP3, MP4, WAV, or M4A file — up to 25MB. Recorded live, downloaded from your portal, or saved from Zoom — all work perfectly.</p>
            </div>
            <div className="l-step-card">
              <div className="l-step-number">2</div>
              <h3>AI transcribes &amp; analyses</h3>
              <p>OpenAI Whisper transcribes your audio with 98% accuracy. Claude then reads the full transcript and extracts every key idea from any subject.</p>
            </div>
            <div className="l-step-card">
              <div className="l-step-number">3</div>
              <h3>Get your study package</h3>
              <p>Receive structured notes, concept explanations with real examples, exam tips, resource links, and a quiz — tailored to exactly what was taught.</p>
            </div>
            <div className="l-step-card">
              <div className="l-step-number">4</div>
              <h3>Chat &amp; review anytime</h3>
              <p>Ask follow-up questions, request clarifications, or test your knowledge. Every lecture is saved so you can come back before exams.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO PREVIEW */}
      <section className="l-section" style={{ background: 'var(--gray-50)', paddingTop: 0 }}>
        <div className="l-section-inner">
          <div className="l-demo-wrapper">
            <div className="l-demo-topbar">
              <div className="l-demo-dot" style={{ background: '#ff5f57' }} />
              <div className="l-demo-dot" style={{ background: '#febc2e' }} />
              <div className="l-demo-dot" style={{ background: '#28c840' }} />
              <div className="l-demo-url">lectureai.cc/dashboard</div>
            </div>
            <div className="l-demo-body">
              <p className="l-demo-section-label">Summary</p>
              <div className="l-demo-summary">
                This lecture introduces the principles of cognitive psychology and memory. It covers the three-stage model of memory (sensory, short-term, long-term), encoding and retrieval processes, and common reasons for forgetting — with real-world implications for effective studying.
              </div>
              <p className="l-demo-section-label">Key Points</p>
              <ul className="l-demo-bullets">
                <li>Short-term memory holds roughly 7 ± 2 items for 15–30 seconds</li>
                <li>Elaborative rehearsal moves information into long-term memory more effectively than rote repetition</li>
                <li>Retrieval cues at the time of learning improve recall during exams</li>
                <li>The spacing effect shows that distributed practice outperforms cramming</li>
              </ul>
              <p className="l-demo-section-label">Core Concept</p>
              <div className="l-demo-concept">
                <h5>The Encoding Specificity Principle</h5>
                <p>Memory recall is strongest when the conditions at retrieval match the conditions at encoding — this is why studying in an exam-like environment improves performance.</p>
                <div className="l-demo-exam-tip">⚠️ Exam tip: Often tested as a scenario question — identify the encoding cue being used</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="l-section l-features-bg" id="features">
        <div className="l-section-inner">
          <div className="l-section-label">Features</div>
          <h2 className="l-section-title">Everything you need<br />to ace your exams</h2>
          <div className="l-features-grid">
            {[
              { icon: '🎙️', bg: '#eef2ff', title: 'Accurate Transcription', desc: 'OpenAI Whisper converts your lecture audio to text with industry-leading accuracy — even with accents, technical terminology, and background noise across any subject.', tag: 'Whisper AI', tagBg: '#eef2ff', tagColor: 'var(--accent)' },
              { icon: '📋', bg: '#ecfdf5', title: 'Structured Study Notes', desc: 'Not just a transcript — Claude extracts the most important ideas and formats them into a structured, scannable study guide with key points, concepts, and exam tips.', tag: 'Claude AI', tagBg: '#ecfdf5', tagColor: 'var(--green)' },
              { icon: '💡', bg: '#fffbeb', title: 'Concept Explanations', desc: 'Every major concept gets a plain-English explanation with real examples. Perfect for reviewing before an exam — for any subject, from Medicine to Law to Economics.', tag: 'Exam-ready', tagBg: '#fffbeb', tagColor: '#92400e' },
              { icon: '💬', bg: '#fdf2f8', title: 'AI Tutor Chatbot', desc: 'Ask questions about anything in the lecture. The AI knows exactly what was covered and gives context-aware answers — like a TA available 24/7 for any course.', tag: 'Always available', tagBg: '#fdf2f8', tagColor: '#9d174d' },
              { icon: '📄', bg: '#f0f9ff', title: 'PDF Analyzer', desc: 'Upload lecture slides, textbook chapters, or case studies as PDFs and chat with them using AI. Get instant answers without reading page by page.', tag: 'Any document', tagBg: '#f0f9ff', tagColor: '#0369a1' },
              { icon: '🧠', bg: '#f5f3ff', title: 'Practice Quizzes', desc: 'Automatically generate a 10-question multiple-choice quiz from any lecture. Test yourself, see your score, and review which concepts need more attention.', tag: 'Self-testing', tagBg: '#f5f3ff', tagColor: '#7c3aed' },
            ].map((f) => (
              <div key={f.title} className="l-feature-card">
                <div className="l-feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="l-feature-tag" style={{ background: f.tagBg, color: f.tagColor }}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="l-section l-testimonials-bg">
        <div className="l-section-inner">
          <div className="l-section-label">Student reviews</div>
          <h2 className="l-section-title">Students across every subject<br />are saving hours every week</h2>
          <div className="l-testimonials-grid">
            {[
              { q: '"I uploaded a 90-minute anatomy lecture and had complete, organised notes in under 2 minutes. The AI even flagged the exact concepts that came up in my practical exam. It\'s become essential."', name: 'Aisha K.', role: 'Medicine, Year 2', color: '#4f46e5', initial: 'A' },
              { q: '"Used it for a contract law lecture I nearly fell asleep in. The AI broke down every principle into plain English with an exam tip for each one. My essay marks have noticeably improved."', name: 'James L.', role: 'Law, Year 3', color: '#059669', initial: 'J' },
              { q: '"I missed a macroeconomics lecture while travelling for a competition. Had comprehensive notes with key models and diagrams explained — within minutes of getting back. Genuinely lifesaving."', name: 'Sofia R.', role: 'Economics, Year 2', color: '#dc2626', initial: 'S' },
              { q: '"The quiz feature is brilliant. After every lecture I generate a quick 10-question test. It catches the gaps in my understanding before I get to the exam hall. Nothing else does this so fast."', name: 'Priya M.', role: 'Psychology, Year 3', color: '#d97706', initial: 'P' },
              { q: '"As a final-year engineering student I have 5 modules running at once. LectureAI keeps all my notes organised and the chatbot means I can revise a topic from 3 months ago in seconds."', name: 'Reza H.', role: 'Mechanical Engineering, Year 4', color: '#7c3aed', initial: 'R' },
              { q: '"English is not my first language and following 2-hour lectures is exhausting. Having the transcript and a clear AI explanation of every concept has completely changed how much I understand."', name: 'Lin W.', role: 'Business Management, Year 2', color: '#0891b2', initial: 'L' },
            ].map((t) => (
              <div key={t.name} className="l-testimonial-card">
                <div className="l-stars">★★★★★</div>
                <p className="l-testimonial-text">{t.q}</p>
                <div className="l-testimonial-author">
                  <div className="l-author-avatar" style={{ background: t.color }}>{t.initial}</div>
                  <div>
                    <div className="l-author-name">{t.name}</div>
                    <div className="l-author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="l-section">
        <div className="l-section-inner">
          <div className="l-section-label">Trust &amp; Security</div>
          <h2 className="l-section-title">Your data is safe with us</h2>
          <p className="l-section-sub">We take the privacy of your lectures and personal information seriously.</p>
          <div className="l-security-grid">
            {[
              { icon: '🔐', title: 'Secure Authentication', desc: 'Powered by Clerk — enterprise-grade auth used by thousands of apps worldwide.' },
              { icon: '🛡️', title: 'Your Data Stays Yours', desc: 'Your lectures and notes are stored privately per account. No other user can ever access them.' },
              { icon: '🔒', title: 'Encrypted in Transit', desc: 'All data is transmitted over HTTPS/TLS. Your audio files are never stored permanently on our servers.' },
              { icon: '🏦', title: 'Trusted AI Providers', desc: 'We use OpenAI and Anthropic — the most trusted and privacy-conscious AI providers in the industry.' },
            ].map((s) => (
              <div key={s.title} className="l-security-card">
                <div className="l-security-icon">{s.icon}</div>
                <div><h4>{s.title}</h4><p>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="l-section l-pricing-bg" id="pricing">
        <div className="l-section-inner" style={{ textAlign: 'center' }}>
          <div className="l-section-label">Pricing</div>
          <h2 className="l-section-title">Start free, upgrade when ready</h2>
          <p className="l-section-sub" style={{ margin: '0 auto' }}>No credit card required to get started. Cancel anytime.</p>
          <div className="l-pricing-grid">
            <div className="l-pricing-card">
              <div className="l-pricing-name">Free</div>
              <div className="l-pricing-price"><sup>$</sup>0<sub>/mo</sub></div>
              <p className="l-pricing-desc">Perfect for trying LectureAI before committing.</p>
              <hr className="l-pricing-divider" />
              <ul className="l-pricing-features">
                <li><span className="check">✓</span> 3 lectures per month</li>
                <li><span className="check">✓</span> AI-generated notes</li>
                <li><span className="check">✓</span> AI chat (20 messages/lecture)</li>
                <li><span className="check">✓</span> Practice quizzes</li>
                <li><span className="check">✓</span> Lecture history</li>
                <li><span className="x">✗</span> <span style={{ color: 'var(--gray-400)' }}>PDF export</span></li>
                <li><span className="x">✗</span> <span style={{ color: 'var(--gray-400)' }}>Unlimited lectures</span></li>
              </ul>
              <Link href="/sign-up" className="l-btn-pricing l-btn-pricing-outline">Get started free</Link>
            </div>
            <div className="l-pricing-card featured">
              <div className="l-pricing-badge">MOST POPULAR</div>
              <div className="l-pricing-name">Pro</div>
              <div className="l-pricing-price" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span><sup>$</sup>9<sub>/mo</sub></span>
                <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '11px', padding: '2px 8px', borderRadius: '100px', fontWeight: 500, lineHeight: '1.5' }}>Coming Soon</span>
              </div>
              <p className="l-pricing-desc">For students who rely on LectureAI every week.</p>
              <hr className="l-pricing-divider" />
              <ul className="l-pricing-features">
                <li><span className="check">✓</span> <strong>Unlimited</strong> lectures</li>
                <li><span className="check">✓</span> AI-generated notes</li>
                <li><span className="check">✓</span> <strong>Unlimited</strong> AI chat</li>
                <li><span className="check">✓</span> Full lecture history</li>
                <li><span className="check">✓</span> Practice quizzes</li>
                <li><span className="check">✓</span> PDF export</li>
                <li><span className="check">✓</span> Priority processing</li>
              </ul>
              <div ref={paypalContainerRef} style={{ marginTop: '8px' }} />
              {!paypalReady && (
                <Link href="/sign-up" className="l-btn-pricing l-btn-pricing-filled">
                  Get Pro — $6/month
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="l-section" style={{ textAlign: 'center' }}>
        <div className="l-section-inner">
          <div className="l-section-label">FAQ</div>
          <h2 className="l-section-title">Common questions</h2>
          <div className="l-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`l-faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="l-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <span className="l-faq-chevron">▼</span>
                </button>
                <div className="l-faq-answer">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="l-cta">
        <h2>Stop re-watching lectures.<br /><em>Start understanding them.</em></h2>
        <p>Join students from every subject turning hours of recordings into exam-ready notes.</p>
        <Link href="/sign-up" className="l-btn-hero">Get started free — no credit card needed</Link>
        <div className="l-cta-guarantee">🔒 Secure sign-up &nbsp;·&nbsp; Free plan available &nbsp;·&nbsp; Cancel anytime</div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund">Refund Policy</Link>
          <a href="mailto:support@lectureai.cc">Contact</a>
        </div>
        <p>© 2026 LectureAI. Built for students everywhere.</p>
      </footer>

      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`}
        onLoad={() => setPaypalReady(true)}
      />
    </>
  )
}
