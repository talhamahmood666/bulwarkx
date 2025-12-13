export type EscrowStatus = 'onchain_open' | 'released' | 'refunded' | 'pending_signature';

export interface EscrowRecord {
  id: string;
  offchainRef: string;
  orderId?: string;
  callbackUrl?: string;
  payerAddress?: string;
  payeeAddress: string;
  arbiterAddress: string;
  tokenAddress?: string;
  amount: string;
  isNative: boolean;
  status: EscrowStatus;
  txHash?: string;
}

export const escrowStore: Map<string, EscrowRecord> = new Map();
