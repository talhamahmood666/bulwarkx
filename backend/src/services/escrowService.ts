import { getInvoiceByEscrowId } from "./invoiceService";

type EscrowStatus = "Uninitialized" | "Funded" | "Released" | "Refunded" | "Disputed";

export function getEscrowStatus(escrowId: string) {
  const invoice = getInvoiceByEscrowId(escrowId);

  if (!invoice) {
    return { escrowId, status: "Uninitialized" as EscrowStatus };
  }

  let status: EscrowStatus = "Uninitialized";

  switch (invoice.status) {
    case "created":
    case "paid":
      status = "Funded";
      break;
    case "released":
      status = "Released";
      break;
    case "refunded":
      status = "Refunded";
      break;
    default:
      status = "Uninitialized";
  }

  return { escrowId, status };
}
