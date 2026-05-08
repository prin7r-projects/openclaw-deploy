import { ExecutorDriver, PodInfo } from './types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DockerConfig {
  socketPath?: string;
  host?: string;
  tlsCert?: string;
  tlsKey?: string;
  tlsCa?: string;
}

export class DockerExecutor implements ExecutorDriver {
  readonly kind = 'docker' as const;
  private config: DockerConfig;

  constructor(config: DockerConfig = {}) {
    this.config = {
      socketPath: config.socketPath ?? process.env.DOCKER_SOCK_PATH ?? '/var/run/docker.sock',
      ...config,
    };
  }

  private getDockerCmd(): string {
    if (this.config.host) {
      let cmd = `docker -H ${this.config.host}`;
      if (this.config.tlsCert && this.config.tlsKey && this.config.tlsCa) {
        cmd += ` --tlsverify --tlscacert=${this.config.tlsCa} --tlscert=${this.config.tlsCert} --tlskey=${this.config.tlsKey}`;
      }
      return cmd;
    }
    return `docker -H unix://${this.config.socketPath}`;
  }

  async createPod(agentId: string, image: string, config?: Record<string, any>): Promise<PodInfo> {
    const containerName = `coldiron-${agentId}-${Date.now()}`;
    const labels = [
      `--label coldiron.agent-id=${agentId}`,
      `--label coldiron.managed=true`,
      `--label coldiron.created-at=${new Date().toISOString()}`,
    ].join(' ');

    const envVars = config?.env
      ? Object.entries(config.env).map(([k, v]) => `-e ${k}=${v}`).join(' ')
      : '';

    const cmd = `${this.getDockerCmd()} run -d --name ${containerName} ${labels} ${envVars} ${image}`;
    
    try {
      const { stdout } = await execAsync(cmd);
      const containerId = stdout.trim();
      
      return {
        id: agentId,
        containerId,
        status: 'running',
        health: 'unknown',
        startedAt: new Date(),
      };
    } catch (err: any) {
      throw new Error(`Failed to create pod: ${err.message}`);
    }
  }

  async startPod(containerId: string): Promise<void> {
    await execAsync(`${this.getDockerCmd()} start ${containerId}`);
  }

  async stopPod(containerId: string, force = false): Promise<void> {
    const flag = force ? '-f' : '';
    await execAsync(`${this.getDockerCmd()} stop ${flag} ${containerId}`);
  }

  async deletePod(containerId: string): Promise<void> {
    try {
      await execAsync(`${this.getDockerCmd()} rm -f ${containerId}`);
    } catch {
      // Container may already be removed
    }
  }

  async listPods(): Promise<PodInfo[]> {
    try {
      const { stdout } = await execAsync(
        `${this.getDockerCmd()} ps -a --filter label=coldiron.managed=true --format '{{.ID}}|{{.Names}}|{{.Status}}|{{.Label "coldiron.agent-id"}}'`
      );

      if (!stdout.trim()) return [];

      return stdout.trim().split('\n').map(line => {
        const [containerId, name, status, agentId] = line.split('|');
        
        let podStatus: PodInfo['status'] = 'unknown';
        if (status.startsWith('Up')) podStatus = 'running';
        else if (status.startsWith('Exited')) podStatus = 'stopped';
        
        return {
          id: agentId || name,
          containerId,
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
        `${this.getDockerCmd()} inspect --format '{{.State.Status}}|{{.State.StartedAt}}|{{.Config.Labels.coldiron.agent-id}}' ${containerId}`
      );

      const [state, startedAt, agentId] = stdout.trim().split('|');
      
      let status: PodInfo['status'] = 'unknown';
      if (state === 'running') status = 'running';
      else if (state === 'exited' || state === 'dead') status = 'stopped';
      else if (state === 'created') status = 'stopped';

      return {
        id: agentId || containerId,
        containerId,
        status,
        health: 'unknown',
        startedAt: startedAt ? new Date(startedAt) : undefined,
      };
    } catch {
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await execAsync(`${this.getDockerCmd()} info --format '{{.ServerVersion}}'`);
      return true;
    } catch {
      return false;
    }
  }

  async pushConfig(containerId: string, config: Record<string, any>): Promise<void> {
    // For Docker, we can use exec to run commands in the container
    if (config.command) {
      await execAsync(`${this.getDockerCmd()} exec ${containerId} ${config.command}`);
    }
  }
}
