import express from 'express';
import { escrowContract } from '../blockchain';
import { escrowStore } from '../db';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { escrowId } = req.body || {};
    if (escrowId === undefined || escrowId === null) {
      return res.status(400).json({ success: false, error: 'escrowId is required' });
    }

    const record = escrowStore.get(Number(escrowId));
    if (!record) {
      return res.status(404).json({ success: false, error: 'Escrow not found' });
    }

    const tx = await escrowContract.releaseToPayee(escrowId);
    const receipt = await tx.wait();

    record.status = 'released';
    record.txHash = receipt?.hash || tx.hash;
    escrowStore.set(Number(escrowId), record);

    return res.json({ success: true, escrowId: Number(escrowId), txHash: record.txHash });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('release escrow error', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal error' });
  }
});

export default router;
