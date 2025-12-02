import express from 'express';
import { escrowContract } from '../blockchain';
import { escrowStore } from '../db';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const escrowId = req.params.id;
    if (escrowId === undefined || escrowId === null) {
      return res.status(400).json({ success: false, error: 'escrowId is required' });
    }

    const onchain = await escrowContract.getEscrow(escrowId);
    const local = escrowStore.get(Number(escrowId));

    const onchainResponse = {
      payer: onchain[0],
      payee: onchain[1],
      arbiter: onchain[2],
      amountWei: onchain[3]?.toString?.(),
      status: Number(onchain[4]),
      offchainRef: onchain[5]
    };

    return res.json({
      success: true,
      escrowId: Number(escrowId),
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
