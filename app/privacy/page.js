import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — LectureAI',
  description: 'Privacy Policy for LectureAI — how we collect, use, and protect your data.',
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
  highlight: {
    background: '#f0fdf4',
    borderLeft: '3px solid #22c55e',
    padding: '14px 18px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '20px',
    fontSize: '15px',
    color: '#374151',
  },
  infoBox: {
    background: '#eef2ff',
    borderLeft: '3px solid #4f46e5',
    padding: '14px 18px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '20px',
    fontSize: '15px',
    color: '#374151',
  },
  thirdPartyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  thirdPartyCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  thirdPartyName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0a0a0a',
    marginBottom: '4px',
  },
  thirdPartyRole: {
    fontSize: '13px',
    color: '#6b7280',
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

export default function PrivacyPage() {
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
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.lastUpdated}>Last updated: April 2026</p>

        {/* 1. Introduction */}
        <h2 style={styles.h2}>1. Introduction</h2>
        <p style={styles.p}>
          LectureAI (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy.
          This Privacy Policy explains what personal data we collect when you use LectureAI, how we use it,
          who we share it with, and what rights you have over it.
        </p>
        <p style={styles.p}>
          By using LectureAI, you agree to the collection and use of information in accordance with this policy.
          If you have any questions or concerns about how we handle your data, please contact us at{' '}
          <a href="mailto:support@lectureai.cc" style={styles.link}>support@lectureai.cc</a>.
        </p>

        {/* 2. Information We Collect */}
        <h2 style={styles.h2}>2. Information We Collect</h2>
        <p style={styles.p}>
          We collect the minimum data necessary to provide the Service. Here is a breakdown of what we collect
          and where it comes from:
        </p>

        <p style={{ ...styles.p, fontWeight: 600, marginBottom: '6px' }}>Account Information</p>
        <p style={styles.p}>
          When you create an account, Clerk (our authentication provider) collects your name and email address.
          This information is used to identify your account and send you important service-related communications
          such as receipts, account alerts, and policy updates.
        </p>

        <p style={{ ...styles.p, fontWeight: 600, marginBottom: '6px' }}>Audio and Video Files</p>
        <div style={styles.highlight}>
          <strong>Your recordings are not stored.</strong> Audio and video files you upload are sent directly to
          OpenAI Whisper for transcription and are immediately discarded from our servers once processing is
          complete. We do not retain your original recordings.
        </div>

        <p style={{ ...styles.p, fontWeight: 600, marginBottom: '6px' }}>Generated Content</p>
        <p style={styles.p}>
          Lecture transcripts and AI-generated study notes produced from your uploads are stored in our Supabase
          database and linked to your user account. This allows you to access your notes across sessions. You
          can delete your notes at any time from the dashboard.
        </p>

        <p style={{ ...styles.p, fontWeight: 600, marginBottom: '6px' }}>Usage Data</p>
        <p style={styles.p}>
          We collect basic, anonymised analytics on feature usage — such as how often certain features are used
          and general performance metrics. This data helps us improve the Service and is never linked to
          personally identifiable information.
        </p>

        <p style={{ ...styles.p, fontWeight: 600, marginBottom: '6px' }}>Payment Information</p>
        <div style={styles.infoBox}>
          <strong>We never see your card details.</strong> All payment processing is handled entirely by
          PayPal, our payment provider. We receive only a confirmation of a successful transaction and
          your subscription status. Your full card number, CVV, and billing address are never transmitted to
          or stored by LectureAI.
        </div>

        {/* 3. How We Use */}
        <h2 style={styles.h2}>3. How We Use Your Information</h2>
        <p style={styles.p}>We use the information we collect for the following purposes:</p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>To provide the Service</strong> — processing your audio uploads, generating transcripts and study notes, and giving you access to your saved content.</li>
          <li style={styles.li}><strong>To manage your account</strong> — authenticating your identity, enforcing plan limits, and maintaining your subscription status.</li>
          <li style={styles.li}><strong>To improve accuracy and reliability</strong> — using anonymised usage patterns to identify areas for improvement, fix bugs, and optimise performance.</li>
          <li style={styles.li}><strong>To send important account communications</strong> — delivering transactional emails such as payment receipts, plan change notifications, and critical service updates. We do not send promotional marketing emails without your explicit consent.</li>
          <li style={styles.li}><strong>To process payments</strong> — verifying subscription status with PayPal and updating your plan accordingly.</li>
          <li style={styles.li}><strong>To comply with legal obligations</strong> — retaining records as required by applicable law and responding to lawful requests from authorities.</li>
        </ul>

        {/* 4. Data Storage */}
        <h2 style={styles.h2}>4. Data Storage and Security</h2>
        <p style={styles.p}>
          Your generated notes, transcripts, and account data are stored in a Supabase-managed PostgreSQL
          database. Supabase is a trusted cloud database provider with data centres operating under strict
          security standards.
        </p>
        <p style={styles.p}>
          Each user&rsquo;s data is isolated by a unique user ID assigned by Clerk. Our database access rules
          are configured so that users can only access their own data. Administrative database access is
          restricted to authorised personnel only.
        </p>
        <p style={styles.p}>
          All data in transit between your browser, our servers, and third-party providers is encrypted using
          HTTPS/TLS. We regularly review our security practices and update them as industry standards evolve.
          However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute
          security.
        </p>

        {/* 5. Third-Party Services */}
        <h2 style={styles.h2}>5. Third-Party Services</h2>
        <p style={styles.p}>
          LectureAI relies on the following trusted third-party services to operate. Each provider processes
          data in accordance with their own privacy policies, which we encourage you to review:
        </p>
        <div style={styles.thirdPartyGrid}>
          <div style={styles.thirdPartyCard}>
            <p style={styles.thirdPartyName}>Clerk</p>
            <p style={styles.thirdPartyRole}>Authentication — manages sign-in, sign-up, and session tokens</p>
          </div>
          <div style={styles.thirdPartyCard}>
            <p style={styles.thirdPartyName}>Supabase</p>
            <p style={styles.thirdPartyRole}>Database — stores your notes, transcripts, and account settings</p>
          </div>
          <div style={styles.thirdPartyCard}>
            <p style={styles.thirdPartyName}>OpenAI</p>
            <p style={styles.thirdPartyRole}>Whisper API — transcribes your uploaded audio files</p>
          </div>
          <div style={styles.thirdPartyCard}>
            <p style={styles.thirdPartyName}>Anthropic</p>
            <p style={styles.thirdPartyRole}>Claude API — generates study notes and powers the AI chat</p>
          </div>
          <div style={styles.thirdPartyCard}>
            <p style={styles.thirdPartyName}>PayPal</p>
            <p style={styles.thirdPartyRole}>Payments — processes subscription billing securely</p>
          </div>
        </div>
        <p style={styles.p}>
          We do not sell, rent, or share your personal information with any third party for advertising or
          marketing purposes. Data shared with the above providers is shared only to the extent necessary
          to deliver the Service.
        </p>

        {/* 6. Audio Retention */}
        <h2 style={styles.h2}>6. Audio File Retention</h2>
        <p style={styles.p}>
          When you upload an audio or video file to LectureAI, it is temporarily held in server memory or
          a secure temporary directory for the duration of the transcription process only. Once the transcript
          has been successfully generated, the original file is permanently deleted from our infrastructure.
        </p>
        <p style={styles.p}>
          We do not store, archive, listen to, or use your original recordings for any purpose other than
          generating the transcription you requested. The transcript text itself is stored in your account
          so you can view and manage your notes.
        </p>

        {/* 7. Your Rights */}
        <h2 style={styles.h2}>7. Your Rights</h2>
        <p style={styles.p}>
          You have the following rights with respect to your personal data:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Access</strong> — you can view all notes and transcripts we have stored for you directly in your dashboard.</li>
          <li style={styles.li}><strong>Deletion</strong> — you can delete individual lectures and notes from your dashboard at any time. To request complete deletion of your account and all associated data, email us at <a href="mailto:support@lectureai.cc" style={styles.link}>support@lectureai.cc</a>. We will process your request within 30 days.</li>
          <li style={styles.li}><strong>Correction</strong> — if any personal information we hold about you is inaccurate, you can update it via your account settings or contact us directly.</li>
          <li style={styles.li}><strong>Portability</strong> — you can export your generated notes at any time from your dashboard.</li>
          <li style={styles.li}><strong>Objection</strong> — you may object to our processing of your data for legitimate interests. We will consider and respond to your request within a reasonable timeframe.</li>
        </ul>
        <p style={styles.p}>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:support@lectureai.cc" style={styles.link}>support@lectureai.cc</a>.
        </p>

        {/* 8. Cookies */}
        <h2 style={styles.h2}>8. Cookies</h2>
        <p style={styles.p}>
          LectureAI uses only essential cookies required for the Service to function. Specifically, Clerk
          places session cookies in your browser to maintain your authenticated state. These cookies are
          necessary — without them you would be logged out on every page load.
        </p>
        <p style={styles.p}>
          We do not use advertising cookies, third-party tracking cookies, or analytics cookies that
          follow you across other websites. We do not participate in cross-site tracking or retargeting
          programmes.
        </p>

        {/* 9. Children */}
        <h2 style={styles.h2}>9. Children&rsquo;s Privacy</h2>
        <p style={styles.p}>
          LectureAI is not intended for use by children under the age of 13. We do not knowingly collect
          personal information from children under 13. If you are a parent or guardian and believe your
          child has provided us with personal information, please contact us at{' '}
          <a href="mailto:support@lectureai.cc" style={styles.link}>support@lectureai.cc</a> and we will
          promptly delete the relevant data.
        </p>

        {/* 10. Changes */}
        <h2 style={styles.h2}>10. Changes to This Policy</h2>
        <p style={styles.p}>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
          legal requirements, or for other operational reasons. When we make material changes, we will notify
          registered users by email at least 14 days before the changes take effect.
        </p>
        <p style={styles.p}>
          The updated policy will always be available at this page with the &ldquo;Last updated&rdquo; date
          revised accordingly. We encourage you to review this policy periodically. Your continued use of the
          Service after changes take effect constitutes your acceptance of the revised policy.
        </p>

        {/* 11. Contact */}
        <h2 style={styles.h2}>11. Contact</h2>
        <p style={styles.p}>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
          please get in touch:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Email:</strong>{' '}<a href="mailto:support@lectureai.cc" style={styles.link}>support@lectureai.cc</a></li>
          <li style={styles.li}><strong>Website:</strong>{' '}<Link href="/" style={styles.link}>lectureai.cc</Link></li>
        </ul>
        <p style={styles.p}>
          We aim to respond to all privacy-related enquiries within 5 business days.
        </p>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} LectureAI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
          <Link href="/refund" style={styles.footerLink}>Refund Policy</Link>
          <Link href="/" style={styles.footerLink}>Home</Link>
        </div>
      </footer>
    </div>
  )
}
