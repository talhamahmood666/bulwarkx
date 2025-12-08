import { Invoice } from "../types/invoice";

const invoices = new Map<string, Invoice>();

function generateId(prefix = "inv") {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${randomPart}`;
}

export function createInvoice(data: Omit<Invoice, "id" | "status" | "escrowId" | "txHash">) {
  const id = generateId();
  const invoice: Invoice = {
    id,
    status: "created",
    ...data,
  };

  invoices.set(id, invoice);
  return invoice;
}

export function attachEscrowDetails(id: string, details: { escrowId?: string; txHash?: string }) {
  const invoice = invoices.get(id);

  if (!invoice) {
    return undefined;
  }

  invoice.escrowId = details.escrowId ?? invoice.escrowId;
  invoice.txHash = details.txHash ?? invoice.txHash;

  invoices.set(id, invoice);
  return invoice;
}

export function getInvoiceById(id: string) {
  return invoices.get(id);
}

export function getInvoiceByEscrowId(escrowId: string) {
  for (const invoice of invoices.values()) {
    if (invoice.escrowId === escrowId) {
      return invoice;
    }
  }
  return undefined;
}

export function getInvoicesStore() {
  return invoices;
}
