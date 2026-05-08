import { db, schema } from '../db/index.js';
import { eq, sql } from 'drizzle-orm';

export interface MetricPoint {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  incCounter(name: string, labels?: Record<string, string>, value = 1): void {
    const key = this.makeKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.makeKey(name, labels);
    this.gauges.set(key, value);
  }

  private makeKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels).sort().map(([k, v]) => `${k}="${v}"`).join(',');
    return `${name}{${labelStr}}`;
  }

  async collect(): Promise<MetricPoint[]> {
    const points: MetricPoint[] = [];
    const now = Date.now();

    for (const [key, value] of this.counters) {
      points.push({ name: key, value, timestamp: now });
    }
    for (const [key, value] of this.gauges) {
      points.push({ name: key, value, timestamp: now });
    }

    return points;
  }

  async collectSystemMetrics(): Promise<MetricPoint[]> {
    const points: MetricPoint[] = [];
    const now = Date.now();

    try {
      // Reconcile duration (last reconcile)
      const [lastReconcile] = await db
        .select()
        .from(schema.reconciles)
        .where(eq(schema.reconciles.status, 'finished'))
        .orderBy(sql`${schema.reconciles.finishedAt} DESC`)
        .limit(1);

      if (lastReconcile?.startedAt && lastReconcile?.finishedAt) {
        const duration = (new Date(lastReconcile.finishedAt).getTime() - new Date(lastReconcile.startedAt).getTime()) / 1000;
        points.push({ name: 'coldiron.reconcile.duration_s', value: duration, timestamp: now });
      }

      // Unhealthy pods count
      const unhealthyPods = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.pods)
        .where(eq(schema.pods.health, 'red'));
      points.push({ name: 'coldiron.pods.unhealthy', value: unhealthyPods[0]?.count ?? 0, timestamp: now });

      // Unreachable targets count
      const unreachableTargets = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.targets)
        .where(eq(schema.targets.status, 'unreachable'));
      points.push({ name: 'coldiron.target.unreachable_count', value: unreachableTargets[0]?.count ?? 0, timestamp: now });

      // Expiring secrets (T-24h)
      const threshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expiringSecrets = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.secrets)
        .where(eq(schema.secrets.status, 'active'));
      points.push({ name: 'coldiron.secret.rotation_lead_h', value: 24, timestamp: now });

    } catch (err) {
      console.error('[Metrics] Error collecting system metrics:', err);
    }

    return points;
  }

  renderPrometheus(): string {
    const lines: string[] = [];
    
    for (const [key, value] of this.counters) {
      lines.push(`# TYPE ${key.split('{')[0]} counter`);
      lines.push(`${key} ${value}`);
    }
    for (const [key, value] of this.gauges) {
      lines.push(`# TYPE ${key.split('{')[0]} gauge`);
      lines.push(`${key} ${value}`);
    }

    return lines.join('\n');
  }
}

export const metrics = new MetricsCollector();

export function setupLogger() {
  const level = process.env.LOG_LEVEL ?? 'info';
  
  return {
    level,
    transport: {
      target: 'pino/file',
      options: { destination: 1 },
    },
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  };
}
