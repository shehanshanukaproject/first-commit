import Link from 'next/link'

export const metadata = {
  title: 'Refund Policy — LectureAI',
  description: 'Refund Policy for LectureAI — how to request a refund and what to expect.',
}

const styles = {
  page: {
    minHeight: '100vh',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#fff',
    color: '#1a1a1a',
  },
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '0 24px',
    height: '60px',
    borderBottom: '1px solid #e5e7eb',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
  },
  navBack: {
    fontSize: '14px',
    color: '#6b7280',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    lineHeight: 1,
  },
  navLogo: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0a0a0a',
    textDecoration: 'none',
  },
  navAccent: {
    color: '#4f46e5',
  },
  main: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '40px 24px 80px',
    lineHeight: '1.8',
  },
  eyebrow: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '12px',
  },
  h1: {
    fontSize: '34px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: '#0a0a0a',
    marginBottom: '8px',
    lineHeight: '1.2',
  },
  lastUpdated: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '48px',
  },
  h2: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0a0a0a',
    marginTop: '40px',
    marginBottom: '12px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
    lineHeight: '1.4',
  },
  p: {
    fontSize: '15px',
    color: '#374151',
    marginBottom: '16px',
    lineHeight: '1.8',
  },
  ul: {
    fontSize: '15px',
    color: '#374151',
    paddingLeft: '20px',
    marginBottom: '16px',
    lineHeight: '1.8',
  },
  li: {
    marginBottom: '8px',
  },
  highlightGreen: {
    background: '#f0fdf4',
    borderLeft: '3px solid #22c55e',
    padding: '14px 18px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '20px',
    fontSize: '15px',
    color: '#374151',
  },
  highlightAmber: {
    background: '#fffbeb',
    borderLeft: '3px solid #f59e0b',
    padding: '14px 18px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '20px',
    fontSize: '15px',
    color: '#374151',
  },
  highlightRed: {
    background: '#fef2f2',
    borderLeft: '3px solid #ef4444',
    padding: '14px 18px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '20px',
    fontSize: '15px',
    color: '#374151',
  },
  stepGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  stepCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center',
  },
  stepNumber: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#4f46e5',
    marginBottom: '6px',
  },
  stepLabel: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.5',
  },
  link: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: 500,
  },
  footer: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '24px 24px 48px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#9ca3af',
  },
  footerLink: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: 500,
  },
}

