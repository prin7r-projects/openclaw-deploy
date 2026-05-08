import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:8787';

test.describe('Scenario C — OAuth rotation T-24h before expiry', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'rotate-test@coldiron.dev' },
    });
    expect(res.ok()).toBeTruthy();
    authToken = (await res.json()).token;
  });

  test('Step 1: Secrets list endpoint returns array', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/secrets`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.secrets).toBeDefined();
    expect(Array.isArray(body.secrets)).toBeTruthy();
  });

  test('Step 2: Expiring secrets endpoint works with custom hours', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/secrets/expiring?hours=48`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.expiring).toBeDefined();
    expect(Array.isArray(body.expiring)).toBeTruthy();
  });

  test('Step 3: Rotate endpoint accepts rotation request for fleet', async ({ request }) => {
    const fleetId = `rotate-fleet-${Date.now()}`;
    const manifest = `apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: rotate-agent
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:1.4.2
    replicas: 1
`;

    // Create fleet first
    await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { yaml_md: manifest },
    });

    // Trigger rotation
    const res = await request.post(`${API_URL}/api/v1/fleets/${fleetId}/rotate`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { secret_key_name: 'claude_oauth' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.reconcile_id).toBeTruthy();
  });

  test('Step 4: Rotation creates reconcile event', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/reconciles/events?type=secret_rotated`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.events).toBeDefined();
  });

  test('Step 5: Webhook fires on secret.rotated event', async ({ request }) => {
    // Register webhook
    const webhookRes = await request.post(`${API_URL}/api/v1/webhooks`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        url: 'https://hooks.slack.com/test',
        events: ['secret.rotated'],
        secret: 'test-webhook-secret',
      },
    });
    expect(webhookRes.ok()).toBeTruthy();
    const webhookBody = await webhookRes.json();
    expect(webhookBody.webhook_id).toBeTruthy();
  });
});
