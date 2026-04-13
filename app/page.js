'use client'
import Link from 'next/link'
import { useState } from 'react'
import './landing.css'

const faqs = [
  { q: 'What audio formats are supported?', a: 'LectureAI supports MP3, MP4, WAV, and M4A files up to 25MB. This covers most lecture recordings — whether recorded on a phone, laptop, or downloaded from your university portal.' },
  { q: 'How accurate is the transcription?', a: "We use OpenAI's Whisper model, which achieves approximately 98% word accuracy on clear audio. Performance may vary with strong accents, heavy background noise, or very technical vocabulary, but it handles most lecture recordings extremely well." },
  { q: 'Are my lecture recordings stored permanently?', a: "Audio files are processed and then discarded — we don't permanently store your recording files. The transcript and notes are saved to your account so you can access them later, but the original audio is not retained." },
  { q: 'Does it work for subjects other than Computer Science?', a: 'LectureAI is currently optimised for CS and software engineering lectures — it generates code examples and CS-specific exam tips. Support for other subjects is on the roadmap.' },
  { q: 'Can I cancel my subscription at any time?', a: "Yes, absolutely. You can cancel your Pro subscription at any time from your account settings. You'll continue to have Pro access until the end of your billing period, then automatically revert to the free plan." },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null)

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
        <p>Upload your lecture audio and get structured notes, key concepts, exam tips, and an AI tutor — in under 2 minutes.</p>
        <div className="l-hero-ctas">
          <Link href="/sign-up" className="l-btn-hero">Start for free — no credit card</Link>
          <a href="#demo" className="l-btn-hero-outline">See how it works ↓</a>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="l-trust-bar">
        <div className="l-trust-item"><span>🔒</span> Secure &amp; private</div>
        <div className="l-trust-item"><span>⚡</span> Results in under 2 minutes</div>
        <div className="l-trust-item"><span>🎓</span> Built for CS students</div>
        <div className="l-trust-item"><span>🤖</span> Claude + Whisper AI</div>
        <div className="l-trust-item"><span>✅</span> Free to start</div>
      </div>

      {/* STATS */}
      <section className="l-stats">
        <div className="l-stats-grid">
          <div><div className="l-stat-number">2<span>min</span></div><div className="l-stat-label">Average processing time</div></div>
          <div><div className="l-stat-number">98<span>%</span></div><div className="l-stat-label">Transcription accuracy</div></div>
          <div><div className="l-stat-number">5<span>x</span></div><div className="l-stat-label">Faster than manual note-taking</div></div>
          <div><div className="l-stat-number">4<span>+</span></div><div className="l-stat-label">Audio formats supported</div></div>
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
              <p>Drag and drop any MP3, MP4, WAV, or M4A file — up to 25MB. Recorded live? Downloaded from YouTube? Both work perfectly.</p>
            </div>
            <div className="l-step-card">
              <div className="l-step-number">2</div>
              <h3>AI transcribes &amp; analyses</h3>
              <p>OpenAI Whisper transcribes your audio with 98% accuracy. Claude then reads the full transcript and extracts every key idea.</p>
            </div>
            <div className="l-step-card">
              <div className="l-step-number">3</div>
              <h3>Get your study package</h3>
              <p>Receive structured notes, concept explanations with code examples, exam tips, and a personal chatbot you can quiz on the lecture.</p>
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
              <div className="l-demo-url">lectureai.app/dashboard</div>
            </div>
            <div className="l-demo-body">
              <p className="l-demo-section-label">Summary</p>
              <div className="l-demo-summary">
                This lecture introduces Big O notation and time complexity analysis. It covers constant, linear, and quadratic growth, explains why we drop coefficients, and demonstrates how to measure algorithm efficiency with real code examples.
              </div>
              <p className="l-demo-section-label">Key Points</p>
              <ul className="l-demo-bullets">
                <li>Big O describes the worst-case performance of an algorithm</li>
                <li>O(1) is constant time — the fastest possible complexity</li>
                <li>Nested loops typically result in O(n²) time complexity</li>
                <li>We always drop constants: O(2n) simplifies to O(n)</li>
              </ul>
              <p className="l-demo-section-label">Core Concept</p>
              <div className="l-demo-concept">
                <h5>Binary Search — O(log n)</h5>
                <p>Repeatedly halves the search space, making it dramatically faster than linear search for large datasets.</p>
                <div className="l-demo-code">
                  def binary_search(arr, target):<br />
                  &nbsp;&nbsp;lo, hi = 0, len(arr) - 1<br />
                  &nbsp;&nbsp;while lo &lt;= hi:<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;mid = (lo + hi) // 2<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;if arr[mid] == target: return mid
                </div>
                <div className="l-demo-exam-tip">⚠️ Exam tip: Binary search requires a sorted array — a common trick question</div>
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
              { icon: '🎙️', bg: '#eef2ff', title: 'Accurate Transcription', desc: 'OpenAI Whisper converts your lecture audio to text with industry-leading accuracy — even with accents, technical jargon, and background noise.', tag: 'Whisper AI', tagBg: '#eef2ff', tagColor: 'var(--accent)' },
              { icon: '📋', bg: '#ecfdf5', title: 'Structured Study Notes', desc: 'Not just a transcript — Claude extracts the most important ideas and formats them into a structured, scannable study guide you can actually use.', tag: 'Claude AI', tagBg: '#ecfdf5', tagColor: 'var(--green)' },
              { icon: '💡', bg: '#fffbeb', title: 'Concept Explanations', desc: 'Every major concept gets a plain-English explanation plus code examples. Perfect for reviewing before an exam when time is short.', tag: 'Exam-ready', tagBg: '#fffbeb', tagColor: '#92400e' },
              { icon: '💬', bg: '#fdf2f8', title: 'AI Tutor Chatbot', desc: 'Ask questions about anything in the lecture. The AI knows exactly what was covered and gives context-aware answers — like a TA available 24/7.', tag: 'Always available', tagBg: '#fdf2f8', tagColor: '#9d174d' },
              { icon: '📚', bg: '#f0fdf4', title: 'Lecture History', desc: 'Every lecture is saved to your account. Access all your notes and chats anytime — from lecture 1 to the final review session before exams.', tag: 'Cloud saved', tagBg: '#f0fdf4', tagColor: '#166534' },
              { icon: '⚡', bg: '#fff7ed', title: 'Fast & Simple', desc: 'No complex setup, no learning curve. Upload → wait 2 minutes → study. It really is that simple. Works on any device.', tag: '2 min average', tagBg: '#fff7ed', tagColor: '#c2410c' },
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
          <h2 className="l-section-title">Students are saving hours<br />every week</h2>
          <div className="l-testimonials-grid">
            {[
              { q: '"I uploaded a 90-minute operating systems lecture and had complete study notes in 2 minutes. The exam tips alone are worth it — it flagged exactly what came up in the test."', name: 'Aiden K.', role: 'Computer Science, Year 3', color: '#4f46e5', initial: 'A' },
              { q: '"The chatbot is insane. I asked it to explain why the professor\'s binary tree example used recursion instead of iteration and it gave me a perfect explanation. Better than office hours."', name: 'Priya M.', role: 'Software Engineering, Year 2', color: '#059669', initial: 'P' },
              { q: '"I missed a lecture due to illness. Instead of borrowing messy notes, I grabbed the recording and had comprehensive notes with code examples within minutes. Genuinely lifesaving."', name: 'James L.', role: 'Data Science, Year 4', color: '#dc2626', initial: 'J' },
              { q: '"The recommended YouTube resources it suggests are actually useful — not random videos. It clearly understands the topic and picks content that matches what was taught."', name: 'Sofia T.', role: 'Computer Science, Year 1', color: '#d97706', initial: 'S' },
              { q: '"Used it for my algorithms course — 12 lectures uploaded, all saved neatly. Come exam season I just reviewed the AI notes for each one. Went from a C student to an A."', name: 'Reza H.', role: 'Information Technology, Year 3', color: '#7c3aed', initial: 'R' },
              { q: '"As someone whose first language isn\'t English, having the lecture transcribed and then explained clearly is incredibly helpful. I understand more from the AI notes than from the lecture itself."', name: 'Lin W.', role: 'Computer Engineering, Year 2', color: '#0891b2', initial: 'L' },
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
                <li><span className="check">✓</span> AI chat (10 messages/lecture)</li>
                <li><span className="check">✓</span> Lecture history</li>
                <li><span className="x">✗</span> <span style={{ color: 'var(--gray-400)' }}>PDF export</span></li>
                <li><span className="x">✗</span> <span style={{ color: 'var(--gray-400)' }}>Unlimited chats</span></li>
              </ul>
              <Link href="/sign-up" className="l-btn-pricing l-btn-pricing-outline">Get started free</Link>
            </div>
            <div className="l-pricing-card featured">
              <div className="l-pricing-badge">MOST POPULAR</div>
              <div className="l-pricing-name">Pro</div>
              <div className="l-pricing-price"><sup>$</sup>9<sub>/mo</sub></div>
              <p className="l-pricing-desc">For students who rely on LectureAI every week.</p>
              <hr className="l-pricing-divider" />
              <ul className="l-pricing-features">
                <li><span className="check">✓</span> <strong>Unlimited</strong> lectures</li>
                <li><span className="check">✓</span> AI-generated notes</li>
                <li><span className="check">✓</span> <strong>Unlimited</strong> AI chat</li>
                <li><span className="check">✓</span> Full lecture history</li>
                <li><span className="check">✓</span> PDF export</li>
                <li><span className="check">✓</span> Priority processing</li>
              </ul>
              <Link href="/sign-up" className="l-btn-pricing l-btn-pricing-filled">Start free trial</Link>
            </div>
          </div>
          <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--gray-400)' }}>🔒 Payments are secure and encrypted. Cancel anytime — no questions asked.</p>
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
        <p>Join students turning hours of recordings into exam-ready notes.</p>
        <Link href="/sign-up" className="l-btn-hero">Get started free — no credit card needed</Link>
        <div className="l-cta-guarantee">🔒 Secure sign-up &nbsp;·&nbsp; Free plan available &nbsp;·&nbsp; Cancel anytime</div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
        <p>© 2026 LectureAI. Built with ❤️ for CS students everywhere.</p>
      </footer>
    </>
  )
}
