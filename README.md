# BulwarkX

**Our Motto** Escrow Without Custody. Commerce Without Fear.

BulwarkX is a **non-custodial, multi-chain escrow protocol and merchant SDK** designed for crypto commerce.
It lets buyers, sellers, and arbitrators coordinate trustlessly on-chain while funds remain in smart contracts the protocol does **not** control.

BulwarkX now supports native ETH and ERC-20 tokens (USDT/USDC-style) across Base, Ethereum Sepolia, Polygon Amoy, BNB Testnet, Arbitrum Sepolia, and Optimism Sepolia. Solana and Tron scaffolds live in this repo to showcase the expansion roadmap for grants and partners.

> Built first for the Superchain (Base & Optimism), with a roadmap to expand across EVM chains and other ecosystems.

---

## 🧱 What BulwarkX Is

- **Non-custodial escrow protocol**  
  Funds are locked in audited smart contracts; neither BulwarkX nor any centralized party can unilaterally take custody.

- **Merchant-first SDK & plugins**  
  Drop-in integrations for ecommerce platforms (e.g. OpenCart, WooCommerce, custom stores) so merchants can accept crypto with escrow protection.

- **Arbitrator network design**  
  A pluggable “Bulwark Arbitrator Network” where vetted third-parties can resolve disputes and earn fees.

- **Grant-aligned public good**  
  The protocol is designed as open infrastructure for safer on-chain commerce, aligned with the missions of Base, Optimism, and the broader Superchain.

---

## 🏗 Repository Structure

> Note: The exact folders may differ slightly depending on the current state of the repo. This is the intended high-level layout.

- `contracts/`  
  Solidity smart contracts for the BulwarkX escrow protocol, written for Hardhat.  
  - Core escrow contracts (e.g., `BulwarkXEscrow.sol`)  
  - ERC20 support (USDT, USDC, & other tokens)  
  - Deployment scripts and configuration

- `processor/`  
  Backend service (TypeScript/Node/Express) that:
  - Talks to the escrow contracts on-chain
  - Exposes REST/webhook endpoints for ecommerce platforms
  - Persists invoice and escrow references in a database
  - Defaults to **non-custodial mode**, returning transaction payloads for buyer wallets to sign

- `dashboard/`  
  Frontend (e.g., Next.js/React) for:  
  - Viewing escrow status  
  - Merchant configuration  
  - Debugging and testnet demos

- `plugins/` or `integrations/`  
  Platform-specific code such as:  
  - OpenCart payment extension  
  - WooCommerce plugin  
  - Other merchant adapters

- `docs/`  
  Additional documentation and architecture details.

---

## ✨ Key Features

- **Non-custodial escrow for crypto payments**
- **Native + ERC-20 assets** with release, refund, and dispute handling on-chain
- **Multi-chain readiness** for Base, Ethereum Sepolia, Polygon Amoy, BNB Testnet, Arbitrum Sepolia, and Optimism Sepolia
- **Processor + backend routing** to create ETH or token escrows via REST
- **Solana Anchor template** and **Tron processor scaffold** to extend beyond EVM
- **Merchant SDK & plugins** with webhooks and invoice tracking through the processor service
- **Designed for grant programs & public-good ecosystems**

---

## 🔗 Current Testnet Deployment


