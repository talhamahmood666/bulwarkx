import { ethers } from 'ethers';

export type SupportedEvmChain = 'base' | 'ethereum' | 'bsc';

interface ChainEnvConfig {
  rpcUrl: string;
  escrowAddress: string;
  privateKey: string;
}

const CHAIN_CONFIG: Record<SupportedEvmChain, ChainEnvConfig> = {
  base: {
    rpcUrl: process.env.BASE_RPC_URL || process.env.RPC_URL || '',
    escrowAddress:
      process.env.BASE_ESCROW_ADDRESS || process.env.ESCROW_CONTRACT || '',
    privateKey: process.env.BASE_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  },
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || '',
    escrowAddress: process.env.ETHEREUM_ESCROW_ADDRESS || '',
    privateKey: process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  },
  bsc: {
    rpcUrl: process.env.BSC_RPC_URL || '',
    escrowAddress: process.env.BSC_ESCROW_ADDRESS || '',
    privateKey: process.env.BSC_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  },
};

export function getEvmConfigForChain(chain: string): ChainEnvConfig {
  const key = chain.toLowerCase() as SupportedEvmChain;
  const config = CHAIN_CONFIG[key];

  if (!config) {
    throw new Error(`Unsupported EVM chain: ${chain}`);
  }

  if (!config.rpcUrl || !config.escrowAddress || !config.privateKey) {
    throw new Error(`Missing configuration for chain: ${chain}`);
  }

  return config;
}

export function getProviderForChain(chain: string) {
  const { rpcUrl } = getEvmConfigForChain(chain);
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getSignerForChain(chain: string) {
  const { privateKey } = getEvmConfigForChain(chain);
  return new ethers.Wallet(privateKey, getProviderForChain(chain));
}

export function getEscrowContractForChain(chain: string, abi: any) {
  const { escrowAddress } = getEvmConfigForChain(chain);
  const signer = getSignerForChain(chain);
  return new ethers.Contract(escrowAddress, abi, signer);
}
