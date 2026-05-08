import { ExecutorDriver, PodInfo } from './types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'ssh2';

const execAsync = promisify(exec);

export interface VPSConfig {
  host: string;
  port?: number;
  username?: string;
  privateKeyPath?: string;
  password?: string;
}

export class VPSExecutor implements ExecutorDriver {
  readonly kind = 'vps' as const;
  private config: VPSConfig;
  private sshClient: Client | null = null;
  private bootstrapped = false;

  constructor(config: VPSConfig) {
    this.config = {
      port: config.port ?? 22,
      username: config.username ?? 'root',
      ...config,
    };
  }

  private async connect(): Promise<Client> {
    if (this.sshClient) return this.sshClient;

    return new Promise((resolve, reject) => {
      const client = new Client();
      
      client.on('ready', () => {
        this.sshClient = client;
        resolve(client);
      });

      client.on('error', reject);

      const connectConfig: any = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
      };

      if (this.config.privateKeyPath) {
        const { readFileSync } = require('fs');
        connectConfig.privateKey = readFileSync(this.config.privateKeyPath);
      } else if (this.config.password) {
        connectConfig.password = this.config.password;
      }

      client.connect(connectConfig);
    });
  }

  private async execCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    const client = await this.connect();
    
    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) return reject(err);

        let stdout = '';
        let stderr = '';

        stream.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`Command failed with code ${code}: ${stderr}`));
          } else {
            resolve({ stdout, stderr });
          }
        });

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      });
    });
  }

  private async bootstrap(): Promise<void> {
    if (this.bootstrapped) return;

    console.log(`[VPS] Bootstrapping ${this.config.host}...`);

    // Install Docker if not present
    const cloudInit = `
#!/bin/bash
set -e

# Update system
apt-get update -qq

# Install Docker
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

# Ensure Docker is running
systemctl enable docker
systemctl start docker

echo "Bootstrap complete"
`;

    try {
      await this.execCommand(`bash -c '${cloudInit}'`);
      this.bootstrapped = true;
      console.log(`[VPS] Bootstrap complete for ${this.config.host}`);
    } catch (err: any) {
      throw new Error(`Bootstrap failed: ${err.message}`);
    }
  }

  async createPod(agentId: string, image: string, config?: Record<string, any>): Promise<PodInfo> {
    await this.bootstrap();

    const containerName = `coldiron-${agentId}-${Date.now()}`;
    const labels = [
      `--label coldiron.agent-id=${agentId}`,
      `--label coldiron.managed=true`,
    ].join(' ');

    const envVars = config?.env
      ? Object.entries(config.env).map(([k, v]) => `-e ${k}=${v}`).join(' ')
      : '';

    const cmd = `docker run -d --name ${containerName} ${labels} ${envVars} ${image}`;
    
    try {
      const { stdout } = await this.execCommand(cmd);
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
    await this.bootstrap();
    await this.execCommand(`docker start ${containerId}`);
  }

  async stopPod(containerId: string, force = false): Promise<void> {
    await this.bootstrap();
    const flag = force ? '-f' : '';
    await this.execCommand(`docker stop ${flag} ${containerId}`);
  }

  async deletePod(containerId: string): Promise<void> {
    await this.bootstrap();
    try {
      await this.execCommand(`docker rm -f ${containerId}`);
    } catch {
      // Container may already be removed
    }
  }

  async listPods(): Promise<PodInfo[]> {
    await this.bootstrap();

    try {
      const { stdout } = await this.execCommand(
        `docker ps -a --filter label=coldiron.managed=true --format '{{.ID}}|{{.Names}}|{{.Status}}|{{.Label "coldiron.agent-id"}}'`
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
    await this.bootstrap();

    try {
      const { stdout } = await this.execCommand(
        `docker inspect --format '{{.State.Status}}|{{.State.StartedAt}}|{{.Config.Labels.coldiron.agent-id}}' ${containerId}`
      );

      const [state, startedAt, agentId] = stdout.trim().split('|');
      
      let status: PodInfo['status'] = 'unknown';
      if (state === 'running') status = 'running';
      else if (state === 'exited' || state === 'dead') status = 'stopped';

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
      const { stdout } = await this.execCommand('docker info --format "{{.ServerVersion}}"');
      return !!stdout.trim();
    } catch {
      return false;
    }
  }

  async pushConfig(containerId: string, config: Record<string, any>): Promise<void> {
    await this.bootstrap();
    
    if (config.command) {
      await this.execCommand(`docker exec ${containerId} ${config.command}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.sshClient) {
      this.sshClient.end();
      this.sshClient = null;
    }
  }
}
