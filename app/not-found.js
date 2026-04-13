import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      textAlign: 'center',
      padding: '24px',
    }}>
      <div style={{ fontSize: '72px', fontWeight: '900', color: '#4f46e5', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '16px 0 8px', color: '#0a0a0a' }}>
        Page not found
      </h1>
      <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '32px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" style={{
        padding: '11px 28px',
        background: '#4f46e5',
        color: '#fff',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '600',
      }}>
        Back to home
      </Link>
    </div>
  )
}
