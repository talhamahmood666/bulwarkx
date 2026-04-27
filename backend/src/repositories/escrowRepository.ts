import { query, queryOne } from '../db/pool';

export interface Escrow {
  id: string;
  escrow_external_id: string | null;
  order_id: string;
  chain_type: 'evm' | 'solana' | 'tron';
  chain_id: number;
  contract_address: string;
  payer_address: string;
  payee_address: string;
  arbiter_address: string;
  token_address: string | null;
  amount_native: string | null;
  amount_token: string | null;
  status: 'created' | 'funded' | 'released' | 'refunded' | 'disputed' | 'cancelled';
  callback_url: string | null;
  auto_release_seconds: number | null;
  created_at: Date;
  updated_at: Date;
  funded_at: Date | null;
  released_at: Date | null;
  refunded_at: Date | null;
  disputed_at: Date | null;
  created_block_number: bigint | null;
  funded_block_number: bigint | null;
  released_block_number: bigint | null;
  refunded_block_number: bigint | null;
  tx_hash_created: string | null;
  tx_hash_funded: string | null;
  tx_hash_released: string | null;
  tx_hash_refunded: string | null;
}

export interface CreateEscrowInput {
  orderId: string;
  chainId: number;
  contractAddress: string;
  payerAddress: string;
  payeeAddress: string;
  arbiterAddress: string;
  tokenAddress?: string;
  amountNative?: string;
  amountToken?: string;
  callbackUrl?: string;
  autoReleaseSeconds?: number;
}

export async function createEscrow(input: CreateEscrowInput): Promise<Escrow> {
  const [escrow] = await query<Escrow>(
    `INSERT INTO escrows (
      order_id, chain_id, contract_address, payer_address, payee_address, arbiter_address,
      token_address, amount_native, amount_token, callback_url, auto_release_seconds, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'created')
    RETURNING *`,
    [
      input.orderId, input.chainId, input.contractAddress, input.payerAddress, 
      input.payeeAddress, input.arbiterAddress, input.tokenAddress || null,
      input.amountNative || null, input.amountToken || null, input.callbackUrl || null,
      input.autoReleaseSeconds || null
    ]
  );
  return escrow;
}

export async function getEscrowById(id: string): Promise<Escrow | null> {
  return queryOne<Escrow>('SELECT * FROM escrows WHERE id = $1', [id]);
}

export async function getEscrowByOrderId(orderId: string): Promise<Escrow | null> {
  return queryOne<Escrow>('SELECT * FROM escrows WHERE order_id = $1', [orderId]);
}

export async function getEscrowByExternalId(externalId: string): Promise<Escrow | null> {
  return queryOne<Escrow>('SELECT * FROM escrows WHERE escrow_external_id = $1', [externalId]);
}

export async function updateEscrowStatus(
  id: string, 
  status: Escrow['status'], 
  blockNumber: bigint,
  txHash: string
): Promise<void> {
  const updates: string[] = ['status = $2', 'updated_at = NOW()'];
  const params: any[] = [id, status];
  let paramIndex = 3;

  if (status === 'funded') {
    updates.push(`funded_at = NOW()`, `funded_block_number = $${paramIndex++}`, `tx_hash_funded = $${paramIndex++}`);
    params.push(blockNumber, txHash);
  } else if (status === 'released') {
    updates.push(`released_at = NOW()`, `released_block_number = $${paramIndex++}`, `tx_hash_released = $${paramIndex++}`);
    params.push(blockNumber, txHash);
  } else if (status === 'refunded') {
    updates.push(`refunded_at = NOW()`, `refunded_block_number = $${paramIndex++}`, `tx_hash_refunded = $${paramIndex++}`);
    params.push(blockNumber, txHash);
  } else if (status === 'disputed') {
    updates.push(`disputed_at = NOW()`);
  }

  await query(`UPDATE escrows SET ${updates.join(', ')} WHERE id = $1`, params);
}

export async function linkExternalId(id: string, externalId: string): Promise<void> {
  await query('UPDATE escrows SET escrow_external_id = $2, updated_at = NOW() WHERE id = $1', [id, externalId]);
}