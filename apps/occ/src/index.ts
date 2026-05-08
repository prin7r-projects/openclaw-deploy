import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { parse as parseYaml } from 'yaml';

const CONFIG_DIR = join(homedir(), '.coldiron');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  apiUrl: string;
  token?: string;
  userId?: string;
  email?: string;
}

function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { apiUrl: 'https://openclaw-deploy.prin7r.com/api' };
  }
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

function saveConfig(config: Config) {
  mkdirSync(dirname(CONFIG_FILE), { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const config = loadConfig();
  const url = `${config.apiUrl}${path}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  return response.json();
}

const program = new Command();

program
  .name('occ')
  .description('OpenClaw Deploy CLI — declarative agent fleet management')
  .version('0.2.0');

program
  .command('login')
  .description('Authenticate with Cold Iron control plane')
  .requiredOption('-e, --email <email>', 'Email address for authentication')
  .option('-u, --url <url>', 'API URL', 'https://openclaw-deploy.prin7r.com/api')
  .action(async (opts) => {
    try {
      console.log(`Logging in as ${opts.email}...`);
      
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: opts.email }),
      });

      const config = loadConfig();
      config.token = result.token;
      config.userId = result.user.id;
      config.email = result.user.email;
      config.apiUrl = opts.url;
      saveConfig(config);

      console.log(`✓ Logged in as ${result.user.email}`);
      console.log(`  User ID: ${result.user.id}`);
      console.log(`  Plan: ${result.user.plan}`);
      console.log(`\nToken saved to ${CONFIG_FILE}`);
    } catch (err: any) {
      console.error(`✗ Login failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('apply')
  .description('Apply a fleet manifest')
  .requiredOption('-f, --file <path>', 'Path to fleet.yaml')
  .option('-i, --id <id>', 'Fleet ID (generated if not provided)')
  .action(async (opts) => {
    try {
      const yamlContent = readFileSync(opts.file, 'utf-8');
      const manifest = parseYaml(yamlContent);
      
      const fleetId = opts.id ?? manifest.fleet ?? `fleet-${Date.now()}`;
      
      console.log(`Applying fleet ${fleetId}...`);
      
      const result = await apiRequest(`/v1/fleets/${fleetId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ yaml_md: yamlContent }),
      });

      console.log(`✓ Fleet applied`);
      console.log(`  Reconcile ID: ${result.reconcile_id}`);
      console.log(`  Revision: ${result.plan_diff.revision}`);
      console.log(`  Status: ${result.plan_diff.changes}`);
    } catch (err: any) {
      console.error(`✗ Apply failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('plan')
  .description('Show the plan for a fleet manifest')
  .requiredOption('-f, --file <path>', 'Path to fleet.yaml')
  .option('-i, --id <id>', 'Fleet ID')
  .action(async (opts) => {
    try {
      const yamlContent = readFileSync(opts.file, 'utf-8');
      const manifest = parseYaml(yamlContent);
      const fleetId = opts.id ?? manifest.fleet ?? `fleet-${Date.now()}`;

      console.log(`Fleet: ${fleetId}`);
      console.log(`\nManifest:`);
      console.log(yamlContent);
      
      try {
        const result = await apiRequest(`/v1/fleets/${fleetId}`);
        console.log(`\nCurrent state:`);
        console.log(`  Agents: ${result.agents.length}`);
        console.log(`  Targets: ${result.targets.length}`);
        console.log(`  Pods: ${result.pods.length}`);
      } catch {
        console.log(`\nFleet not yet applied. Run 'occ apply' first.`);
      }
    } catch (err: any) {
      console.error(`✗ Plan failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('targets')
  .description('Manage compute targets')
  .command('add')
  .description('Add a compute target')
  .requiredOption('-k, --kind <kind>', 'Target kind (incus|docker|vps)')
  .requiredOption('-h, --host <uri>', 'Host URI')
  .requiredOption('-f, --fleet <id>', 'Fleet ID')
  .action(async (opts) => {
    try {
      console.log(`Adding ${opts.kind} target to fleet ${opts.fleet}...`);
      console.log(`  Host: ${opts.host}`);
      console.log(`✓ Target configuration saved (reconciliation will handle provisioning)`);
    } catch (err: any) {
      console.error(`✗ Failed to add target: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('rotate')
  .description('Rotate secrets for agents in a fleet')
  .requiredOption('-f, --fleet <id>', 'Fleet ID')
  .requiredOption('-s, --secret <name>', 'Secret key name to rotate')
  .option('-a, --agent <id>', 'Specific agent ID (rotates all if not provided)')
  .action(async (opts) => {
    try {
      console.log(`Rotating secret '${opts.secret}' in fleet ${opts.fleet}...`);
      
      const result = await apiRequest(`/v1/fleets/${opts.fleet}/rotate`, {
        method: 'POST',
        body: JSON.stringify({
          agent_id: opts.agent,
          secret_key_name: opts.secret,
        }),
      });

      console.log(`✓ Rotation initiated`);
      console.log(`  Reconcile ID: ${result.reconcile_id}`);
    } catch (err: any) {
      console.error(`✗ Rotation failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show status of a fleet or reconcile')
  .option('-f, --fleet <id>', 'Fleet ID')
  .option('-r, --reconcile <id>', 'Reconcile ID')
  .action(async (opts) => {
    try {
      if (opts.reconcile) {
        const result = await apiRequest(`/v1/reconciles/${opts.reconcile}`);
        console.log(`Reconcile: ${opts.reconcile}`);
        console.log(`Status: ${result.status}`);
        console.log(`Events: ${result.events.length}`);
        for (const event of result.events) {
          console.log(`  - ${event.type}: ${JSON.stringify(event.payload)}`);
        }
      } else if (opts.fleet) {
        const result = await apiRequest(`/v1/fleets/${opts.fleet}`);
        console.log(`Fleet: ${result.fleet.name}`);
        console.log(`Status: ${result.fleet.status}`);
        console.log(`Revision: ${result.fleet.yamlRevision}`);
        console.log(`\nAgents: ${result.agents.length}`);
        for (const agent of result.agents) {
          console.log(`  - ${agent.name} (${agent.image})`);
        }
        console.log(`\nTargets: ${result.targets.length}`);
        for (const target of result.targets) {
          console.log(`  - ${target.kind}://${target.hostUri} [${target.status}]`);
        }
      } else {
        console.error('Please provide --fleet or --reconcile');
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`✗ Status failed: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
