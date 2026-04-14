import Link from 'next/link'

export const metadata = {
  title: 'Welcome to Pro — LectureAI',
}

export default function SuccessPage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        {/* Icon */}
        <div style={{
          width: '72px', height: '72px',
          background: '#ecfdf5',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px',
          margin: '0 auto 24px',
        }}>
          🎉
        </div>

        <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-1px', color: '#0a0a0a', marginBottom: '12px' }}>
          You're now on Pro!
        </h1>
        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.7', marginBottom: '8px' }}>
          Thank you for upgrading to LectureAI Pro. Your account has been activated with unlimited lectures, unlimited AI chat, and all Pro features.
        </p>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '36px' }}>
          A receipt has been sent to your email address.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '36px' }}>
          {['✓ Unlimited lectures', '✓ Unlimited AI chat', '✓ PDF export', '✓ Practice quizzes', '✓ Priority processing'].map((f) => (
            <span key={f} style={{
              background: '#eef2ff', color: '#4f46e5',
              fontSize: '13px', fontWeight: 600,
              padding: '5px 12px', borderRadius: '100px',
              border: '1px solid rgba(79,70,229,0.2)',
            }}>
              {f}
            </span>
          ))}
        </div>

        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '14px 40px',
            background: '#4f46e5',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
          }}
        >
          Go to Dashboard →
        </Link>

        <p style={{ marginTop: '20px', fontSize: '13px', color: '#9ca3af' }}>
          Questions? <a href="mailto:support@lectureai.cc" style={{ color: '#4f46e5', textDecoration: 'none' }}>Contact support</a>
        </p>
      </div>
    </div>
  )
}
