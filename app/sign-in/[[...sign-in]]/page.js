import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f5f3ff 0%, #ffffff 60%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none' }}>
          Lecture<span style={{ color: '#4f46e5' }}>AI</span>
        </Link>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          No account?{' '}
          <Link href="/sign-up" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '15px', color: '#6b7280' }}>Sign in to access your lectures and notes</p>
          </div>
          <SignIn />
        </div>
      </div>
    </div>
  )
}
