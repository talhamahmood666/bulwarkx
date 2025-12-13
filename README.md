# 🛡️ BulwarkX

**Motto:** *Escrow Without Custody. Commerce Without Fear.*

BulwarkX is a **non-custodial escrow protocol and merchant toolkit** for crypto commerce.  
Funds live inside on-chain escrow contracts and move only via explicit rules: **release**, **refund**, or **arbiter resolution** 🔐

> 🚧 **Status (Dec 13, 2025):** Testnet-first MVP.  
> ⚠️ Not production hardened yet. Reference services currently use in-memory stores.

---

## 📦 What’s in this repo

- 🧠 **EVM Escrow Contracts** (Hardhat, Solidity)  
  - Native ETH escrow + ERC-20 escrow  
  - Dispute flow + arbiter resolution (MVP)
- 🔁 **Processor API (Express)**  
  - Defaults to **non-custodial mode**: returns wallet-ready tx payloads  
  - Optional custodial signer mode (disabled by default)
- 🧰 **SDK (TypeScript)**  
  - Builds deterministic tx payloads and escrowIds
- 🗂️ **Reference backend**  
  - Invoice + order scaffolding (currently in-memory)
- 🖥️ **Dashboard + plugins scaffolds**
- 🌉 **Solana + Tron scaffolds**  
  - Roadmap / grants narrative (not production-ready)

---

## 🌐 Current Testnet Deployment

- 🟦 **Base Sepolia Escrow Contract:**  
  `0xCa97AEAA6055cbA49D8626Ec44eE447c54c43f37`
- 🔍 Explorer:  
  https://sepolia.basescan.org/address/0xca97aeaa6055cba49d8626ec44ee447c54c43f37

---

## 🗺️ Repository structure (actual)

- `contracts/` – 🧾 Hardhat project (BulwarkXEscrow.sol + scripts + tests)
- `processor/` – 🔁 Express API (non-custodial tx payloads by default)
- `backend/` – 🗄️ Invoice/escrow reference layer (in-memory)
- `sdk/` – 🧰 Install-free SDK for generating tx payloads
- `dashboard/` – 🖥️ Frontend scaffold
- `plugins/` – 🔌 E-commerce integration scaffolds
- `docs/` – 📚 Architecture notes
- `solana-program/` – 🌊 Solana scaffold (roadmap)
- `tron-processor/` – 🔴 Tron scaffold (roadmap)

---

## 🔄 How BulwarkX works (chronological)

### 1️⃣ Order is created off-chain
A merchant or store creates an order.  
✅ Recommended: use a **stable `orderId`** (not timestamps).

---

### 2️⃣ Escrow is created + funded on-chain
The buyer funds an escrow on the selected chain and asset.

🔑 **Escrow ID is deterministic**, derived from:
orderId + payer + payee + token + amount + payerNonce

---

### 3️⃣ Optional dispute
Either payer or payee can mark the escrow as **Disputed** ⚖️ while it is funded.

---

### 4️⃣ Resolution paths
- 😊 **Happy path:** payer releases to payee  
- ⏱️ **Auto-release:** payee can release after `autoReleaseAt` if no dispute  
- 🔄 **Refund:** payee can refund while funded  
- 🛡️ **Arbiter resolution:** only arbiter can release/refund during dispute

---

### 5️⃣ Off-chain tracking + callbacks
The processor/backend can store references and trigger callbacks or webhooks 📡

---

## 🚀 Quickstart

### 📋 Prerequisites
- Node.js 18+
- npm / pnpm / yarn
- Funded testnet wallet 💰

---

## A️⃣ Contracts (Hardhat)

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```
🚢 Deploy (Base Sepolia example)
```bash
npx hardhat run scripts/deploy-bulwarkx.ts --network baseSepolia
```
🎬 Demo scripts (Base Sepolia)
# Create escrow (prints escrowId)
```bash
npx hardhat run scripts/demo-escrow.ts --network baseSepolia
```
# Open dispute (optional)
```bash
ESCROW_ID=0xYOUR_ESCROW_ID npx hardhat run scripts/demo-dispute.ts --network baseSepolia
```
# Arbiter resolves
```bash
ESCROW_ID=0xYOUR_ESCROW_ID npx hardhat run scripts/demo-arbiter-release.ts --network baseSepolia
# or
ESCROW_ID=0xYOUR_ESCROW_ID npx hardhat run scripts/demo-arbiter-refund.ts --network baseSepolia
```
# Happy-path release by payer (no dispute)
```bash
ESCROW_ID=0xYOUR_ESCROW_ID npx hardhat run scripts/demo-release.ts --network baseSepolia
```

⚠️ For real integrations, prefer:
createEscrowWithId(...)
createEscrowTokenWithId(...)
over timestamp-derived orderIds.

B️⃣ Processor API (non-custodial by default)
```bash
cd processor
npm install
npm run dev
```

Create processor/.env from processor/env.example:
```bash
RPC_URL=...
ESCROW_CONTRACT=0x...
NON_CUSTODIAL_MODE=true
# Set PRIVATE_KEY locally only when NON_CUSTODIAL_MODE=false
PORT=3000
```
🔌 Key endpoints

POST /escrow/create

POST /escrow/release

POST /escrow/refund

GET /escrow/status/:escrowId

POST /escrow/verify

C️⃣ SDK (generate tx payloads anywhere)
```bash
cd sdk
npm run build
node --test
```

🧠 Designed to produce wallet-ready payloads. No private keys required.

D️⃣ Reference Backend (optional)

Lightweight invoice scaffolding (currently in-memory):
```bash
cd backend
npm install
npm run dev
```
🔐 Security notes 

This repo is an MVP and not production hardened yet.

⚠️ Known considerations:

Non-standard ERC-20s (fee-on-transfer, rebasing)

ETH payouts can fail if recipient contracts revert

In-memory storage (not durable, not multi-instance safe)

CORS is open by default

📧 Responsible disclosure: bulwarkx@proton.me

(See SECURITY.md)

📜 License

MIT © BulwarkX
See LICENSE
