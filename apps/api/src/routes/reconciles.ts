import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const reconciles = new Hono();

reconciles.use('/*', authMiddleware);

// List all events (audit log)
reconciles.get('/events', async (c) => {
  const limit = Number(c.req.query('limit') ?? '100');
  const offset = Number(c.req.query('offset') ?? '0');

  const events = await db
    .select({
      id: schema.events.id,
      reconcileId: schema.events.reconcileId,
      type: schema.events.type,
      payload: schema.events.payload,
      at: schema.events.at,
    })
    .from(schema.events)
    .orderBy(desc(schema.events.at))
    .limit(limit)
    .offset(offset);

  return c.json({ events });
});

reconciles.get('/:id', async (c) => {
  const reconcileId = c.req.param('id');

  const [reconcile] = await db
    .select()
    .from(schema.reconciles)
    .where(eq(schema.reconciles.id, reconcileId))
    .limit(1);

  if (!reconcile) {
    return c.json({ error: 'Reconcile not found' }, 404);
  }

  const reconcileEvents = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.reconcileId, reconcileId));

  return c.json({
    status: reconcile.status,
    events: reconcileEvents,
  });
});

export { reconciles };
