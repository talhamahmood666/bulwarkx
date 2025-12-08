# BulwarkX Architecture

BulwarkX centers around the `BulwarkXEscrow` smart contract, which now supports native ETH (address(0)) and ERC-20 tokens through SafeERC20 helpers. Hardhat is configured for Ethereum (mainnet/Sepolia), Base (mainnet/Sepolia), Polygon Amoy, BNB Testnet, Arbitrum Sepolia, and Optimism Sepolia so deployments can target multiple ecosystems. The included deploy script can be pointed at any configured network, and env samples list the required RPC URLs and private key slot.

A TypeScript processor service (Express + ethers v6) connects to the contract using RPC, exposes `/escrow/create`, `/escrow/release`, `/escrow/refund`, and `/escrow/status/:id`, and persists lightweight metadata in memory. The backend API mounts `/api/invoices` and `/api/escrows`, creates off-chain invoices, and forwards escrow creation to the processor while returning the resulting escrowId/txHash to plugins.

For broader interoperability, the repo also includes:
- An Anchor-based Solana program template (`solana-program/`) defining a simple escrow state account with initialize/release/refund flows.
- A TronWeb processor scaffold (`tron-processor/`) that seeds config, health checks, and a placeholder escrow creation endpoint ready to be wired to a deployed Tron contract.

Plugins (e.g., OpenCart, PrestaShop) integrate with the backend to originate escrows, and can target Base or other EVM chains by adjusting processor/backend RPC configuration and token selection per invoice.
