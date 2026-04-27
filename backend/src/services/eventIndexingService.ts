import { query, queryOne } from '../db/pool';
import { getEscrowByExternalId, updateEscrowStatus } from '../repositories/escrowRepository';

export interface ChainEvent {
  id?: string;
  escrow_id: string | null;
  event_type: string;
  chain_id: number;
  contract_address: string;
  tx_hash: string;
  block_number: bigint;
  block_hash: string;
  log_index: number;
  timestamp?: Date;
  processed_at?: Date;
}

export async function insertEvent(event: Omit<ChainEvent, 'id' | 'processed_at'>): Promise<ChainEvent | null> {
  try {
    const [row] = await query<ChainEvent>(
      `INSERT INTO events (escrow_id, event_type, chain_id, contract_address, tx_hash, block_number, block_hash, log_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (chain_id, tx_hash, log_index) DO NOTHING
       RETURNING *`,
      [event.escrow_id, event.event_type, event.chain_id, event.contract_address, 
       event.tx_hash, event.block_number, event.block_hash, event.log_index]
    );
    return row || null;
  } catch (err) {
    console.error('Failed to insert event', err);
    return null;
  }
}

export async function getUnprocessedEvents(limit = 100): Promise<ChainEvent[]> {
  return query<ChainEvent>(
    `SELECT * FROM events WHERE processed_at IS NULL ORDER BY block_number ASC, log_index ASC LIMIT $1`,
    [limit]
  );
}

export async function markEventProcessed(id: string): Promise<void> {
  await query('UPDATE events SET processed_at = NOW() WHERE id = $1', [id]);
}

export async function getChainHead(chainId: number): Promise<{ block_number: bigint; block_hash: string } | null> {
  return queryOne('SELECT block_number, block_hash FROM chain_heads WHERE chain_id = $1', [chainId]);
}

export async function updateChainHead(chainId: number, blockNumber: bigint, blockHash: string): Promise<void> {
  await query(
    `INSERT INTO chain_heads (chain_id, block_number, block_hash, timestamp)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (chain_id) DO UPDATE SET block_number = $2, block_hash = $3, timestamp = NOW()`,
    [chainId, blockNumber, blockHash]
  );
}

export async function detectReorg(chainId: number, newBlockHash: string): Promise<boolean> {
  const head = await getChainHead(chainId);
  if (!head) return false;
  return head.block_hash !== newBlockHash;
}

export async function rollbackToBlock(chainId: number, blockNumber: bigint): Promise<void> {
  await query('DELETE FROM events WHERE chain_id = $1 AND block_number > $2', [chainId, blockNumber]);
  await query(
    `UPDATE escrows SET status = 'created', updated_at = NOW(),
     funded_at = NULL, released_at = NULL, refunded_at = NULL, disputed_at = NULL,
     funded_block_number = NULL, released_block_number = NULL, refunded_block_number = NULL,
     tx_hash_funded = NULL, tx_hash_released = NULL, tx_hash_refunded = NULL
     WHERE chain_id = $1 AND created_block_number > $2`,
    [chainId, blockNumber]
  );
}

export async function processEvent(event: ChainEvent): Promise<void> {
  if (!event.escrow_id) {
    const escrow = await getEscrowByExternalId(event.contract_address);
    if (escrow) {
      event.escrow_id = escrow.id;
    }
  }

  if (!event.escrow_id) {
    console.warn('No escrow found for event', event.tx_hash);
    return;
  }

  const statusMap: Record<string, 'funded' | 'released' | 'refunded' | 'disputed'> = {
    'escrow_funded': 'funded',
    'escrow_released': 'released',
    'escrow_refunded': 'refunded',
    'escrow_disputed': 'disputed',
  };

  const newStatus = statusMap[event.event_type];
  if (newStatus) {
    await updateEscrowStatus(event.escrow_id, newStatus, event.block_number, event.tx_hash);
  }
}