import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { vault } from '../vault/index.js';
import { costMeter } from '../cost/index.js';

const secrets = new Hono();

secrets.use('/*', authMiddleware);

// List secrets for an agent
secrets.get('/agent/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  const agentSecrets = await db
    .select({
      id: schema.secrets.id,
      keyName: schema.secrets.keyName,
      status: schema.secrets.status,
      expiresAt: schema.secrets.expiresAt,
    })
    .from(schema.secrets)
    .where(eq(schema.secrets.agentId, agentId));

  return c.json({ secrets: agentSecrets });
});

// Get expiring secrets (T-24h detection)
secrets.get('/expiring', async (c) => {
  const hours = Number(c.req.query('hours') ?? '24');
  const expiring = await vault.getExpiringSecrets(hours);
  return c.json({ expiring });
});

// Rotate a secret
secrets.post('/:secretId/rotate', async (c) => {
  const secretId = c.req.param('secretId');
  const body = await c.req.json<{ new_value: string }>();

  if (!body.new_value) {
    return c.json({ error: 'new_value is required' }, 400);
  }

  await vault.rotateSecret(secretId, body.new_value);
  
  return c.json({ status: 'rotated', secretId });
});

// Get cost summary for a fleet
secrets.get('/cost/fleet/:fleetId', async (c) => {
  const fleetId = c.req.param('fleetId');
  const days = Number(c.req.query('days') ?? '1');
  
  const totalCost = await costMeter.getFleetCost(fleetId, days);
  const agentCosts = await costMeter.getCostSummary(fleetId);
  
  return c.json({
    fleetId,
    days,
    totalCents: totalCost,
    agents: agentCosts,
  });
});

// Check if agent can be scheduled (cost cap check)
secrets.get('/cost/agent/:agentId/can-schedule', async (c) => {
  const agentId = c.req.param('agentId');
  const canSchedule = await costMeter.canScheduleAgent(agentId);
  return c.json({ agentId, canSchedule });
});

export { secrets };
