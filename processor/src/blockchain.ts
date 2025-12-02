import { ethers } from 'ethers';
import BulwarkXEscrow from './BulwarkXEscrow.json';
import { CONFIG } from './config';

if (!CONFIG.rpcUrl || !CONFIG.privateKey || !CONFIG.escrowContract) {
  // eslint-disable-next-line no-console
  console.warn('Blockchain configuration incomplete. Ensure RPC_URL, PRIVATE_KEY, and ESCROW_CONTRACT are set.');
}

const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
const wallet = new ethers.Wallet(CONFIG.privateKey, provider);

export const escrowContract = new ethers.Contract(
  CONFIG.escrowContract,
  BulwarkXEscrow.abi,
  wallet
);

export { provider, wallet };
