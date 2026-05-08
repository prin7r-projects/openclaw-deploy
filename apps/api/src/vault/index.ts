import { db, schema } from '../db/index.js';
import { eq, and, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Simple encryption using Web Crypto API (libsodium-compatible approach)
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

export class VaultAdapter {
  private masterKey: CryptoKey | null = null;

  async initialize(passphrase: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    this.masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('coldiron-vault-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encrypt(plaintext: string): Promise<Buffer> {
    if (!this.masterKey) throw new Error('Vault not initialized');

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      this.masterKey,
      encoder.encode(plaintext)
    );

    // Combine IV + ciphertext
    return Buffer.concat([iv, Buffer.from(encrypted)]);
  }

  private async decrypt(encryptedBuffer: Buffer): Promise<string> {
    if (!this.masterKey) throw new Error('Vault not initialized');

    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const ciphertext = encryptedBuffer.subarray(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      this.masterKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  async storeSecret(agentId: string, keyName: string, value: string, expiresAt?: Date): Promise<string> {
    const encrypted = await this.encrypt(value);
    const id = nanoid();

    await db.insert(schema.secrets).values({
      id,
      agentId,
      keyName,
      valueEncrypted: encrypted,
      status: 'active',
      expiresAt,
    });

    return id;
  }

  async getSecret(secretId: string): Promise<string | null> {
    const [secret] = await db
      .select()
      .from(schema.secrets)
      .where(eq(schema.secrets.id, secretId))
      .limit(1);

    if (!secret || !secret.valueEncrypted) return null;
    return this.decrypt(Buffer.from(secret.valueEncrypted));
  }

  async getSecretByKey(agentId: string, keyName: string): Promise<{ id: string; value: string } | null> {
    const [secret] = await db
      .select()
      .from(schema.secrets)
      .where(
        and(
          eq(schema.secrets.agentId, agentId),
          eq(schema.secrets.keyName, keyName),
          eq(schema.secrets.status, 'active')
        )
      )
      .limit(1);

    if (!secret || !secret.valueEncrypted) return null;
    const value = await this.decrypt(Buffer.from(secret.valueEncrypted));
    return { id: secret.id, value };
  }

  async rotateSecret(secretId: string, newValue: string): Promise<void> {
    const encrypted = await this.encrypt(newValue);

    // Mark old secret as rotating
    await db
      .update(schema.secrets)
      .set({ status: 'rotating' })
      .where(eq(schema.secrets.id, secretId));

    // Get the old secret to create new one
    const [oldSecret] = await db
      .select()
      .from(schema.secrets)
      .where(eq(schema.secrets.id, secretId))
      .limit(1);

    if (oldSecret) {
      // Create new active secret
      await db.insert(schema.secrets).values({
        id: nanoid(),
        agentId: oldSecret.agentId,
        keyName: oldSecret.keyName,
        valueEncrypted: encrypted,
        status: 'active',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });

      // Mark old secret as revoked
      await db
        .update(schema.secrets)
        .set({ status: 'revoked' })
        .where(eq(schema.secrets.id, secretId));
    }
  }

  async getExpiringSecrets(hoursUntilExpiry = 24): Promise<Array<{
    id: string;
    agentId: string;
    keyName: string;
    expiresAt: Date | null;
  }>> {
    const threshold = new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000);
    
    return db
      .select({
        id: schema.secrets.id,
        agentId: schema.secrets.agentId,
        keyName: schema.secrets.keyName,
        expiresAt: schema.secrets.expiresAt,
      })
      .from(schema.secrets)
      .where(
        and(
          eq(schema.secrets.status, 'active'),
          lt(schema.secrets.expiresAt, threshold)
        )
      );
  }

  async revokeSecret(secretId: string): Promise<void> {
    await db
      .update(schema.secrets)
      .set({ status: 'revoked' })
      .where(eq(schema.secrets.id, secretId));
  }
}

// Singleton instance
export const vault = new VaultAdapter();

// Initialize vault on module load
const passphrase = process.env.COLD_IRON_KEY_PASSPHRASE;
if (passphrase) {
  vault.initialize(passphrase).catch(err => {
    console.error('[Vault] Failed to initialize:', err);
  });
} else {
  console.warn('[Vault] COLD_IRON_KEY_PASSPHRASE not set — secrets will not be encrypted');
}
