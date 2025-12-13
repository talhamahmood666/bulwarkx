import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  rpcUrl: process.env.RPC_URL || '',
  privateKey: process.env.PRIVATE_KEY || '',
  escrowContract: process.env.ESCROW_CONTRACT || '',
  port: Number(process.env.PORT || 3000),
  nonCustodialMode: process.env.NON_CUSTODIAL_MODE !== 'false',
};

if (!CONFIG.rpcUrl) {
  // eslint-disable-next-line no-console
  console.warn('RPC_URL not set; blockchain interactions will fail.');
}

if (!CONFIG.escrowContract) {
  // eslint-disable-next-line no-console
  console.warn('ESCROW_CONTRACT not set; contract methods will fail.');
}

if (!CONFIG.privateKey && !CONFIG.nonCustodialMode) {
  // eslint-disable-next-line no-console
  console.warn('PRIVATE_KEY not set; custodial mode transactions cannot be signed.');
}
