import { Hono } from 'hono';

const checkout = new Hono();

const PLAN_PRICES: Record<string, { amount: number; currency: string }> = {
  'cloud_team': { amount: 49, currency: 'USD' },
  'cloud_org': { amount: 199, currency: 'USD' },
  'cloud_enterprise': { amount: 499, currency: 'USD' },
};

checkout.post('/nowpayments', async (c) => {
  const body = await c.req.json<{ plan: string }>();

  if (!body.plan || !PLAN_PRICES[body.plan]) {
    return c.json({ error: 'Invalid plan. Must be: cloud_team, cloud_org, cloud_enterprise' }, 400);
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'NOWPayments not configured' }, 500);
  }

  const plan = PLAN_PRICES[body.plan];

  try {
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: plan.amount,
        price_currency: plan.currency,
        order_id: `${body.plan}_${Date.now()}`,
        order_description: `OpenClaw Deploy - ${body.plan}`,
        success_url: process.env.NOWPAYMENTS_SUCCESS_URL ?? 'https://openclaw-deploy.prin7r.com/success',
        cancel_url: process.env.NOWPAYMENTS_CANCEL_URL ?? 'https://openclaw-deploy.prin7r.com/pricing',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: 'Failed to create invoice', details: error }, 502);
    }

    const invoice = await response.json();
    return c.json({ invoice_url: invoice.invoice_url });
  } catch (err) {
    return c.json({ error: 'NOWPayments request failed' }, 502);
  }
});

export { checkout };
