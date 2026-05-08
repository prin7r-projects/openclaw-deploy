import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { sql } from 'drizzle-orm';

const dbPath = process.env.DATABASE_URL ?? './data/coldiron.db';
mkdirSync(dirname(dbPath), { recursive: true });

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

// Auto-create tables if they don't exist
export async function initDatabase(): Promise<void> {
  console.log('[DB] Initializing database...');
  
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'self_hosted',
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS fleets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      yaml_md TEXT,
      yaml_revision INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      applied_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      fleet_id TEXT NOT NULL REFERENCES fleets(id),
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      spec_yaml TEXT,
      min_replicas INTEGER DEFAULT 1,
      max_replicas INTEGER DEFAULT 1,
      pool_capacity INTEGER DEFAULT 0,
      placement TEXT DEFAULT 'any',
      cost_cap_daily_cents INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS targets (
      id TEXT PRIMARY KEY,
      fleet_id TEXT NOT NULL REFERENCES fleets(id),
      kind TEXT NOT NULL,
      host_uri TEXT NOT NULL,
      status TEXT DEFAULT 'ready',
      checked_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS pods (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      target_id TEXT REFERENCES targets(id),
      health TEXT DEFAULT 'unknown',
      container_id TEXT,
      started_at INTEGER,
      last_heartbeat_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      key_name TEXT NOT NULL,
      value_encrypted BLOB,
      status TEXT DEFAULT 'active',
      expires_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS reconciles (
      id TEXT PRIMARY KEY,
      fleet_id TEXT NOT NULL REFERENCES fleets(id),
      yaml_revision INTEGER,
      status TEXT DEFAULT 'running',
      user TEXT,
      started_at INTEGER DEFAULT (unixepoch()),
      finished_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      reconcile_id TEXT REFERENCES reconciles(id),
      type TEXT NOT NULL,
      payload TEXT,
      at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL,
      name TEXT,
      last_used_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_fleets_user_id ON fleets(user_id);
    CREATE INDEX IF NOT EXISTS idx_pods_agent_id ON pods(agent_id);
    CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets(expires_at);
    CREATE INDEX IF NOT EXISTS idx_events_at ON events(at);
  `);
  
  console.log('[DB] Database initialized');
}

export { schema };
