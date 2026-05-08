import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { executorManager, TargetConfig } from '../executors/manager.js';
import { nanoid } from 'nanoid';
import { parse as parseYaml } from 'yaml';

interface FleetManifest {
  apiVersion?: string;
  fleet?: string;
  agents?: Array<{
    name: string;
    type?: string;
    image: string;
    target?: string;
    replicas?: number;
    auth?: Record<string, any>;
  }>;
}

export class Reconciler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number;

  constructor(intervalMs = 30000) {
    this.intervalMs = intervalMs;
  }

  start(): void {
    console.log(`[Reconciler] Starting with ${this.intervalMs / 1000}s interval`);
    this.intervalId = setInterval(() => this.tick().catch(console.error), this.intervalMs);
    // Run immediately on start
    this.tick().catch(console.error);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async tick(): Promise<void> {
    const fleets = await db.select().from(schema.fleets).where(eq(schema.fleets.status, 'pending'));

    for (const fleet of fleets) {
      await this.reconcileFleet(fleet.id).catch(err => {
        console.error(`[Reconciler] Error reconciling fleet ${fleet.id}:`, err);
      });
    }
  }

  async reconcileFleet(fleetId: string): Promise<void> {
    console.log(`[Reconciler] Reconciling fleet ${fleetId}`);

    const [fleet] = await db
      .select()
      .from(schema.fleets)
      .where(eq(schema.fleets.id, fleetId))
      .limit(1);

    if (!fleet || !fleet.yamlMd) {
      return;
    }

    const manifest = parseYaml(fleet.yamlMd) as FleetManifest;
    
    const reconcileId = nanoid();
    await db.insert(schema.reconciles).values({
      id: reconcileId,
      fleetId,
      yamlRevision: fleet.yamlRevision,
      status: 'running',
      user: 'reconciler',
    });

    try {
      // Get existing agents for this fleet
      const existingAgents = await db
        .select()
        .from(schema.agents)
        .where(eq(schema.agents.fleetId, fleetId));

      // Get existing targets for this fleet
      const existingTargets = await db
        .select()
        .from(schema.targets)
        .where(eq(schema.targets.fleetId, fleetId));

      // Ensure targets exist
      for (const target of existingTargets) {
        await executorManager.addTarget({
          id: target.id,
          kind: target.kind as 'incus' | 'docker' | 'vps',
          hostUri: target.hostUri,
        });
      }

      // Process each agent in the manifest
      for (const agentSpec of manifest.agents ?? []) {
        let agent = existingAgents.find(a => a.name === agentSpec.name);

        if (!agent) {
          // Create agent record
          const agentId = nanoid();
          await db.insert(schema.agents).values({
            id: agentId,
            fleetId,
            name: agentSpec.name,
            image: agentSpec.image,
            minReplicas: agentSpec.replicas ?? 1,
            maxReplicas: agentSpec.replicas ?? 1,
          });
          agent = (await db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).limit(1))[0];
          
          await db.insert(schema.events).values({
            id: nanoid(),
            reconcileId,
            type: 'applied',
            payload: { action: 'agent_created', agent: agentSpec.name },
          });
        }

        if (!agent) continue;

        // Check pods for this agent
        const pods = await db
          .select()
          .from(schema.pods)
          .where(eq(schema.pods.agentId, agent.id));

        const desiredReplicas = agentSpec.replicas ?? 1;
        const runningPods = pods.filter(p => p.health === 'green' || p.health === 'unknown');

        if (runningPods.length < desiredReplicas) {
          // Need to create more pods
          const target = existingTargets[0]; // Simple: use first available target
          if (target) {
            for (let i = runningPods.length; i < desiredReplicas; i++) {
              try {
                const pod = await executorManager.createPod(target.id, agent.id, agentSpec.image);
                
                await db.insert(schema.pods).values({
                  id: nanoid(),
                  agentId: agent.id,
                  targetId: target.id,
                  health: 'unknown',
                  containerId: pod.containerId,
                  startedAt: new Date(),
                });

                await db.insert(schema.events).values({
                  id: nanoid(),
                  reconcileId,
                  type: 'applied',
                  payload: { action: 'pod_created', agent: agentSpec.name, container: pod.containerId },
                });
              } catch (err: any) {
                await db.insert(schema.events).values({
                  id: nanoid(),
                  reconcileId,
                  type: 'drifted',
                  payload: { action: 'pod_creation_failed', agent: agentSpec.name, error: err.message },
                });
              }
            }
          }
        } else if (runningPods.length > desiredReplicas) {
          // Need to remove excess pods
          const excessPods = runningPods.slice(desiredReplicas);
          for (const pod of excessPods) {
            try {
              if (pod.targetId && pod.containerId) {
                await executorManager.stopPod(pod.targetId, pod.containerId, true);
                await executorManager.deletePod(pod.targetId, pod.containerId);
              }
              
              await db.delete(schema.pods).where(eq(schema.pods.id, pod.id));

              await db.insert(schema.events).values({
                id: nanoid(),
                reconcileId,
                type: 'applied',
                payload: { action: 'pod_removed', agent: agentSpec.name, container: pod.containerId },
              });
            } catch (err: any) {
              await db.insert(schema.events).values({
                id: nanoid(),
                reconcileId,
                type: 'drifted',
                payload: { action: 'pod_removal_failed', agent: agentSpec.name, error: err.message },
              });
            }
          }
        }
      }

      // Update fleet status
      await db
        .update(schema.fleets)
        .set({
          status: 'applied',
          appliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.fleets.id, fleetId));

      // Mark reconcile as finished
      await db
        .update(schema.reconciles)
        .set({
          status: 'finished',
          finishedAt: new Date(),
        })
        .where(eq(schema.reconciles.id, reconcileId));

      console.log(`[Reconciler] Fleet ${fleetId} reconciled successfully`);
    } catch (err: any) {
      // Mark reconcile as failed
      await db
        .update(schema.reconciles)
        .set({
          status: 'failed',
          finishedAt: new Date(),
        })
        .where(eq(schema.reconciles.id, reconcileId));

      throw err;
    }
  }
}

// Singleton instance
export const reconciler = new Reconciler();
