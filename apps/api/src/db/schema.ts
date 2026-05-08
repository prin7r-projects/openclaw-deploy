import { sqliteTable, text, integer, blob, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  plan: text('plan', { enum: ['self_hosted', 'managed_starter', 'managed_pro'] }).default('self_hosted'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const fleets = sqliteTable('fleets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  yamlMd: text('yaml_md'),
  yamlRevision: integer('yaml_revision').default(0),
  status: text('status', { enum: ['applied', 'pending', 'drift_detected'] }).default('pending'),
  appliedAt: integer('applied_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  fleetId: text('fleet_id').notNull().references(() => fleets.id),
  name: text('name').notNull(),
  image: text('image').notNull(),
  specYaml: text('spec_yaml'),
  minReplicas: integer('min_replicas').default(1),
  maxReplicas: integer('max_replicas').default(1),
  placement: text('placement', { enum: ['incus', 'docker', 'vps', 'any'] }).default('any'),
  costCapDailyCents: integer('cost_cap_daily_cents'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const targets = sqliteTable('targets', {
  id: text('id').primaryKey(),
  fleetId: text('fleet_id').notNull().references(() => fleets.id),
  kind: text('kind', { enum: ['incus', 'docker', 'vps'] }).notNull(),
  hostUri: text('host_uri').notNull(),
  status: text('status', { enum: ['ready', 'degraded', 'unreachable'] }).default('ready'),
  checkedAt: integer('checked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const pods = sqliteTable('pods', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  targetId: text('target_id').references(() => targets.id),
  health: text('health', { enum: ['green', 'yellow', 'red', 'unknown'] }).default('unknown'),
  containerId: text('container_id'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  lastHeartbeatAt: integer('last_heartbeat_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const secrets = sqliteTable('secrets', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  keyName: text('key_name').notNull(),
  valueEncrypted: blob('value_encrypted'),
  status: text('status', { enum: ['active', 'rotating', 'revoked'] }).default('active'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const reconciles = sqliteTable('reconciles', {
  id: text('id').primaryKey(),
  fleetId: text('fleet_id').notNull().references(() => fleets.id),
  yamlRevision: integer('yaml_revision'),
  status: text('status', { enum: ['running', 'finished', 'failed'] }).default('running'),
  user: text('user'),
  startedAt: integer('started_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  reconcileId: text('reconcile_id').references(() => reconciles.id),
  type: text('type').notNull(),
  payload: text('payload', { mode: 'json' }),
  at: integer('at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const apiTokens = sqliteTable('api_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  name: text('name'),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
