import { auth } from '@clerk/nextjs/server'
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY
    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID

    if (!apiKey || !storeId || !variantId) {
      return Response.json({ error: 'Payment configuration missing.' }, { status: 500 })
    }

    lemonSqueezySetup({ apiKey })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data, error } = await createCheckout(storeId, variantId, {
      checkoutData: {
        custom: { user_id: userId },
      },
      productOptions: {
        redirectUrl: `${appUrl}/success`,
        receiptButtonText: 'Go to Dashboard',
        receiptThankYouNote: 'Thank you for upgrading to LectureAI Pro! Your account has been upgraded.',
      },
    })

    if (error) {
      console.error('Lemon Squeezy checkout error:', error)
      return Response.json({ error: 'Failed to create checkout session.' }, { status: 500 })
    }

    const checkoutUrl = data?.data?.attributes?.url
    if (!checkoutUrl) {
      return Response.json({ error: 'No checkout URL returned.' }, { status: 500 })
    }

    return Response.json({ url: checkoutUrl })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
