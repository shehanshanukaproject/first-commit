'use client'
import { useUser, UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'
import { useProStatus } from '@/hooks/useProStatus'

const accent = '#4f46e5'
const accentDark = '#3730a3'
const gray100 = '#f3f4f6'
const gray200 = '#e5e7eb'
const gray400 = '#9ca3af'
const gray600 = '#4b5563'
const gray800 = '#1f2937'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function AccountPage() {
  const { user } = useUser()
  const { isPro, plan, subscriptionId, memberSince, isLoading } = useProStatus()

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelled, setCancelled] = useState(false)

  async function handleCancel() {
    setCancelling(true)
    setCancelError('')
    try {
      const res = await fetch('/api/paypal/cancel-subscription', { method: 'POST' })
      let data
      try { data = await res.json() } catch { throw new Error('Server error. Please try again.') }
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription')
      setCancelled(true)
      setShowCancelModal(false)
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* NAV */}
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${gray200}`, background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/dashboard" style={{ fontSize: '20px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none' }}>
            Lecture<span style={{ color: accent }}>AI</span>
          </Link>
          <Link href="/dashboard" style={{ fontSize: '14px', color: gray600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Dashboard
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" />
      </nav>

      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: gray800, marginBottom: '8px' }}>Account</h1>
        <p style={{ fontSize: '15px', color: gray600, marginBottom: '32px' }}>Manage your profile and subscription</p>

        {/* PROFILE CARD */}
        <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${gray200}`, padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: gray800, marginBottom: '16px' }}>Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user?.imageUrl && (
              <img src={user.imageUrl} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
            )}
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: gray800, margin: 0 }}>
                {user?.fullName || user?.firstName || 'User'}
              </p>
              <p style={{ fontSize: '14px', color: gray600, margin: '2px 0 0' }}>
                {user?.emailAddresses?.[0]?.emailAddress || ''}
              </p>
            </div>
            {!isLoading && isPro && (
              <span style={{ marginLeft: 'auto', background: '#ecfdf5', color: '#065f46', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', border: '1px solid #6ee7b7' }}>
                ⭐ Pro
              </span>
            )}
          </div>
        </div>

        {/* SUBSCRIPTION CARD */}
        <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${gray200}`, padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: gray800, marginBottom: '16px' }}>Subscription</h2>

          {isLoading ? (
            <p style={{ fontSize: '14px', color: gray400 }}>Loading...</p>
          ) : cancelled ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#166534', margin: 0 }}>
                Subscription cancelled successfully.
              </p>
              <p style={{ fontSize: '13px', color: '#16a34a', margin: '4px 0 0' }}>
                You&apos;ve been moved to the Free plan.
              </p>
            </div>
          ) : isPro ? (
            <>
              {/* Pro status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
                <span style={{ fontSize: '28px' }}>⭐</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#166534', margin: 0 }}>Pro Member</p>
                  <p style={{ fontSize: '13px', color: '#16a34a', margin: '2px 0 0' }}>
                    Active since {formatDate(memberSince)}
                  </p>
                </div>
              </div>

              {/* Plan details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: gray400, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Plan</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: gray800, margin: 0 }}>Pro — $6/month</p>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: gray400, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Status</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a', margin: 0 }}>Active</p>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: gray400, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Billing</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: gray800, margin: 0 }}>Monthly</p>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: gray400, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Lectures</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: gray800, margin: 0 }}>Unlimited</p>
                </div>
              </div>

              {/* PayPal subscription ID */}
              {subscriptionId && (
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🅿️</span>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: gray400, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>PayPal Subscription</p>
                    <p style={{ fontSize: '13px', color: gray600, margin: 0, fontFamily: 'monospace' }}>
                      {subscriptionId.slice(0, 12)}•••{subscriptionId.slice(-4)}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel button */}
              <button
                onClick={() => setShowCancelModal(true)}
                style={{ padding: '10px 20px', background: 'none', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                Cancel Subscription
              </button>
            </>
          ) : (
            /* Free plan */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f9fafb', borderRadius: '10px', border: `1px solid ${gray200}`, marginBottom: '20px' }}>
                <span style={{ fontSize: '28px' }}>🎓</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: gray800, margin: 0 }}>Free Plan</p>
                  <p style={{ fontSize: '13px', color: gray600, margin: '2px 0 0' }}>3 lectures per month</p>
                </div>
              </div>

              <p style={{ fontSize: '14px', color: gray600, marginBottom: '16px' }}>
                Upgrade to <strong>Pro</strong> for <strong>$6/month</strong> — unlimited lectures, AI chat, quizzes, and PDF export.
              </p>

              <Link
                href="/dashboard"
                style={{ display: 'inline-block', padding: '10px 24px', background: accent, color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
              >
                Upgrade to Pro →
              </Link>
            </>
          )}
        </div>

        {/* WHAT YOU GET CARD (pro only) */}
        {!isLoading && isPro && (
          <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${gray200}`, padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: gray800, marginBottom: '14px' }}>Your Pro benefits</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Unlimited lecture uploads per month',
                'AI-powered notes generation',
                'Unlimited AI chat sessions per lecture',
                'Practice quiz generation',
                'Full lecture history',
                'Priority processing',
              ].map(benefit => (
                <li key={benefit} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: gray800 }}>
                  <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: gray800, textAlign: 'center', marginBottom: '10px' }}>
              Cancel subscription?
            </h2>
            <p style={{ fontSize: '14px', color: gray600, textAlign: 'center', lineHeight: 1.6, marginBottom: '8px' }}>
              You will immediately lose access to Pro features and be moved to the Free plan (3 lectures/month).
            </p>
            <p style={{ fontSize: '13px', color: gray400, textAlign: 'center', marginBottom: '24px' }}>
              This action cannot be undone.
            </p>

            {cancelError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {cancelError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowCancelModal(false); setCancelError('') }}
                disabled={cancelling}
                style={{ flex: 1, padding: '12px', background: gray100, color: gray800, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Keep Pro
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.7 : 1 }}
              >
                {cancelling ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
