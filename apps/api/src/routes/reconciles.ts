import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const reconciles = new Hono();

reconciles.use('/*', authMiddleware);

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
