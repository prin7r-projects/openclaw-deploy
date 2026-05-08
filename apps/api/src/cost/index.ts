import { db, schema } from '../db/index.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface CostEntry {
  agentId: string;
  fleetId: string;
  amountCents: number;
  source: 'llm_api' | 'runtime' | 'manual';
  metadata?: Record<string, any>;
}

export interface CostSummary {
  agentId: string;
  fleetId: string;
  dailyCents: number;
  monthlyCents: number;
  lastUpdated: Date;
}

// Cost table for tracking per-agent costs
const costEntries: Array<CostEntry & { id: string; timestamp: Date }> = [];

export class CostMeter {
  async recordCost(entry: CostEntry): Promise<void> {
    costEntries.push({
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    });

    // Check cost cap
    await this.checkCostCap(entry.fleetId, entry.agentId);
  }

  async getAgentCost(agentId: string, days = 1): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return costEntries
      .filter(e => e.agentId === agentId && e.timestamp >= since)
      .reduce((sum, e) => sum + e.amountCents, 0);
  }

  async getFleetCost(fleetId: string, days = 1): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return costEntries
      .filter(e => e.fleetId === fleetId && e.timestamp >= since)
      .reduce((sum, e) => sum + e.amountCents, 0);
  }

  async getCostSummary(fleetId: string): Promise<CostSummary[]> {
    const agents = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.fleetId, fleetId));

    const summaries: CostSummary[] = [];

    for (const agent of agents) {
      const dailyCents = await this.getAgentCost(agent.id, 1);
      const monthlyCents = await this.getAgentCost(agent.id, 30);

      summaries.push({
        agentId: agent.id,
        fleetId,
        dailyCents,
        monthlyCents,
        lastUpdated: new Date(),
      });
    }

    return summaries;
  }

  private async checkCostCap(fleetId: string, agentId: string): Promise<void> {
    const [agent] = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, agentId))
      .limit(1);

    if (!agent?.costCapDailyCents) return;

    const dailyCost = await this.getAgentCost(agentId, 1);
    
    if (dailyCost > agent.costCapDailyCents) {
      console.warn(`[Cost] Agent ${agentId} exceeded daily cost cap: ${dailyCost} > ${agent.costCapDailyCents}`);
      
      // Emit cost threshold event
      const [fleet] = await db
        .select()
        .from(schema.fleets)
        .where(eq(schema.fleets.id, fleetId))
        .limit(1);

      if (fleet) {
        const reconcileId = crypto.randomUUID();
        await db.insert(schema.reconciles).values({
          id: reconcileId,
          fleetId,
          yamlRevision: fleet.yamlRevision,
          status: 'finished',
          user: 'cost_meter',
        });

        await db.insert(schema.events).values({
          id: crypto.randomUUID(),
          reconcileId,
          type: 'cost_threshold',
          payload: {
            agentId,
            dailyCost,
            cap: agent.costCapDailyCents,
            action: 'scheduling_paused',
          },
        });
      }
    }
  }

  async canScheduleAgent(agentId: string): Promise<boolean> {
    const [agent] = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, agentId))
      .limit(1);

    if (!agent?.costCapDailyCents) return true;

    const dailyCost = await this.getAgentCost(agentId, 1);
    return dailyCost < agent.costCapDailyCents;
  }
}

// Singleton instance
export const costMeter = new CostMeter();
