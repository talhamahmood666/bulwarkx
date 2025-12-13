import express from 'express';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';
import { escrowInterface, getChainId, getEscrowContract } from '../blockchain';
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

    if (!usingNative && !tokenAddress) {
      return res.status(400).json({ success: false, error: 'tokenAddress is required for token escrows' });
    }

    const offchainRef = uuidv4();
    const autoRelease = BigInt(autoReleaseSeconds ?? 3600);
    const chainId = await getChainId();
    const amount = usingNative ? ethers.parseEther(String(amountValue)) : BigInt(amountValue);
    const derivedOrderId = orderId && ethers.isHexString(orderId, 32) ? orderId : ethers.id(orderId || offchainRef);

    if (CONFIG.nonCustodialMode) {
      if (!payerAddress) {
        return res.status(400).json({ success: false, error: 'payerAddress is required in non-custodial mode' });
      }

      const contract = getEscrowContract();
      const currentNonce = await contract.nonces(payerAddress);
      const tokenForId = usingNative ? ethers.ZeroAddress : tokenAddress;
      const escrowId = ethers.keccak256(
        ethers.solidityPacked(
          ['bytes32', 'address', 'address', 'address', 'uint256', 'uint256'],
          [derivedOrderId, payerAddress, payee, tokenForId, amount, currentNonce]
        )
      );

      const encodedData = escrowInterface.encodeFunctionData(
        'createEscrowWithId(bytes32,address,address,uint256,uint64)',
        [derivedOrderId, payee, arbiter, amount, autoRelease]
      );

      const primaryRequest = {
        to: CONFIG.escrowContract,
        data: encodedData,
        value: usingNative ? amount.toString() : '0',
        chainId,
      };

      const record: EscrowRecord = {
        id: escrowId,
        offchainRef,
        orderId: derivedOrderId,
        callbackUrl,
        payerAddress,
        payeeAddress: payee,
        arbiterAddress: arbiter,
        tokenAddress: tokenAddress || undefined,
        amount: amount.toString(),
        isNative: usingNative,
        status: 'pending_signature',
      };

      escrowStore.set(escrowId, record);

      if (usingNative) {
        return res.json({
          success: true,
          mode: 'non-custodial',
          escrowId,
          offchainRef,
          orderId: derivedOrderId,
          txRequest: primaryRequest,
        });
      }

      const erc20Interface = new ethers.Interface(['function approve(address spender,uint256 amount)']);
      const approveTx = {
        to: tokenAddress,
        data: erc20Interface.encodeFunctionData('approve', [CONFIG.escrowContract, amount]),
        value: '0',
        chainId,
      };

      return res.json({
        success: true,
        mode: 'non-custodial',
        escrowId,
        offchainRef,
        orderId: derivedOrderId,
        txRequests: [approveTx, primaryRequest],
      });
    }

    const contract = getEscrowContract();
    const tx = usingNative
      ? await contract.createEscrowWithId(derivedOrderId, payee, arbiter, amount, autoRelease, { value: amount })
      : await contract.createEscrowTokenWithId(derivedOrderId, tokenAddress, payee, arbiter, amount, autoRelease);
    const receipt = await tx.wait();

    const createdEvent = receipt?.logs
      ?.map((log: any) => {
        try {
          return escrowInterface.parseLog(log);
        } catch (err) {
          return null;
        }
      })
      .find((parsed: any) => parsed && parsed.name === 'EscrowCreated');

    const escrowId = createdEvent?.args?.escrowId || '';

    const record: EscrowRecord = {
      id: escrowId,
      offchainRef,
      orderId: derivedOrderId,
      callbackUrl,
      payerAddress,
      payeeAddress: payee,
      arbiterAddress: arbiter,
      tokenAddress: tokenAddress || undefined,
      amount: amount.toString(),
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