- **Network:** Base Sepolia
- **Escrow Contract:** `0xCa97AEAA6055cbA49D8626Ec44eE447c54c43f37`
- **Block Explorer:** [https://sepolia.basescan.org/address/0x...](https://sepolia.basescan.org/address/0xca97aeaa6055cba49d8626ec44ee447c54c43f37)
- **Example Tx:** [https://sepolia.basescan.org/tx/0x...](https://sepolia.basescan.org/address/0xca97aeaa6055cba49d8626ec44ee447c54c43f37)

Hardhat is preconfigured for Ethereum Sepolia, Polygon Amoy, BNB Testnet, Arbitrum Sepolia, and Optimism Sepolia so the same escrow contract can be deployed across ecosystems.

This section should be updated as new testnets or mainnets are deployed.

---

## ⚡ 2-Minute Base Sepolia Demo (Non-Custodial Escrow Lifecycle)

This demo shows the full lifecycle of a BulwarkX escrow on Base Sepolia, using non-custodial transactions.
The processor / scripts do not custody funds — the user wallet signs and submits transactions.

Prerequisites

Node.js 18+

Funded Base Sepolia wallet

RPC access (default public RPC works)

1️⃣ Deploy the Escrow Contract
```bash
cd contracts
npx hardhat run scripts/deploy-bulwarkx.ts --network baseSepolia
```

Output:

Escrow contract address

Deployer (payer) address

2️⃣ Create a Native ETH Escrow (Wallet-Signed)

This creates an escrow with a deterministic escrowId derived from:
orderId + payer nonce.
```bash

npx hardhat run scripts/demo-escrow.ts --network baseSepolia
```

What happens:

Script prints a wallet-ready transaction payload

Script optionally broadcasts the transaction

Escrow is created on-chain

Output includes:

orderId

nonce

escrowId

Basescan transaction link

3️⃣ (Optional) Raise a Dispute

Either party can flag a dispute before settlement.

```bash
ESCROW_ID=0xYOUR_ESCROW_ID \
npx hardhat run scripts/demo-dispute.ts --network baseSepolia
```

Result:

Escrow status updates to Disputed

Arbiter is now authorized to resolve

4️⃣ Arbiter Resolution (Two Paths)
A) Arbiter releases funds to payee
```bash
ESCROW_ID=0xYOUR_ESCROW_ID \
npx hardhat run scripts/demo-arbiter-release.ts --network baseSepolia
```
B) Arbiter refunds payer
```bash
ESCROW_ID=0xYOUR_ESCROW_ID \
npx hardhat run scripts/demo-arbiter-refund.ts --network baseSepolia
```
5️⃣ Happy-Path Release (No Dispute)

If no dispute occurs, payer can directly release:
```bash
ESCROW_ID=0xYOUR_ESCROW_ID \
npx hardhat run scripts/demo-release.ts --network baseSepolia
```
6️⃣ On-Chain Verification

Each script reads the escrow mapping after execution and prints:

payer

payee

arbiter

token (address(0) for native ETH)

amount

timestamps

status enum

This proves:

Funds were never custodied

State transitions are enforced on-chain

Arbiter powers are constrained by the contract

🛡️ Security Notes

Escrow contract uses ReentrancyGuard

Deterministic escrow IDs prevent overwrites

Native and ERC-20 flows share the same safety model

Processor defaults to non-custodial mode

🌍 Why Base / OP Stack

BulwarkX is designed for:

Low-cost dispute resolution

High-volume commerce

L2-native UX with L1-grade security

Base Sepolia is used here for demonstration; the same flow applies to Base Mainnet and OP Stack chains.

---

## 🚀 Getting Started (Local Dev)

### Prerequisites

- Node.js (LTS)
- pnpm or npm or yarn
- Git
- A testnet RPC endpoint (Base Sepolia, Optimism Sepolia, etc.)
- A funded testnet wallet for deployments

### 1. Clone the repository

```bash
git clone https://github.com/your-org/bulwarkx.git
cd bulwarkx
```

### 2. Install dependencies
If you are using workspaces/monorepo:

```bash
# Example; adjust to your package manager
pnpm install
# or
npm install
```
### 3. Environment variables
Create .env or service-specific env files as needed, based on the existing .env.example (if present).

Important:

## 🧰 TypeScript SDK (non-custodial)

Need to generate escrow transactions without sharing private keys? Use the install-free SDK under `/sdk` (no registry fetches required):

```bash
cd sdk
npm run build
node --test
```

Example: build a native escrow payload and hand it to any signer (ethers/viem/wallet adapters):

```js
import { BulwarkXClient } from '@bulwarkx/sdk'

const client = new BulwarkXClient({
  chainId: Number(process.env.CHAIN_ID),
  escrowAddress: process.env.ESCROW_ADDRESS
})

const { escrowId, tx } = client.buildNativeCreateTx({
  orderId: process.env.ORDER_ID,
  payer: process.env.PAYER,
  payee: process.env.PAYEE,
  arbiter: process.env.ARBITER,
  amountWei: process.env.AMOUNT,
  nonce: 0
})

await signer.sendTransaction(tx)
```

The SDK defaults to **non-custodial** mode (it only returns payloads). For a full quickstart and processor-backed flows, see [`/sdk/README.md`](sdk/README.md) and the runnable sample at [`/examples/sdk-demo`](examples/sdk-demo). If you prefer using ethers or viem, pull them in on the consumer side; the SDK itself has no external dependencies.

Never commit real private keys or secrets.

Use placeholder/test keys only in examples.

Typical variables might include:

