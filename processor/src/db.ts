export type EscrowStatus = 'onchain_open' | 'released' | 'refunded';

export interface EscrowRecord {
  id: number;
  offchainRef: string;
  orderId?: string;
  callbackUrl?: string;
  payerAddress?: string;
  payeeAddress: string;
  arbiterAddress: string;
  amountEth: string;
  status: EscrowStatus;
  txHash?: string;
}

export const escrowStore: Map<number, EscrowRecord> = new Map();
