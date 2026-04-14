import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — LectureAI',
  description: 'Terms of Service for LectureAI — AI-powered lecture transcription and study notes.',
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
    marginBottom: '6px',
  },
  highlight: {
    background: '#eef2ff',
    borderLeft: '3px solid #4f46e5',
    padding: '14px 18px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '20px',
    fontSize: '15px',
    color: '#374151',
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

export default function TermsPage() {
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
        <h1 style={styles.h1}>Terms of Service</h1>
        <p style={styles.lastUpdated}>Last updated: April 2026</p>

        {/* 1. Acceptance */}
        <h2 style={styles.h2}>1. Acceptance of Terms</h2>
        <p style={styles.p}>
          By accessing or using LectureAI (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service
          (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not access or use the Service. These Terms
          constitute a legally binding agreement between you and LectureAI. By creating an account or using any
          feature of the Service, you confirm that you have read, understood, and agree to be bound by these Terms
          and our Privacy Policy.
        </p>
        <p style={styles.p}>
          We reserve the right to update or modify these Terms at any time. We will notify users of significant
          changes by posting a notice on the Service or by email. Your continued use of the Service after any
          changes take effect constitutes your acceptance of the revised Terms.
        </p>

        {/* 2. Description */}
        <h2 style={styles.h2}>2. Description of Service</h2>
        <p style={styles.p}>
          LectureAI is an AI-powered study tool designed to help students and learners get more from their lectures.
          The Service allows you to upload lecture audio or video recordings and receive automatically generated
          transcriptions and structured study notes.
        </p>
        <p style={styles.p}>
          Transcription is powered by OpenAI Whisper, and study note generation is performed using Anthropic Claude.
          Supported file formats include MP3, MP4, WAV, and M4A, with a maximum file size of 25 MB per upload
          (larger files may be compressed automatically where supported). Additional features include a PDF Analyzer
          for chatting with document content, a Practice Quiz generator, and an AI-powered chat interface for
          each set of notes.
        </p>
        <p style={styles.p}>
          The Service is intended for personal, non-commercial educational use. We reserve the right to modify,
          suspend, or discontinue any aspect of the Service at any time with reasonable notice.
        </p>

        {/* 3. Accounts */}
        <h2 style={styles.h2}>3. User Accounts</h2>
        <p style={styles.p}>
          Account creation and authentication on LectureAI is handled by Clerk, a third-party identity platform.
          You may sign up using an email address or a supported OAuth provider (such as Google). By creating an
          account, you agree to Clerk&rsquo;s Terms of Service and Privacy Policy in addition to our own.
        </p>
        <p style={styles.p}>
          You are solely responsible for maintaining the confidentiality of your account credentials and for all
          activity that occurs under your account. You agree to notify us immediately at{' '}
          <a href="mailto:support@lectureai.cc" style={styles.footerLink}>support@lectureai.cc</a> if you suspect
          any unauthorised use of your account. LectureAI will not be liable for any loss or damage arising from
          your failure to keep your credentials secure.
        </p>
        <p style={styles.p}>
          You must be at least 13 years of age to use this Service. If you are under the age of majority in your
          jurisdiction, you confirm that you have your parent or guardian&rsquo;s consent to use the Service.
        </p>

        {/* 4. Billing */}
        <h2 style={styles.h2}>4. Subscription and Billing</h2>
        <p style={styles.p}>
          LectureAI offers the following plans:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Free Plan:</strong> Up to 3 lecture uploads per calendar month, with access to core transcription and note generation features.</li>
          <li style={styles.li}><strong>Pro Plan:</strong> Unlimited lecture uploads, unlimited AI chat, PDF Analyzer, Practice Quiz generation, and priority processing, billed at $6 USD per month.</li>
        </ul>
        <p style={styles.p}>
          Payments for the Pro Plan are processed securely by Lemon Squeezy, our payment provider. By subscribing,
          you authorise Lemon Squeezy to charge your chosen payment method on a recurring monthly basis until you
          cancel. Your subscription will automatically renew each month unless cancelled before the renewal date.
        </p>
        <p style={styles.p}>
          A free trial may be offered at our discretion. Trial periods convert automatically to a paid subscription
          at the end of the trial unless cancelled. All prices are shown in US dollars and may be subject to
          applicable taxes depending on your location.
        </p>
        <div style={styles.highlight}>
          <strong>Refund Policy:</strong> Payments are generally non-refundable. If you believe you were charged in
          error, please contact us at{' '}
          <a href="mailto:support@lectureai.cc" style={styles.footerLink}>support@lectureai.cc</a> within 7 days of
          the charge and we will review your case. Please refer to our{' '}
          <Link href="/refund" style={styles.footerLink}>Refund Policy</Link> for full details.
        </div>

        {/* 5. Acceptable Use */}
        <h2 style={styles.h2}>5. Acceptable Use</h2>
        <p style={styles.p}>
          You agree to use LectureAI only for lawful purposes and in accordance with these Terms. You must not:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Upload audio or video content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable.</li>
          <li style={styles.li}>Upload recordings that infringe the copyright, trademark, or other intellectual property rights of any third party, including commercially produced audio or music without appropriate licences.</li>
          <li style={styles.li}>Attempt to gain unauthorised access to any part of the Service, its servers, or any systems or networks connected to the Service.</li>
          <li style={styles.li}>Use automated scripts, bots, or any other means to scrape, crawl, or make excessive automated requests to the Service or its APIs.</li>
          <li style={styles.li}>Circumvent, disable, or interfere with security-related features of the Service, including features that enforce usage limits.</li>
          <li style={styles.li}>Use the Service for any commercial purpose, including reselling or redistributing generated notes, without our prior written consent.</li>
          <li style={styles.li}>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
        </ul>
        <p style={styles.p}>
          We reserve the right to investigate and take appropriate action against anyone who, in our sole discretion,
          violates these provisions, including removing content, suspending access, and reporting to law enforcement.
        </p>

        {/* 6. IP */}
        <h2 style={styles.h2}>6. Intellectual Property</h2>
        <p style={styles.p}>
          LectureAI and its original content, features, design, branding, and functionality are and will remain the
          exclusive property of LectureAI and its licensors. The LectureAI name, logo, and all related marks are
          trademarks of LectureAI. You may not use these marks without our prior written permission.
        </p>
        <p style={styles.p}>
          You retain full ownership of the audio files and documents you upload to the Service. You also own the
          study notes and transcriptions generated from your uploads. By uploading content, you grant LectureAI a
          limited, non-exclusive licence to process your content solely for the purpose of providing the Service to
          you. We do not use your uploaded content to train AI models, and we do not share your content with third
          parties except as necessary to operate the Service (e.g., sending audio to OpenAI Whisper for transcription
          or text to Anthropic Claude for note generation).
        </p>

        {/* 7. Privacy */}
        <h2 style={styles.h2}>7. Privacy</h2>
        <p style={styles.p}>
          Your privacy is important to us. Our{' '}
          <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link> explains how we collect, use, and
          protect your personal information when you use the Service. By using LectureAI, you acknowledge that you
          have read and understood our Privacy Policy.
        </p>
        <p style={styles.p}>
          In summary, we collect only the information necessary to provide the Service, we do not sell your personal
          data to third parties, and we employ industry-standard security measures to protect your information. Please
          review the full Privacy Policy at{' '}
          <Link href="/privacy" style={styles.footerLink}>lectureai.cc/privacy</Link> for complete details.
        </p>

        {/* 8. Disclaimers */}
        <h2 style={styles.h2}>8. Disclaimers</h2>
        <p style={styles.p}>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
          EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
        <p style={styles.p}>
          Study notes and transcriptions generated by LectureAI are produced by artificial intelligence and may
          contain errors, omissions, or inaccuracies. AI-generated content should be used as a study aid only and
          is not a substitute for attending lectures, reading primary sources, or seeking professional academic
          advice. Always verify important information against authoritative sources.
        </p>
        <p style={styles.p}>
          We do not warrant that the Service will be uninterrupted, error-free, or free from viruses or other
          harmful components. We do not guarantee the accuracy, completeness, or suitability of any content
          generated by the Service for any particular purpose.
        </p>

        {/* 9. Liability */}
        <h2 style={styles.h2}>9. Limitation of Liability</h2>
        <p style={styles.p}>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LECTUREAI AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
          AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          INCLUDING LOSS OF DATA, LOSS OF PROFITS, OR LOSS OF GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR
          USE OF OR INABILITY TO USE THE SERVICE.
        </p>
        <p style={styles.p}>
          In any case, our maximum aggregate liability to you for any claims arising under or related to these Terms
          or your use of the Service shall not exceed the total amount you paid to LectureAI in the three (3) months
          immediately preceding the event giving rise to the claim.
        </p>

        {/* 10. Termination */}
        <h2 style={styles.h2}>10. Termination</h2>
        <p style={styles.p}>
          You may stop using the Service and delete your account at any time through your account settings. Upon
          deletion, your personal data will be handled in accordance with our Privacy Policy.
        </p>
        <p style={styles.p}>
          We reserve the right to suspend or permanently terminate your access to the Service, with or without
          notice, if we reasonably believe you have violated these Terms, engaged in fraudulent or abusive behaviour,
          or if required by law. In the event of termination due to a violation of these Terms, you will not be
          entitled to a refund of any prepaid fees.
        </p>

        {/* 11. Governing Law */}
        <h2 style={styles.h2}>11. Governing Law</h2>
        <p style={styles.p}>
          These Terms shall be governed by and construed in accordance with the laws of Sri Lanka, without regard
          to its conflict of law principles. Any disputes arising under or in connection with these Terms shall be
          subject to the exclusive jurisdiction of the courts located in Sri Lanka. If any provision of these Terms
          is found to be unenforceable, the remaining provisions will continue in full force and effect.
        </p>

        {/* 12. Contact */}
        <h2 style={styles.h2}>12. Contact</h2>
        <p style={styles.p}>
          If you have any questions, concerns, or requests regarding these Terms of Service, please contact us:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Email:</strong>{' '}<a href="mailto:support@lectureai.cc" style={styles.footerLink}>support@lectureai.cc</a></li>
          <li style={styles.li}><strong>Website:</strong>{' '}<Link href="/" style={styles.footerLink}>lectureai.cc</Link></li>
        </ul>
        <p style={styles.p}>
          We aim to respond to all enquiries within 2 business days.
        </p>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} LectureAI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link>
          <Link href="/refund" style={styles.footerLink}>Refund Policy</Link>
          <Link href="/" style={styles.footerLink}>Home</Link>
        </div>
      </footer>
    </div>
  )
}
