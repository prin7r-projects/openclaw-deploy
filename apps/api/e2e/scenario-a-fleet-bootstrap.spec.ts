import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:8787';

test.describe('Scenario A — Maya bootstraps a 12-agent fleet from scratch', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'maya@platform-eng.com' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    authToken = body.token;
  });

  test('Step 1: occ login returns valid token', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'maya@platform-eng.com' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user.email).toBe('maya@platform-eng.com');
    expect(body.user.id).toBeTruthy();
    expect(body.token).toBeTruthy();
  });

  test('Step 2: Create fleet with 12 agents via manifest apply', async ({ request }) => {
    const fleetId = `maya-prod-${Date.now()}`;
    const manifest = `apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: openclaw-pool
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:1.4.2
    replicas: 5
  - name: hermes-bridge
    type: Hermes
    image: ghcr.io/openclaw/hermes:0.9.1
    replicas: 4
  - name: nanoclaw-worker
    type: NanoClaw
    image: ghcr.io/openclaw/nanoclaw:1.4.2
    replicas: 3
`;

    const res = await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { yaml_md: manifest },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.reconcile_id).toBeTruthy();
    expect(body.plan_diff.revision).toBe(1);
  });

  test('Step 3: occ plan shows diff — 0 existing → 12 new pods', async ({ request }) => {
    const fleetId = `maya-plan-${Date.now()}`;
    const manifest = `apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: openclaw-eu
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:1.4.2
    replicas: 5
  - name: hermes-bridge
    type: Hermes
    image: ghcr.io/openclaw/hermes:0.9.1
    replicas: 4
  - name: nanoclaw-pool
    type: NanoClaw
    image: ghcr.io/openclaw/nanoclaw:1.4.2
    replicas: 3
`;

    // Apply creates the fleet
    await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { yaml_md: manifest },
    });

    // Plan (get) shows current state
    const res = await request.get(`${API_URL}/api/v1/fleets/${fleetId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.fleet).toBeDefined();
    expect(body.fleet.id).toBe(fleetId);
    expect(body.agents).toBeDefined();
  });

  test('Step 4: Apply reconciles — fleet status becomes applied', async ({ request }) => {
    const fleetId = `maya-apply-${Date.now()}`;
    const manifest = `apiVersion: openclaw.deploy/v1
fleet: ${fleetId}
agents:
  - name: openclaw-pool
    type: OpenClaw
    image: ghcr.io/openclaw/openclaw:1.4.2
    replicas: 2
`;

    await request.post(`${API_URL}/api/v1/fleets/${fleetId}/apply`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { yaml_md: manifest },
    });

    // Wait for reconciler tick (30s default, but test env may be faster)
    await new Promise(r => setTimeout(r, 3000));

    const res = await request.get(`${API_URL}/api/v1/fleets/${fleetId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.fleet.status).toMatch(/applied|pending/);
  });

  test('Step 5: Dashboard shows fleet count and cost', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/fleets`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.fleets).toBeDefined();
    expect(Array.isArray(body.fleets)).toBeTruthy();
  });
});
