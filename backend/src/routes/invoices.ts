import express from "express";
import axios from "axios";
import { attachEscrowDetails, createInvoice, getInvoiceById } from "../services/invoiceService";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { payeeAddress, arbiterAddress, autoReleaseSeconds, amountEth, callbackUrl, payerAddress } = req.body || {};

    if (!payeeAddress || !arbiterAddress || !amountEth) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const invoice = createInvoice({
      payeeAddress,
      arbiterAddress,
      autoReleaseSeconds: Number(autoReleaseSeconds ?? 0),
      amountEth: String(amountEth),
      callbackUrl,
      payerAddress,
    });

    const processorBaseUrl = process.env.PROCESSOR_BASE_URL || "http://localhost:3000";

    try {
      const escrowResponse = await axios.post(`${processorBaseUrl}/escrow/create`, {
        payee: payeeAddress,
        arbiter: arbiterAddress,
        amountEth,
        orderId: invoice.id,
        callbackUrl,
        payerAddress,
      });

      const { escrowId, txHash } = escrowResponse.data || {};
      attachEscrowDetails(invoice.id, { escrowId, txHash });

      return res.status(201).json({
        invoiceId: invoice.id,
        escrowId,
        txHash,
        paymentUrl: escrowId ? `https://pay.bulwarkx.local/escrow/${escrowId}` : null,
        network: "base-sepolia",
      });
    } catch (processorError) {
      console.error("Error creating escrow via processor", processorError);
      return res.status(500).json({ error: "Failed to create on-chain escrow" });
    }
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
