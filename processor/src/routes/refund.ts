import express from 'express';
import { CONFIG } from '../config';
import { escrowInterface, getChainId, getEscrowContract } from '../blockchain';
import { escrowStore } from '../db';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { escrowId } = req.body || {};
    if (!escrowId) {
      return res.status(400).json({ success: false, error: 'escrowId is required' });
    }

    const record = escrowStore.get(String(escrowId));
    if (!record) {
      return res.status(404).json({ success: false, error: 'Escrow not found' });
    }

    const contract = getEscrowContract();
    if (CONFIG.nonCustodialMode) {
      const chainId = await getChainId();
      const txRequest = {
        to: CONFIG.escrowContract,
        data: escrowInterface.encodeFunctionData('refundEscrow', [escrowId]),
        value: '0',
        chainId,
      };

      record.status = 'pending_signature';
      escrowStore.set(String(escrowId), record);

      return res.json({ success: true, escrowId, mode: 'non-custodial', txRequest });
    }

    const tx = await contract.refundEscrow(escrowId);
    const receipt = await tx.wait();

    record.status = 'refunded';
    record.txHash = receipt?.hash || tx.hash;
    escrowStore.set(String(escrowId), record);

    return res.json({ success: true, escrowId, txHash: record.txHash });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('refund escrow error', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal error' });
  }
});

export default router;
