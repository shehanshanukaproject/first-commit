const BASE_URL = process.env.PAYPAL_MODE?.trim() === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export function getPayPalBaseUrl() {
  return BASE_URL
}

export async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!clientId || !secret) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env.local')
  }
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`PayPal auth failed: ${data.error_description || JSON.stringify(data)}`)
  return data.access_token
}

export async function getOrCreatePlanId(accessToken) {
  if (process.env.PAYPAL_PLAN_ID) return process.env.PAYPAL_PLAN_ID

  // Create product
  const productRes = await fetch(`${BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `lectureai-product-v1`,
    },
    body: JSON.stringify({
      name: 'LectureAI Pro',
      description: 'Unlimited lectures, AI chat, PDF export, and priority processing.',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  })
  const product = await productRes.json()
  if (!product.id) throw new Error(`Failed to create PayPal product: ${JSON.stringify(product)}`)

  // Create billing plan
  const planRes = await fetch(`${BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `lectureai-plan-v1`,
    },
    body: JSON.stringify({
      product_id: product.id,
      name: 'LectureAI Pro Monthly',
      description: 'Monthly Pro subscription — $6/month',
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: '6', currency_code: 'USD' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: '0', currency_code: 'USD' },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  })
  const plan = await planRes.json()
  if (!plan.id) throw new Error(`Failed to create PayPal plan: ${JSON.stringify(plan)}`)

  console.log(`✅ PayPal plan created: ${plan.id}`)
  console.log(`   → Add PAYPAL_PLAN_ID=${plan.id} to .env.local to reuse it`)
  return plan.id
}
