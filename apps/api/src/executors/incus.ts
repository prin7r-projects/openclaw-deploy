import { ExecutorDriver, PodInfo } from './types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface IncusConfig {
  host?: string;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
}

export class IncusExecutor implements ExecutorDriver {
  readonly kind = 'incus' as const;
  private config: IncusConfig;

  constructor(config: IncusConfig = {}) {
    this.config = config;
  }

  private getIncusCmd(): string {
    let cmd = 'incus';
    if (this.config.host) {
      cmd += ` --remote ${this.config.host}`;
    }
    return cmd;
  }

  async createPod(agentId: string, image: string, config?: Record<string, any>): Promise<PodInfo> {
    const instanceName = `coldiron-${agentId}-${Date.now()}`;
    const cmd = `${this.getIncusCmd()} launch ${image} ${instanceName} --profile default`;
    
    try {
      await execAsync(cmd);
      
      return {
        id: agentId,
        containerId: instanceName,
        status: 'running',
        health: 'unknown',
        startedAt: new Date(),
      };
    } catch (err: any) {
      throw new Error(`Failed to create Incus instance: ${err.message}`);
    }
  }

  async startPod(containerId: string): Promise<void> {
    await execAsync(`${this.getIncusCmd()} start ${containerId}`);
  }

  async stopPod(containerId: string, force = false): Promise<void> {
    const flag = force ? '--force' : '';
    await execAsync(`${this.getIncusCmd()} stop ${containerId} ${flag}`);
  }

  async deletePod(containerId: string): Promise<void> {
    try {
      await execAsync(`${this.getIncusCmd()} delete ${containerId} --force`);
    } catch {
      // Instance may already be removed
    }
  }

  async listPods(): Promise<PodInfo[]> {
    try {
      const { stdout } = await execAsync(
        `${this.getIncusCmd()} list --format csv --columns ns`
      );

      if (!stdout.trim()) return [];

      return stdout.trim().split('\n').map(line => {
        const [name, status] = line.split(',');
        
        let podStatus: PodInfo['status'] = 'unknown';
        if (status === 'Running') podStatus = 'running';
        else if (status === 'Stopped') podStatus = 'stopped';
        else if (status === 'Error') podStatus = 'error';

        return {
          id: name,
          containerId: name,
          status: podStatus,
          health: 'unknown',
        };
      });
    } catch {
      return [];
    }
  }

  async getPod(containerId: string): Promise<PodInfo | null> {
    try {
      const { stdout } = await execAsync(
        `${this.getIncusCmd()} list ${containerId} --format csv --columns ns`
      );

      if (!stdout.trim()) return null;

      const [name, status] = stdout.trim().split(',');
      
      let podStatus: PodInfo['status'] = 'unknown';
      if (status === 'Running') podStatus = 'running';
      else if (status === 'Stopped') podStatus = 'stopped';
      else if (status === 'Error') podStatus = 'error';

      return {
        id: name,
        containerId: name,
        status: podStatus,
        health: 'unknown',
      };
    } catch {
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await execAsync(`${this.getIncusCmd()} version`);
      return true;
    } catch {
      return false;
    }
  }

  async pushConfig(containerId: string, config: Record<string, any>): Promise<void> {
    // Push files to the instance
    if (config.files) {
      for (const [path, content] of Object.entries(config.files)) {
        const tempFile = `/tmp/coldiron-${Date.now()}`;
        const { writeFile, unlink } = await import('fs/promises');
        await writeFile(tempFile, content as string);
        try {
          await execAsync(`${this.getIncusCmd()} file push ${tempFile} ${containerId}${path}`);
        } finally {
          await unlink(tempFile).catch(() => {});
        }
      }
    }

    // Execute commands in the instance
    if (config.command) {
      await execAsync(`${this.getIncusCmd()} exec ${containerId} -- ${config.command}`);
    }
  }
}
