export interface PodInfo {
  id: string;
  containerId: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  health: 'green' | 'yellow' | 'red' | 'unknown';
  startedAt?: Date;
  lastHeartbeatAt?: Date;
}

export interface ExecutorDriver {
  kind: 'incus' | 'docker' | 'vps';
  
  // Pod lifecycle
  createPod(agentId: string, image: string, config?: Record<string, any>): Promise<PodInfo>;
  startPod(containerId: string): Promise<void>;
  stopPod(containerId: string, force?: boolean): Promise<void>;
  deletePod(containerId: string): Promise<void>;
  
  // Observation
  listPods(): Promise<PodInfo[]>;
  getPod(containerId: string): Promise<PodInfo | null>;
  
  // Health
  checkHealth(): Promise<boolean>;
  
  // Configuration
  pushConfig(containerId: string, config: Record<string, any>): Promise<void>;
}
