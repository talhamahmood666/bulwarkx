import { ethers } from 'ethers';
import BulwarkXEscrow from './BulwarkXEscrow.json';
import { CONFIG } from './config';

if (!CONFIG.rpcUrl || !CONFIG.escrowContract) {
  // eslint-disable-next-line no-console
  console.warn('Blockchain configuration incomplete. Ensure RPC_URL and ESCROW_CONTRACT are set.');
}

export const provider = CONFIG.rpcUrl ? new ethers.JsonRpcProvider(CONFIG.rpcUrl) : undefined;
export const wallet = !CONFIG.nonCustodialMode && CONFIG.privateKey && provider
  ? new ethers.Wallet(CONFIG.privateKey, provider)
  : undefined;

export const escrowInterface = new ethers.Interface(BulwarkXEscrow.abi);

export function getEscrowContract() {
  if (!provider) {
    throw new Error('Provider not configured');
  }
  if (!CONFIG.escrowContract) {
    throw new Error('ESCROW_CONTRACT not set');
  }

  const connection = wallet || provider;

  return new ethers.Contract(CONFIG.escrowContract, BulwarkXEscrow.abi, connection);
}

export async function getChainId(): Promise<number> {
  if (!provider) {
    throw new Error('Provider not configured');
  }
  const network = await provider.getNetwork();
  return Number(network.chainId);
}
