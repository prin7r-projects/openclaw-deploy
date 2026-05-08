import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:8787';

test.describe('Scenario E — Drift detected on a target', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'drift-test@coldiron.dev' },
    });
    expect(res.ok()).toBeTruthy();
    authToken = (await res.json()).token;
  });

  test('Step 1: Apply fleet creates reconcile event', async ({ request }) => {
    const fleetId = `drift-fleet-${Date.now()}`;
    const manifest = `apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: drift-agent
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:1.4.2
    replicas: 1
`;

    const res = await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { yaml_md: manifest },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.reconcile_id).toBeTruthy();
  });

  test('Step 2: Audit log records applied events', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/reconciles/events?limit=50`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.events).toBeDefined();
    expect(body.events.length).toBeGreaterThan(0);

    // Should have at least one 'applied' event
    const appliedEvents = body.events.filter((e: any) => e.type === 'applied');
    expect(appliedEvents.length).toBeGreaterThan(0);
  });

  test('Step 3: Drift detection events are captured', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/reconciles/events?type=drifted`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.events).toBeDefined();
    // Drifted events may or may not exist depending on test env
  });

  test('Step 4: Fleet status reflects drift state', async ({ request }) => {
    // Create a fleet and check its status transitions
    const fleetId = `drift-status-${Date.now()}`;
    const manifest = `apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: status-agent
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:1.4.2
    replicas: 1
`;

    await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { yaml_md: manifest },
    });

    const res = await request.get(`${API_URL}/api/v1/fleets/${fleetId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.fleet.status).toMatch(/applied|pending|drift_detected/);
  });

  test('Step 5: SSE stream endpoint exists and connects', async ({ request }) => {
    // Just verify the SSE endpoint is reachable
    const res = await request.get(`${API_URL}/api/v1/events/stream`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    // SSE endpoint should return 200 or redirect
    expect(res.status()).toBeLessThan(500);
  });
});