export default function RefundPage() {
  return (
    <div style={styles.page}>
      {/* NAV */}
      <nav style={styles.nav}>
        <Link href="/" style={styles.navBack}>← Back</Link>
        <Link href="/" style={styles.navLogo}>
          Lecture<span style={styles.navAccent}>AI</span>
        </Link>
      </nav>

      {/* CONTENT */}
      <main style={styles.main}>
        <p style={styles.eyebrow}>Legal</p>
        <h1 style={styles.h1}>Refund Policy</h1>
        <p style={styles.lastUpdated}>Last updated: April 2026</p>

        {/* 1. Overview */}
        <h2 style={styles.h2}>1. Overview</h2>
        <p style={styles.p}>
          At LectureAI, we want you to feel confident subscribing to Pro. If the Service does not meet
          your expectations, we are committed to processing refunds fairly, promptly, and without unnecessary
          friction. This policy outlines the conditions under which refunds are available and how to
          request one.
        </p>
        <p style={styles.p}>
          All subscription payments are processed by Lemon Squeezy, our payment provider. Refunds, once
          approved by us, are issued through Lemon Squeezy back to your original payment method.
        </p>

        {/* 2. Free Trial */}
        <h2 style={styles.h2}>2. Free Trial</h2>
        <div style={styles.highlightGreen}>
          <strong>Try Pro risk-free.</strong> The LectureAI Pro plan includes a free trial period.
          You will not be charged anything until your trial ends. You can cancel at any time before
          the trial expires and you will not be billed.
        </div>
        <p style={styles.p}>
          When you start a free trial, your payment details are collected by Lemon Squeezy to set up
          the subscription, but no charge is made until the trial period concludes. A reminder is sent
          to your account email before the trial converts to a paid subscription.
        </p>
        <p style={styles.p}>
          If you cancel during the trial, your Pro access continues until the trial period ends and no
          charge is applied. We do not offer a second free trial on the same account.
        </p>

        {/* 3. Eligibility */}
        <h2 style={styles.h2}>3. Eligibility for Refund</h2>
        <div style={styles.highlightGreen}>
          <strong>7-day money-back guarantee.</strong> If you are not satisfied after your first paid
          charge, you may request a full refund within 7 days — no questions asked.
        </div>
        <p style={styles.p}>
          To be eligible for a no-questions-asked refund, your request must be received within
          7 calendar days of the date of your first paid charge. This applies to new subscribers
          only and is available once per account.
        </p>
        <p style={styles.p}>
          After the 7-day window has passed, refunds are considered on a case-by-case basis at our
          discretion. We will take into account factors such as service outages, billing errors,
          or exceptional circumstances. We encourage you to reach out — we aim to be reasonable.
        </p>

        {/* 4. How to Request */}
        <h2 style={styles.h2}>4. How to Request a Refund</h2>
        <p style={styles.p}>
          To request a refund, send an email to{' '}
          <a href="mailto:support@lectureai.cc" style={styles.link}>support@lectureai.cc</a> with
          the following details:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Subject line:</strong> &ldquo;Refund Request&rdquo;</li>
          <li style={styles.li}><strong>Your account email address</strong> (the one used to sign in to LectureAI)</li>
          <li style={styles.li}><strong>Date of charge</strong> (optional — helps us locate your transaction faster)</li>
          <li style={styles.li}><strong>Reason for refund</strong> (optional for 7-day requests; helpful for discretionary requests)</li>
        </ul>
        <p style={styles.p}>
          We respond to all refund requests within <strong>2 business days</strong>. You do not need
          to cancel your subscription before submitting a refund request — we will handle both if
          applicable.
        </p>
        <div style={styles.stepGrid}>
          <div style={styles.stepCard}>
            <p style={styles.stepNumber}>1</p>
            <p style={styles.stepLabel}>Email support@lectureai.cc with subject &ldquo;Refund Request&rdquo;</p>
          </div>
          <div style={styles.stepCard}>
            <p style={styles.stepNumber}>2</p>
            <p style={styles.stepLabel}>We review and confirm within 2 business days</p>
          </div>
          <div style={styles.stepCard}>
            <p style={styles.stepNumber}>3</p>
            <p style={styles.stepLabel}>Refund issued via Lemon Squeezy to your original payment method</p>
          </div>
        </div>

        {/* 5. Processing */}
        <h2 style={styles.h2}>5. Processing Time</h2>
        <p style={styles.p}>
          Once a refund is approved, it is initiated immediately through Lemon Squeezy. The time it
          takes to appear in your account depends on your bank or card issuer:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Credit and debit cards:</strong> typically 5–10 business days</li>
          <li style={styles.li}><strong>PayPal:</strong> typically 3–5 business days</li>
          <li style={styles.li}><strong>Other payment methods:</strong> processing times may vary; please consult your provider</li>
        </ul>
        <p style={styles.p}>
          You will receive an email confirmation from Lemon Squeezy once the refund has been initiated.
          If you have not received your refund after 10 business days, please contact us and we will
          investigate with Lemon Squeezy on your behalf.
        </p>

        {/* 6. Cancellation */}
        <h2 style={styles.h2}>6. Cancellation</h2>
        <p style={styles.p}>
          You can cancel your Pro subscription at any time from your account settings. Cancellation
          takes effect immediately — no further monthly charges will be made after your cancellation
          is confirmed.
        </p>
        <div style={styles.highlightAmber}>
          <strong>Cancellation does not automatically trigger a refund.</strong> If you cancel mid-cycle,
          you retain Pro access until the end of your current billing period, but the charge for that
          period is not refunded. To request a refund for the current period, please contact us
          separately as described in Section 4.
        </div>
        <p style={styles.p}>
          After cancellation, your account reverts to the Free plan at the end of your paid period.
          Your existing notes and transcripts are retained and remain accessible on the Free plan.
        </p>

        {/* 7. Non-refundable */}
        <h2 style={styles.h2}>7. Non-Refundable Situations</h2>
        <div style={styles.highlightRed}>
          Refunds will not be issued in the following circumstances:
        </div>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>After 7 days from the first charge</strong> — unless approved at our discretion under exceptional circumstances.</li>
          <li style={styles.li}><strong>Partial months</strong> — we do not issue pro-rated refunds for unused days within a billing cycle.</li>
          <li style={styles.li}><strong>Accounts terminated for Terms violations</strong> — if your account is suspended or terminated due to a breach of our <Link href="/terms" style={styles.link}>Terms of Service</Link>, no refund will be issued.</li>
          <li style={styles.li}><strong>Repeat refund requests</strong> — the 7-day money-back guarantee is available once per account and cannot be used on subsequent subscription periods.</li>
          <li style={styles.li}><strong>Charges from a previous subscription period</strong> — refund requests must relate to the most recent charge only.</li>
        </ul>

        {/* 8. Contact */}
        <h2 style={styles.h2}>8. Contact</h2>
        <p style={styles.p}>
          For refund requests or billing questions, please reach out:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Email:</strong>{' '}<a href="mailto:support@lectureai.cc" style={styles.link}>support@lectureai.cc</a></li>
          <li style={styles.li}><strong>Subject line:</strong> &ldquo;Refund Request&rdquo; for faster routing</li>
          <li style={styles.li}><strong>Response time:</strong> within 2 business days</li>
        </ul>
        <p style={styles.p}>
          We also recommend reviewing our{' '}
          <Link href="/terms" style={styles.link}>Terms of Service</Link> and{' '}
          <Link href="/privacy" style={styles.link}>Privacy Policy</Link> for further context on
          how we operate and handle your data.
        </p>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} LectureAI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
          <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link>
          <Link href="/" style={styles.footerLink}>Home</Link>
        </div>
      </footer>
    </div>
  )
}
