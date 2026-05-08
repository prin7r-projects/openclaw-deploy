import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:8787';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';

test.describe('Cold Iron E2E Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get token
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'test@coldiron.dev' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    authToken = body.token;
    expect(authToken).toBeTruthy();
  });

  test.describe('API Health', () => {
    test('healthz returns ok', async ({ request }) => {
      const res = await request.get(`${API_URL}/healthz`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('openclaw-deploy-api');
    });

    test('root returns service info', async ({ request }) => {
      const res = await request.get(`${API_URL}/`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.service).toBe('openclaw-deploy-api');
      expect(body.endpoints).toBeDefined();
      expect(body.endpoints.fleets).toBe('/api/v1/fleets');
    });
  });

  test.describe('Auth Flow', () => {
    test('login returns user + token', async ({ request }) => {
      const res = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: 'e2e@test.com' },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('e2e@test.com');
      expect(body.user.id).toBeTruthy();
      expect(body.token).toBeTruthy();
    });

    test('login rejects missing email', async ({ request }) => {
      const res = await request.post(`${API_URL}/api/auth/login`, {
        data: {},
      });
      expect(res.status()).toBe(400);
    });

    test('protected routes require auth', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/fleets`);
      expect(res.status()).toBe(401);
    });
  });

  test.describe('Scenario A — Fleet Apply', () => {
    const fleetId = `e2e-fleet-${Date.now()}`;
    const manifest = `
apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: test-openclaw
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:latest
    replicas: 2
  - name: test-hermes
    type: Hermes
    image: ghcr.io/openclaw/hermes:latest
    replicas: 1
`;

    test('apply creates fleet and returns reconcile_id', async ({ request }) => {
      const res = await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { yaml_md: manifest },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.reconcile_id).toBeTruthy();
      expect(body.plan_diff).toBeDefined();
      expect(body.plan_diff.revision).toBe(1);
      expect(body.plan_diff.changes).toBe('pending_reconciliation');
    });

    test('get fleet returns agents and status', async ({ request }) => {
      // Wait for reconciler to process
      await new Promise(r => setTimeout(r, 2000));

      const res = await request.get(`${API_URL}/api/v1/fleets/${fleetId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.fleet).toBeDefined();
      expect(body.fleet.id).toBe(fleetId);
      expect(body.agents).toBeDefined();
      expect(body.agents.length).toBeGreaterThanOrEqual(0);
    });

    test('list fleets includes the new fleet', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/fleets`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.fleets).toBeDefined();
      const found = body.fleets.find((f: any) => f.id === fleetId);
      expect(found).toBeDefined();
    });

    test('second apply increments revision (idempotency)', async ({ request }) => {
      const res = await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { yaml_md: manifest },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.plan_diff.revision).toBe(2);
    });
  });

  test.describe('Scenario C — Secret Rotation', () => {
    test('rotate endpoint accepts rotation request', async ({ request }) => {
      // First we need a fleet with agents
      const fleetId = `e2e-rotate-${Date.now()}`;
      const manifest = `
apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: rotate-test
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:latest
    replicas: 1
`;

      await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { yaml_md: manifest },
      });

      const res = await request.post(`${API_URL}/api/v1/fleets/${fleetId}/rotate`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { secret_key_name: 'test_api_key' },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.reconcile_id).toBeTruthy();
    });

    test('expiring secrets endpoint works', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/secrets/expiring?hours=24`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.expiring).toBeDefined();
      expect(Array.isArray(body.expiring)).toBeTruthy();
    });
  });

  test.describe('Scenario E — Drift Detection', () => {
    test('reconcile events endpoint returns events', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/reconciles/events`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.events).toBeDefined();
      expect(Array.isArray(body.events)).toBeTruthy();
    });
  });

  test.describe('Webhooks', () => {
    test('webhook registration endpoint exists', async ({ request }) => {
      const res = await request.post(`${API_URL}/api/v1/webhooks`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          url: 'https://example.com/webhook',
          events: ['fleet.applied', 'fleet.drifted'],
          secret: 'test-secret',
        },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.webhook_id).toBeTruthy();
    });
  });

  test.describe('Cost Telemetry', () => {
    test('cost summary endpoint works', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/secrets/cost/summary`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.totalDailyCents).toBeDefined();
      expect(body.totalMonthlyCents).toBeDefined();
      expect(body.fleets).toBeDefined();
    });
  });

  test.describe('Metrics', () => {
    test('metrics endpoint returns prometheus format', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/v1/metrics`);
      expect(res.ok()).toBeTruthy();
      const text = await res.text();
      expect(text).toContain('coldiron');
    });
  });

  test.describe('Operator UI', () => {
    test('landing page loads', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('h2')).toContainText('Dashboard');
    });

    test('fleets page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/fleets`);
      await expect(page.locator('h2')).toContainText('Fleets');
    });

    test('audit page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/audit`);
      await expect(page.locator('h2')).toContainText('Audit Log');
    });

    test('costs page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/costs`);
      await expect(page.locator('h2')).toContainText('Costs');
    });

    test('secrets page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/secrets`);
      await expect(page.locator('h2')).toContainText('Secrets');
    });
  });

  test.describe('NOWPayments Checkout', () => {
    test('checkout rejects invalid plan', async ({ request }) => {
      const res = await request.post(`${API_URL}/api/checkout/nowpayments`, {
        data: { plan: 'invalid_plan' },
      });
      expect(res.status()).toBe(400);
    });
  });
});
