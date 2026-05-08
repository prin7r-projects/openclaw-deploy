import { Hono } from 'hono';
import { metrics } from '../lib/metrics.js';

const metricsRoute = new Hono();

metricsRoute.get('/', async (c) => {
  const systemMetrics = await metrics.collectSystemMetrics();
  const allMetrics = [...(await metrics.collect()), ...systemMetrics];
  
  // Render in Prometheus text format
  const lines: string[] = [];
  
  // Add help text for key metrics
  lines.push('# HELP coldiron_reconcile_duration_s Last reconcile duration in seconds');
  lines.push('# TYPE coldiron_reconcile_duration_s gauge');
  
  lines.push('# HELP coldiron_pods_unhealthy Number of unhealthy pods');
  lines.push('# TYPE coldiron_pods_unhealthy gauge');
  
  lines.push('# HELP coldiron_target_unreachable_count Number of unreachable targets');
  lines.push('# TYPE coldiron_target_unreachable_count gauge');
  
  lines.push('# HELP coldiron_secret_rotation_lead_h Hours until next secret rotation');
  lines.push('# TYPE coldiron_secret_rotation_lead_h gauge');
  
  lines.push('# HELP coldiron_cost_daily_cents Daily cost in cents');
  lines.push('# TYPE coldiron_cost_daily_cents gauge');

  for (const point of allMetrics) {
    const labelStr = point.labels 
      ? `{${Object.entries(point.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
      : '';
    lines.push(`${point.name}${labelStr} ${point.value}`);
  }

  return c.text(lines.join('\n') + '\n', 200, {
    'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
  });
});

metricsRoute.get('/json', async (c) => {
  const systemMetrics = await metrics.collectSystemMetrics();
  const allMetrics = [...(await metrics.collect()), ...systemMetrics];
  return c.json({ metrics: allMetrics });
});

export { metricsRoute };
