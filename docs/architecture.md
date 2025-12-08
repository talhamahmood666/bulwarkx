# BulwarkX Architecture

## Overview
BulwarkX is built around the `BulwarkXEscrow` smart contract deployed to EVM networks, including Base Sepolia for testnet flows and Base Mainnet for production. The contract enforces the escrow lifecycle between payer, payee, and arbiter.

## Services
- **Processor** (TypeScript/Express): connects directly to the blockchain via configured RPC (`RPC_URL`/`PRIVATE_KEY`) and interacts with the `BulwarkXEscrow` contract (`ESCROW_CONTRACT`). It exposes HTTP endpoints such as `/escrow/create` and `/escrow/status/:id` that wrap contract calls.
- **Backend API**: serves business endpoints (e.g., `/api/invoices`) and forwards escrow-related actions to the processor service. Invoice creation creates an off-chain record and requests the processor to open a corresponding on-chain escrow.
- **Plugins**: e-commerce integrations (OpenCart / PrestaShop / WooCommerce) communicate with the backend API to create invoices and read escrow status.

Hardhat network entries for Base Sepolia and Base Mainnet, plus processor RPC configuration, enable deployments and testing on Base networks.
