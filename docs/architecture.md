# BulwarkX Architecture Overview

This document summarizes the on-chain and off-chain components that make up BulwarkX and how they now extend across multiple chains and token types.

## Components

### Smart Contracts (`contracts/`)
- **BulwarkXEscrow.sol** supports both native gas tokens (ETH) and ERC-20 tokens (e.g., USDT/USDC). Escrows can be created for either asset class, released to merchants, refunded to payers, or marked disputed with arbiter authority.
- **MockToken.sol** provides a local ERC-20 for tests and demos.
- **Hardhat config** now includes Base, Ethereum Sepolia, Polygon Amoy, BNB Testnet, Arbitrum Sepolia, and Optimism Sepolia network targets for deployments.

### Processor Service (`processor/`)
- Express + ethers service that brokers requests from plugins/backends to the EVM contracts.
- Route handlers create native or token escrows by routing to `createEscrow` vs. `createEscrowToken`. Token flows assume the payer has approved the processor signer to transfer the ERC-20 amount.
- Emits JSON responses with escrow IDs and transaction hashes; designed to be called by backend APIs and ecommerce plugins.

### Backend (`backend/`)
- REST API surface that fronts the processor. Endpoints under `/api/invoices` and `/api/escrows` translate web requests into processor calls for contract interactions.

### Plugins (`plugins/`)
- OpenCart and PrestaShop reference integrations that call into the backend/processor to request escrows for ecommerce orders.

### Solana Program Template (`solana-program/`)
- Anchor-compatible scaffold with `bulwarkx_escrow` program ID placeholder (`BulwarkXEscrow1111111111111111111111111111111`).
- Defines an `Escrow` account, creation instruction, and stubbed release/refund handlers ready for SPL token wiring.
- Intended for grants and roadmap visibility as BulwarkX expands beyond EVM chains.

### Tron Processor Scaffold (`tron-processor/`)
- Express + TronWeb service with configurable full/solidity/event nodes and private key.
- Exposes `/tron/escrow/create` to call a future Tron-compatible escrow contract (TRC20/USDT-centric), returning the transaction payload.
- Provides CORS+JSON middleware and health endpoint for quick integration tests.

## Data Flow (Simplified)
1. Order is created in an ecommerce platform.
2. Plugin calls the backend, which forwards to the processor.
3. Processor selects the correct chain/token path and calls the EVM escrow contract (`createEscrow` for ETH, `createEscrowToken` for ERC-20).
4. Funds are locked on-chain; events return escrow IDs to the backend/dashboard.
5. Release/refund/dispute actions are initiated by the payer/merchant or arbiter, updating on-chain status and propagating back to off-chain services.

## Non-Custodial Design
- Funds remain in smart contracts; BulwarkX services never take custody.
- Role checks enforce payer/payee/arbiter permissions, and disputes require arbiter action for token or native refunds/releases.

## Future Directions
- Production-ready Solana program with SPL token settlement.
- Tron escrow contract to pair with the Tron processor scaffold.
- Additional EVM deployments and stablecoin integrations alongside formal audits.
