import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const auth = new Hono();

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email: string }>();

  if (!body.email) {
    return c.json({ error: 'email is required' }, 400);
  }

  let [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, body.email))
    .limit(1);

  if (!user) {
    const userId = nanoid();
    await db.insert(schema.users).values({
      id: userId,
      email: body.email,
    });
    user = { id: userId, email: body.email, plan: 'self_hosted' as const, createdAt: new Date() };
  }

  const token = nanoid(48);
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  await db.insert(schema.apiTokens).values({
    id: nanoid(),
    userId: user.id,
    tokenHash,
    name: 'CLI login',
  });

  return c.json({
    user: { id: user.id, email: user.email, plan: user.plan },
    token,
  });
});

auth.post('/tokens', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{ name: string }>();
  const token = nanoid(48);
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const existingToken = authHeader.slice(7);
  const existingData = encoder.encode(existingToken);
  const existingHash = await crypto.subtle.digest('SHA-256', existingData);
  const existingHashStr = Array.from(new Uint8Array(existingHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const [parentToken] = await db
    .select()
    .from(schema.apiTokens)
    .where(eq(schema.apiTokens.tokenHash, existingHashStr))
    .limit(1);

  if (!parentToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await db.insert(schema.apiTokens).values({
    id: nanoid(),
    userId: parentToken.userId,
    tokenHash,
    name: body.name ?? 'CLI token',
  });

  return c.json({ token, name: body.name ?? 'CLI token' });
});

export { auth };
