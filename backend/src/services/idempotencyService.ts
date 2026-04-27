import { query, queryOne } from '../db/pool';

export interface IdempotencyRecord {
  key: string;
  response_hash: string;
  created_at: Date;
}

export async function getIdempotentResponse(key: string): Promise<string | null> {
  const record = await queryOne<IdempotencyRecord>(
    'SELECT response_hash FROM idempotency_keys WHERE key = $1', 
    [key]
  );
  return record?.response_hash || null;
}

export async function storeIdempotentResponse(key: string, responseHash: string): Promise<void> {
  await query(
    `INSERT INTO idempotency_keys (key, response_hash) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET response_hash = EXCLUDED.response_hash`,
    [key, responseHash]
  );
}

export function generateIdempotencyKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

export function hashResponse(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}