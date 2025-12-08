export type InvoiceStatus =
  | "pending"
  | "created"
  | "paid"
  | "released"
  | "refunded";

export interface Invoice {
  id: string;
  payeeAddress: string;
  arbiterAddress: string;
  autoReleaseSeconds: number;
  amountEth?: string;
  amountTokenWei?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  payerAddress?: string;
  callbackUrl?: string;
  escrowId?: string;
  txHash?: string;
  status: InvoiceStatus;
}
