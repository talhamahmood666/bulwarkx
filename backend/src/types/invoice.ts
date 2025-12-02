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
  amountEth: string;
  escrowId?: string;
  status: InvoiceStatus;
}