```bash

RPC_URL_BASE_SEPOLIA=https://...
WALLET_PRIVATE_KEY=0x... # required only when NON_CUSTODIAL_MODE=false
NON_CUSTODIAL_MODE=true   # default; set to false to let the processor sign
DATABASE_URL=postgres://...
API_KEY=...
```
### 4. Contracts: compile & test
```bash

cd contracts
npm install        # if needed
npx hardhat compile
npx hardhat test
```
### 5. Deploy to Base Sepolia (example)
```bash

npx hardhat run scripts/deploy.ts --network baseSepolia
```
Update the “Current Testnet Deployment” section above with your deployed addresses.

### 6. Run the processor service (backend)
```bash

cd ../processor
npm install
npm run dev
```
This exposes local API endpoints for creating escrows, checking status, and handling callbacks. In the default
**non-custodial mode** the `/escrow/create` route returns transaction payloads (`to`, `data`, `value`, `chainId`) for
wallets to sign and broadcast. ERC-20 flows return an approval + create payload pair. Set `NON_CUSTODIAL_MODE=false`
to re-enable legacy server-signer behavior (requires `PRIVATE_KEY`).

### 7. Run the dashboard (frontend, if present)
```bash

cd ../dashboard
npm install
npm run dev
```
Then open the indicated URL (typically http://localhost:3000) in your browser.

## 🧩 Merchant SDK & Integration (Conceptual)
The exact API surface may differ; this is illustrative. Consult the processor and sdk code for the full, up-to-date interface.

Example TypeScript usage:
```bash

import { createEscrow } from "@bulwarkx/sdk";

const escrow = await createEscrow({
  buyerAddress: "0xBuyer...",
  merchantAddress: "0xMerchant...",
  tokenAddress: "0xStablecoin...",
  amount: "1000000", // token units
  orderId: "ORDER-123",
  chain: "base-sepolia",
});
```
In an ecommerce plugin, this would typically run on the server side after an order is created, and the returned escrow ID / payment URL would be shown to the user.

## 🧑‍⚖️ Bulwark Arbitrator Network (Design Overview)
The Bulwark Arbitrator Network is an opt-in layer of human or organizational arbitrators who can:

Resolve disputes if they arise between buyer and merchant

Trigger refunds or releases based on evidence

Earn a small fee per resolved case

The design aims for:

Transparent, on-chain actions

Reputation-based selection

Neutral incentives aligned with honest resolution

Optional usage by merchants or categories of merchants

Implementation details may be in separate contracts and docs.

## 🛡 Security & Responsible Disclosure
Security is critical to BulwarkX.

Do not use this code in production with real funds unless you understand the risks.

Always deploy behind audits, internal reviews, and testnets.

If you discover a vulnerability, please email:

### Security contact: bulwarkx@proton.me

Include, at minimum:

#### A detailed description of the issue

#### Steps to reproduce

#### Potential impact

#### Any suggested fixes

### Please avoid filing public GitHub issues for severe security problems until we have had a chance to investigate and patch.

### See SECURITY.md for more.

## 📜 License
This repository is licensed under the MIT License unless otherwise stated.
See LICENSE for details.

## 🤝 Contributing
Contributions are welcome!

Ways to help:

File issues for bugs, missing docs, or feature requests

Improve documentation and examples

Add tests for critical flows

Help integrate BulwarkX with more ecommerce platforms

Please read CONTRIBUTING.md before opening a PR.

## 🌍 Ecosystem & Grants

BulwarkX is designed as public-good infrastructure for on-chain commerce:

Safer crypto payments for buyers & merchants

Reduced fraud for high-value items (like mining hardware)

Open, forkable contracts and SDKs

We aim to align with and contribute to:

Base ecosystem (Superchain)

Optimism & OP Stack

Other EVM ecosystems interested in non-custodial escrow

If you are a grant reviewer, partner, or collaborator, feel free to open an issue or reach out for:

Demo calls

Integration discussions

Security review coordination

## ⚠️ What is not open sourced

For security and business reasons, certain things are intentionally not in this public repo:

Production infrastructure configs (servers, DNS, firewalls)

Secrets or API keys

Internal monitoring and analytics tooling

Private operational scripts for payouts or fee routing

Business agreements and proprietary scoring logic (for arbitrators, risk systems, etc.)

This repository focuses on the core protocol, contracts, SDK, and reference implementations.

## 🧭 Roadmap (High-Level)

 Additional EVM chain deployments

 More stablecoin integrations

 Expanded ecommerce plugins (Shopify, etc.)

 Formal arbitrator reputation system

 Full audits and bug bounty programs

 Production-ready dashboards & merchant tooling

Stay tuned and consider following the project on social media or GitHub stars to support the development.
