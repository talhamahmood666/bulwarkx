import express from 'express';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { escrowContract } from '../blockchain';
import { escrowStore, EscrowRecord } from '../db';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { payee, arbiter, amountEth, amountToken, amountTokenWei, tokenAddress, orderId, callbackUrl, payerAddress, autoReleaseSeconds } = req.body || {};

    if (!payee || !arbiter) {
      return res.status(400).json({ success: false, error: 'payee and arbiter are required' });
    }

    const usingNative = !tokenAddress;
    const tokenAmountInput = amountTokenWei ?? amountToken;
    const amountValue = usingNative ? amountEth : tokenAmountInput;

    if (!amountValue) {
      return res.status(400).json({ success: false, error: 'amount is required' });
    }

    const offchainRef = uuidv4();

    let tx;
    let receipt;
    let escrowId: string = '';
    const autoRelease = Number(autoReleaseSeconds ?? 3600);

    if (usingNative) {
      tx = await escrowContract.createEscrow(payee, arbiter, autoRelease, {
        value: ethers.parseEther(String(amountValue))
      });
      receipt = await tx.wait();
    } else {
      const parsedAmount = BigInt(amountValue);
      // Payer must approve this processor signer to transfer the token amount before calling createEscrowToken
      tx = await escrowContract.createEscrowToken(payee, arbiter, tokenAddress, parsedAmount, autoRelease);
      receipt = await tx.wait();
    }

    const createdEvent = receipt?.logs
      ?.map((log: any) => {
        try {
          return escrowContract.interface.parseLog(log);
        } catch (err) {
          return null;
        }
      })
      .find((parsed: any) => parsed && parsed.name === 'EscrowCreated');

    escrowId = createdEvent?.args?.escrowId || '';

    const record: EscrowRecord = {
      id: escrowId,
      offchainRef,
      orderId,
      callbackUrl,
      payerAddress,
      payeeAddress: payee,
      arbiterAddress: arbiter,
      tokenAddress: tokenAddress || undefined,
      amount: String(amountValue),
      isNative: usingNative,
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
