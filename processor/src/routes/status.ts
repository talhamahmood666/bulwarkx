import express from 'express';
import { escrowContract } from '../blockchain';
import { escrowStore } from '../db';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const escrowId = req.params.id;
    if (!escrowId) {
      return res.status(400).json({ success: false, error: 'escrowId is required' });
    }

    const onchain = await escrowContract.escrows(escrowId);
    const local = escrowStore.get(String(escrowId));

    const onchainResponse = {
      payer: onchain[0],
      payee: onchain[1],
      arbiter: onchain[2],
      token: onchain[3],
      amount: onchain[4]?.toString?.(),
      createdAt: Number(onchain[5] || 0),
      autoReleaseAt: Number(onchain[6] || 0),
      status: Number(onchain[7] || 0),
    };

    return res.json({
      success: true,
      escrowId,
      onchain: onchainResponse,
      local: local || null
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('status error', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal error' });
  }
});

export default router;
