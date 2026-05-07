/**
 * OpenClaw Deploy — control plane API (Wave 2 stub).
 *
 * For Wave 2 batch 1, this app is intentionally a "hello" endpoint stub.
 * The full reconciler, manifest validation, and driver layer described in
 * /docs/02-architecture.md ship in a later wave.
 */
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) =>
  c.json({
    service: 'openclaw-deploy-api',
    status: 'ok',
    version: '0.1.0',
    note: 'Wave 2 stub — full control plane in a later wave.',
    repo: 'https://github.com/prin7r-projects/openclaw-deploy',
  }),
);

app.get('/healthz', (c) =>
  c.json({ status: 'ok', service: 'openclaw-deploy-api' }),
);

const port = Number(process.env.PORT ?? 8787);

export default {
  port,
  fetch: app.fetch,
};
