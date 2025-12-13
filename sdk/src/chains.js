/** @typedef {number} ChainId */

/**
 * @typedef {Object} ChainConfig
 * @property {ChainId} chainId
 * @property {string} name
 * @property {string} blockExplorer
 * @property {string[]} rpcUrls
 */

export const CHAINS = {
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    blockExplorer: 'https://sepolia.basescan.org',
    rpcUrls: ['https://sepolia.base.org']
  },
  8453: {
    chainId: 8453,
    name: 'Base Mainnet',
    blockExplorer: 'https://basescan.org',
    rpcUrls: ['https://mainnet.base.org']
  },
  11155420: {
    chainId: 11155420,
    name: 'OP Sepolia',
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
    rpcUrls: ['https://sepolia.optimism.io']
  },
  10: {
    chainId: 10,
    name: 'OP Mainnet',
    blockExplorer: 'https://optimistic.etherscan.io',
    rpcUrls: ['https://mainnet.optimism.io']
  },
  421614: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    blockExplorer: 'https://sepolia.arbiscan.io',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc']
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    blockExplorer: 'https://arbiscan.io',
    rpcUrls: ['https://arb1.arbitrum.io/rpc']
  },
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy',
    blockExplorer: 'https://www.oklink.com/amoy',
    rpcUrls: ['https://rpc-amoy.polygon.technology']
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    blockExplorer: 'https://polygonscan.com',
    rpcUrls: ['https://polygon-rpc.com']
  },
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    blockExplorer: 'https://testnet.bscscan.com',
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545']
  },
  56: {
    chainId: 56,
    name: 'BSC Mainnet',
    blockExplorer: 'https://bscscan.com',
    rpcUrls: ['https://bsc-dataseed.binance.org']
  }
}

/** @param {ChainId} chainId */
export function isSupportedChain(chainId) {
  return Boolean(CHAINS[chainId])
}
