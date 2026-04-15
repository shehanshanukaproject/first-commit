import { auth, clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { subject, message, userEmail: providedEmail } = await request.json()
    if (!message?.trim()) return Response.json({ error: 'Message is required.' }, { status: 400 })
    if (message.trim().length < 10) return Response.json({ error: 'Please describe your issue in more detail.' }, { status: 400 })

    // Try to get the real email from Clerk
    let userEmail = providedEmail || ''
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      userEmail = user.emailAddresses?.[0]?.emailAddress || providedEmail || 'unknown'
    } catch {}

    const subjectLine = subject || 'General Inquiry'
    const now = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })

    await resend.emails.send({
      from: 'LectureAI Support <support@lectureai.cc>',
      to:   ['support@lectureai.cc'],
      replyTo: userEmail,
      subject: `[Support] ${subjectLine} — ${userEmail}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="background:#4f46e5;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:20px;">
            <h2 style="margin:0;font-size:18px;">📬 New Support Request — LectureAI</h2>
          </div>

          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#374151;background:#f3f4f6;width:120px;border-bottom:1px solid #e5e7eb;">From</td>
              <td style="padding:12px 16px;color:#1f2937;border-bottom:1px solid #e5e7eb;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#374151;background:#f3f4f6;border-bottom:1px solid #e5e7eb;">User ID</td>
              <td style="padding:12px 16px;color:#6b7280;font-size:12px;border-bottom:1px solid #e5e7eb;">${userId}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#374151;background:#f3f4f6;border-bottom:1px solid #e5e7eb;">Category</td>
              <td style="padding:12px 16px;color:#1f2937;border-bottom:1px solid #e5e7eb;">${subjectLine}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#374151;background:#f3f4f6;">Submitted</td>
              <td style="padding:12px 16px;color:#6b7280;">${now} UTC</td>
            </tr>
          </table>

          <div style="margin-top:20px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;">
            <p style="font-weight:700;color:#374151;margin:0 0 10px;">Message</p>
            <p style="color:#1f2937;line-height:1.7;margin:0;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>

          <p style="margin-top:16px;font-size:12px;color:#9ca3af;text-align:center;">
            Reply directly to this email to respond to the user.
          </p>
        </div>
      `,
    })

    return Response.json({ success: true })

  } catch (error) {
    console.error('Support email error:', error)
    return Response.json({ error: 'Failed to send your message. Please email support@lectureai.cc directly.' }, { status: 500 })
  }
}
