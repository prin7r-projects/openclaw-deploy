import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const webhooks = new Hono();

webhooks.use('/*', authMiddleware);

webhooks.post('/', async (c) => {
  const body = await c.req.json<{ url: string; events: string[]; secret: string }>();

  if (!body.url || !body.events || !body.secret) {
    return c.json({ error: 'url, events, and secret are required' }, 400);
  }

  const webhookId = crypto.randomUUID();

  return c.json({ webhook_id: webhookId });
});

export { webhooks };
