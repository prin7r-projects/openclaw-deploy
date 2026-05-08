import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { fleets } from './routes/fleets.js';
import { reconciles } from './routes/reconciles.js';
import { webhooks } from './routes/webhooks.js';
import { checkout } from './routes/checkout.js';
import { nowpaymentsWebhook } from './routes/nowpayments-webhook.js';
import { auth } from './routes/auth.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) =>
  c.json({
    service: 'openclaw-deploy-api',
    status: 'ok',
    version: '0.2.0',
    endpoints: {
      healthz: '/healthz',
      auth: '/api/auth',
      fleets: '/api/v1/fleets',
      reconciles: '/api/v1/reconciles',
      webhooks: '/api/v1/webhooks',
      checkout: '/api/checkout',
    },
  }),
);

app.get('/healthz', (c) =>
  c.json({ status: 'ok', service: 'openclaw-deploy-api' }),
);

app.route('/api/auth', auth);
app.route('/api/v1/fleets', fleets);
app.route('/api/v1/reconciles', reconciles);
app.route('/api/v1/webhooks', webhooks);
app.route('/api/checkout', checkout);
app.route('/api/webhooks/nowpayments', nowpaymentsWebhook);

const port = Number(process.env.COLD_IRON_PORT ?? process.env.API_PORT ?? 8787);

console.log(`[Cold Iron] Control plane starting on :${port}`);

serve({
  fetch: app.fetch,
  port,
});
