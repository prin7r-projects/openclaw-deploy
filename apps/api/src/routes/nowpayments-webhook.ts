import { Hono } from 'hono';

const nowpaymentsWebhook = new Hono();

nowpaymentsWebhook.post('/', async (c) => {
  const sig = c.req.header('x-nowpayments-sig');
  if (!sig) {
    return c.json({ error: 'Missing signature' }, 401);
  }

  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    return c.json({ error: 'Webhook not configured' }, 500);
  }

  const body = await c.req.text();
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ipnSecret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );
    
    const computedSig = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSig !== sig) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const payment = JSON.parse(body);
    
    console.log('[NOWPayments IPN]', {
      payment_id: payment.payment_id,
      payment_status: payment.payment_status,
      order_id: payment.order_id,
    });

    return c.json({ ok: true });
  } catch (err) {
    console.error('[NOWPayments IPN] Verification failed:', err);
    return c.json({ error: 'Verification failed' }, 400);
  }
});

export { nowpaymentsWebhook };
