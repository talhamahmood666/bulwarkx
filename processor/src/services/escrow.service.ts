import { ethers } from 'ethers';
import BulwarkXEscrow from '../BulwarkXEscrow.json';
import { getEscrowContractForChain } from '../chains/evm';

type CreateEscrowParams = {
  chain: string;
  payee: string;
  arbiter: string;
  amount: bigint | string;
  autoReleaseSeconds?: number;
  tokenAddress?: string;
};

type TxResult = { escrowId?: string; txHash?: string };

function parseEscrowCreated(receipt: any, escrowInterface: any) {
  const parsed = (receipt?.logs || [])
    .map((log: any) => {
      try {
        return escrowInterface.parseLog(log);
      } catch (err) {
        return null;
      }
    })
    .filter(Boolean)
    .find((log: any) => log?.name === 'EscrowCreated');

  return parsed?.args?.escrowId as string | undefined;
}

export async function createEscrow(params: CreateEscrowParams): Promise<TxResult> {
  try {
    const escrowContract = getEscrowContractForChain(params.chain, BulwarkXEscrow.abi);
    const autoReleaseSeconds = params.autoReleaseSeconds ?? 3600;
    const isNative = !params.tokenAddress;

    const tx = isNative
      ? await escrowContract.createEscrow(
          params.payee,
          params.arbiter,
          autoReleaseSeconds,
          { value: typeof params.amount === 'bigint' ? params.amount : ethers.parseEther(String(params.amount)) }
        )
      : await escrowContract.createEscrowToken(
          params.payee,
          params.arbiter,
          params.tokenAddress,
          BigInt(params.amount),
          autoReleaseSeconds
        );

    const receipt = await tx.wait();
    const escrowId = parseEscrowCreated(receipt, escrowContract.interface);

    return { escrowId, txHash: receipt?.hash || tx?.hash };
  } catch (error: any) {
    throw new Error(error?.message || 'createEscrow failed');
  }
}

export async function releaseEscrow(chain: string, escrowId: string): Promise<TxResult> {
  try {
    const escrowContract = getEscrowContractForChain(chain, BulwarkXEscrow.abi);
    const tx = await escrowContract.releaseEscrow(escrowId);
    const receipt = await tx.wait();
    return { txHash: receipt?.hash || tx?.hash };
  } catch (error: any) {
    throw new Error(error?.message || 'releaseEscrow failed');
  }
}

export async function refundEscrow(chain: string, escrowId: string): Promise<TxResult> {
  try {
    const escrowContract = getEscrowContractForChain(chain, BulwarkXEscrow.abi);
    const tx = await escrowContract.refundEscrow(escrowId);
    const receipt = await tx.wait();
    return { txHash: receipt?.hash || tx?.hash };
  } catch (error: any) {
    throw new Error(error?.message || 'refundEscrow failed');
  }
}
