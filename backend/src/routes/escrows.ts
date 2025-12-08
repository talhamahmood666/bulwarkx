import express from "express";
import axios from "axios";
import { getEscrowStatus } from "../services/escrowService";

const router = express.Router();

router.get("/:escrowId", async (req, res) => {
  try {
    const escrowId = req.params.escrowId;
    const status = getEscrowStatus(escrowId);
    const processorBaseUrl = process.env.PROCESSOR_BASE_URL || "http://localhost:3000";
    let onChainStatus = null;

    try {
      const response = await axios.get(`${processorBaseUrl}/escrow/status/${escrowId}`);
      onChainStatus = response.data;
    } catch (processorError) {
      console.error("Error fetching escrow status from processor", processorError);
    }

    return res.json({ ...status, onChainStatus });
  } catch (error) {
    console.error("Error fetching escrow status", error);
    return res.status(500).json({ error: "Failed to fetch escrow status" });
  }
});

export default router;
