# BulwarkX Contracts

This package contains the smart contracts for BulwarkX:

- `BulwarkXEscrow.sol` – core escrow logic for buyers, merchants, and arbiters.

Use Hardhat + TypeScript for compilation and testing.

## Deploying BulwarkXEscrow to Base Sepolia

1. Install dependencies (inside `/workspaces/bulwarkx/contracts`):

   ```bash
   npm install
   ```

2. Copy `env.example` to `.env` and fill in your Base RPC URL + deployer private key (prefixed with `0x`):

   ```bash
   cp env.example .env
   ```

3. Compile the contracts:

   ```bash
   npx hardhat compile
   ```

4. Deploy `BulwarkXEscrow` to Base Sepolia using the provided script:

   ```bash
   npx hardhat run scripts/deploy-bulwarkx.ts --network baseSepolia
   ```

The deployment script will print the address of the newly deployed `BulwarkXEscrow` instance.
