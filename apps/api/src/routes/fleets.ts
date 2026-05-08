import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../middleware/auth.js';

const fleets = new Hono();

fleets.use('/*', authMiddleware);

fleets.get('/:id', async (c) => {
  const fleetId = c.req.param('id');
  const userId = c.get('userId');

  const [fleet] = await db
    .select()
    .from(schema.fleets)
    .where(and(eq(schema.fleets.id, fleetId), eq(schema.fleets.userId, userId)))
    .limit(1);

  if (!fleet) {
    return c.json({ error: 'Fleet not found' }, 404);
  }

  const fleetAgents = await db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.fleetId, fleetId));

  const fleetTargets = await db
    .select()
    .from(schema.targets)
    .where(eq(schema.targets.fleetId, fleetId));

  const agentIds = fleetAgents.map(a => a.id);
  const fleetPods = agentIds.length > 0
    ? await db.select().from(schema.pods).where(
        eq(schema.pods.agentId, agentIds[0])
      )
    : [];

  return c.json({
    fleet,
    agents: fleetAgents,
    pods: fleetPods,
    targets: fleetTargets,
  });
});

fleets.post('/:id/apply', async (c) => {
  const fleetId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json<{ yaml_md: string }>();

  if (!body.yaml_md) {
    return c.json({ error: 'yaml_md is required' }, 400);
  }

  let [fleet] = await db
    .select()
    .from(schema.fleets)
    .where(and(eq(schema.fleets.id, fleetId), eq(schema.fleets.userId, userId)))
    .limit(1);

  const newRevision = (fleet?.yamlRevision ?? 0) + 1;

  if (!fleet) {
    await db.insert(schema.fleets).values({
      id: fleetId,
      name: `fleet-${fleetId.slice(0, 8)}`,
      userId,
      yamlMd: body.yaml_md,
      yamlRevision: newRevision,
      status: 'pending',
    });
  } else {
    await db
      .update(schema.fleets)
      .set({
        yamlMd: body.yaml_md,
        yamlRevision: newRevision,
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(schema.fleets.id, fleetId));
  }

  const reconcileId = nanoid();
  await db.insert(schema.reconciles).values({
    id: reconcileId,
    fleetId,
    yamlRevision: newRevision,
    status: 'running',
    user: 'occ apply',
  });

  await db.insert(schema.events).values({
    id: nanoid(),
    reconcileId,
    type: 'applied',
    payload: { fleetId, yamlRevision: newRevision },
  });

  return c.json({
    reconcile_id: reconcileId,
    plan_diff: {
      revision: newRevision,
      changes: 'pending_reconciliation',
    },
  });
});

fleets.post('/:id/rotate', async (c) => {
  const fleetId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json<{ agent_id?: string; secret_key_name: string }>();

  if (!body.secret_key_name) {
    return c.json({ error: 'secret_key_name is required' }, 400);
  }

  const [fleet] = await db
    .select()
    .from(schema.fleets)
    .where(and(eq(schema.fleets.id, fleetId), eq(schema.fleets.userId, userId)))
    .limit(1);

  if (!fleet) {
    return c.json({ error: 'Fleet not found' }, 404);
  }

  const reconcileId = nanoid();
  await db.insert(schema.reconciles).values({
    id: reconcileId,
    fleetId,
    yamlRevision: fleet.yamlRevision,
    status: 'running',
    user: 'occ rotate',
  });

  await db.insert(schema.events).values({
    id: nanoid(),
    reconcileId,
    type: 'secret_rotated',
    payload: { agentId: body.agent_id, secretKeyName: body.secret_key_name },
  });

  return c.json({ reconcile_id: reconcileId });
});

export { fleets };
