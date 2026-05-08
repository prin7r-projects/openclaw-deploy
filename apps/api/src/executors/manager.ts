import { ExecutorDriver, PodInfo } from './types.js';
import { DockerExecutor, DockerConfig } from './docker.js';
import { IncusExecutor, IncusConfig } from './incus.js';

export type TargetKind = 'incus' | 'docker' | 'vps';

export interface TargetConfig {
  id: string;
  kind: TargetKind;
  hostUri: string;
  config?: Record<string, any>;
}

export class ExecutorManager {
  private drivers: Map<string, ExecutorDriver> = new Map();
  private targetDrivers: Map<string, string> = new Map(); // targetId -> driverKey

  constructor() {
    // Initialize default local Docker driver
    this.registerDriver('docker:local', new DockerExecutor());
  }

  registerDriver(key: string, driver: ExecutorDriver): void {
    this.drivers.set(key, driver);
  }

  async addTarget(target: TargetConfig): Promise<void> {
    const driverKey = `${target.kind}:${target.hostUri}`;
    
    if (!this.drivers.has(driverKey)) {
      const driver = this.createDriver(target.kind, target.hostUri, target.config);
      this.registerDriver(driverKey, driver);
    }
    
    this.targetDrivers.set(target.id, driverKey);
  }

  private createDriver(kind: TargetKind, hostUri: string, config?: Record<string, any>): ExecutorDriver {
    switch (kind) {
      case 'docker':
        return new DockerExecutor({
          host: hostUri.startsWith('tcp://') ? hostUri : undefined,
          socketPath: hostUri.startsWith('unix://') ? hostUri : '/var/run/docker.sock',
          ...config,
        });
      case 'incus':
        return new IncusExecutor({
          host: hostUri,
          ...config,
        });
      case 'vps':
        throw new Error('VPS driver not implemented yet — use Docker or Incus');
      default:
        throw new Error(`Unknown target kind: ${kind}`);
    }
  }

  getDriver(targetId: string): ExecutorDriver | null {
    const driverKey = this.targetDrivers.get(targetId);
    if (!driverKey) return null;
    return this.drivers.get(driverKey) ?? null;
  }

  async createPod(targetId: string, agentId: string, image: string, config?: Record<string, any>): Promise<PodInfo> {
    const driver = this.getDriver(targetId);
    if (!driver) throw new Error(`No driver found for target ${targetId}`);
    return driver.createPod(agentId, image, config);
  }

  async stopPod(targetId: string, containerId: string, force = false): Promise<void> {
    const driver = this.getDriver(targetId);
    if (!driver) throw new Error(`No driver found for target ${targetId}`);
    return driver.stopPod(containerId, force);
  }

  async deletePod(targetId: string, containerId: string): Promise<void> {
    const driver = this.getDriver(targetId);
    if (!driver) throw new Error(`No driver found for target ${targetId}`);
    return driver.deletePod(containerId);
  }

  async listPods(targetId: string): Promise<PodInfo[]> {
    const driver = this.getDriver(targetId);
    if (!driver) throw new Error(`No driver found for target ${targetId}`);
    return driver.listPods();
  }

  async checkTargetHealth(targetId: string): Promise<boolean> {
    const driver = this.getDriver(targetId);
    if (!driver) return false;
    return driver.checkHealth();
  }
}

// Singleton instance
export const executorManager = new ExecutorManager();
