import { auth } from '@clerk/nextjs/server'

// Temporary diagnostic route — delete after confirming PayPal works
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  return Response.json({
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? `set (${process.env.PAYPAL_CLIENT_ID.slice(0, 6)}…)` : 'MISSING',
    PAYPAL_SECRET: process.env.PAYPAL_SECRET ? `set (${process.env.PAYPAL_SECRET.slice(0, 4)}…)` : 'MISSING',
    PAYPAL_MODE: process.env.PAYPAL_MODE || 'MISSING (defaults to sandbox)',
    PAYPAL_PLAN_ID: process.env.PAYPAL_PLAN_ID || 'empty (will auto-create)',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
  })
}
