import express from 'express';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { escrowContract } from '../blockchain';
import { escrowStore, EscrowRecord } from '../db';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { payee, arbiter, amountEth, orderId, callbackUrl, payerAddress } = req.body || {};

    if (!payee || !arbiter || !amountEth) {
      return res.status(400).json({ success: false, error: 'payee, arbiter, and amountEth are required' });
    }

    const offchainRef = uuidv4();
    const nextIdBigInt: bigint = await escrowContract.nextEscrowId();
    const escrowId = Number(nextIdBigInt);

    const tx = await escrowContract.createEscrow(payee, arbiter, offchainRef, {
      value: ethers.parseEther(String(amountEth))
    });
    const receipt = await tx.wait();

    const record: EscrowRecord = {
      id: escrowId,
      offchainRef,
      orderId,
      callbackUrl,
      payerAddress,
      payeeAddress: payee,
      arbiterAddress: arbiter,
      amountEth: String(amountEth),
      status: 'onchain_open',
      txHash: receipt?.hash || tx.hash
    };

    escrowStore.set(escrowId, record);

    return res.json({ success: true, escrowId, offchainRef, txHash: record.txHash });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('create escrow error', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal error' });
  }
});

export default router;
