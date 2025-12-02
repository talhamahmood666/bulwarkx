import express from "express";
import { createInvoice, getInvoiceById } from "../services/invoiceService";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { payeeAddress, arbiterAddress, autoReleaseSeconds, amountEth } = req.body || {};

    if (!payeeAddress || !arbiterAddress || !autoReleaseSeconds || !amountEth) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const invoice = createInvoice({
      payeeAddress,
      arbiterAddress,
      autoReleaseSeconds: Number(autoReleaseSeconds),
      amountEth: String(amountEth),
    });

    return res.status(201).json({
      invoiceId: invoice.id,
      escrowId: invoice.escrowId,
      paymentUrl: `https://pay.bulwarkx.local/escrow/${invoice.escrowId}`,
      network: "sepolia",
    });
  } catch (error) {
    console.error("Error creating invoice", error);
    return res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    return res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice", error);
    return res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

export default router;
