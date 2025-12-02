import express from "express";
import { getEscrowStatus } from "../services/escrowService";

const router = express.Router();

router.get("/:escrowId", async (req, res) => {
  try {
    const escrowId = req.params.escrowId;
    const status = getEscrowStatus(escrowId);
    return res.json(status);
  } catch (error) {
    console.error("Error fetching escrow status", error);
    return res.status(500).json({ error: "Failed to fetch escrow status" });
  }
});

export default router;
