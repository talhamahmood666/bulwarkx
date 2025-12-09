🚧 BulwarkX – Universal Non-Custodial Escrow Protocol
Multi-Chain Crypto Escrow for E-Commerce, Marketplaces & Payment Infrastructure

Supports: Ethereum • Base • BNB Chain • Polygon • Avalanche • Arbitrum • Optimism • Solana • Tron

🧩 Overview

BulwarkX is a trustless, non-custodial escrow protocol designed for e-commerce platforms, merchants, freelancers, agencies, and marketplaces. It allows buyers and sellers to transact safely using cryptocurrency, with disputes resolved by a decentralized Bulwark Arbitrator Network.

BulwarkX integrates directly into:

🛒 OpenCart

🛒 WooCommerce / WordPress

🛒 Shopify (coming soon)

📦 Custom payment flows via API

🌐 Multichain Support
Chain	Status	Native + Tokens
Base	✅ Live	ETH, USDC
Ethereum	✅ Live	ETH, USDT, USDC
BNB Chain	✅ Live	BNB, BUSD, ERC20
Polygon	Ready	MATIC, USDC
Arbitrum / Optimism	Ready	ETH, ERC20
Avalanche	Ready	AVAX
Solana	Beta	SPL escrow program (Anchor)
Tron	Beta	TRX + TRC20 escrow via TronWeb
🔐 Smart Contract Features
EVM Escrow (Solidity)

createEscrow(address payee, address token, uint256 amount)

release(uint256 escrowId)

refund(uint256 escrowId)

Supports:

ETH / native tokens

ERC20: USDT, USDC

Immutable escrow records

Arbitrator override logic

Event-driven processor indexing

Solana Escrow (Anchor Program)

PDA-based vault authority

SPL token support

On-chain dispute state machine

Fast settlement (<1s finality)

Tron Escrow (TronWeb Node Service)

TRX & TRC20 supported

Signed transactions via merchant node

Escrow stored in a vault contract

🧱 Repository Structure
bulwarkx/
│── contracts/
│   ├── evm/
│   │    └── BulwarkXEscrow.sol
│   ├── solana/
│   │    └── programs/bulwarkx_escrow/
│   └── tron/
│        └── BulwarkXTronEscrow.sol
│
│── processor/
│   ├── src/
│   │   ├── chains/
│   │   │   ├── evm.ts
│   │   │   ├── solana.ts
│   │   │   └── tron.ts
│   │   ├── routes/
│   │   │   ├── invoice.routes.ts
│   │   │   └── escrow.routes.ts
│   │   ├── services/
│   │   │   ├── escrow.service.ts
│   │   │   └── invoice.service.ts
│   │   └── index.ts
│   └── package.json
│
│── plugins/
│   ├── opencart/
│   └── woocommerce/
│
│── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── arbitrator-network.md
│   └── deployment.md
│
└── README.md

🧰 Installation
1. Clone the repo
git clone https://github.com/<your>/bulwarkx.git
cd bulwarkx

2. Install Hardhat dependencies
cd contracts/evm
npm install

3. Install processor dependencies
cd ../../processor
npm install

⚙️ Environment Variables

Create .env inside /processor:

# --- BASE ---
BASE_RPC_URL=
BASE_PRIVATE_KEY=
BASE_ESCROW_ADDRESS=

# --- ETHEREUM ---
ETH_RPC_URL=
ETH_PRIVATE_KEY=
ETH_ESCROW_ADDRESS=

# --- BNB CHAIN ---
BSC_RPC_URL=
BSC_PRIVATE_KEY=
BSC_ESCROW_ADDRESS=

# --- SOLANA ---
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_KEYPAIR=./keys/solana.json

# --- TRON ---
TRON_PRIVATE_KEY=
TRON_FULLNODE=https://api.trongrid.io
TRON_ESCROW_ADDRESS=

# --- BACKEND ---
PORT=8080
DATABASE_URL=

🚀 Deploying EVM Contracts
Compile
npx hardhat compile

Deploy to Base Sepolia:
npx hardhat run scripts/deploy.ts --network baseSepolia

Deploy to Ethereum:
npx hardhat run scripts/deploy.ts --network ethereum

Deploy to BNB Chain:
npx hardhat run scripts/deploy.ts --network bsc


After deployment, update .env with the new escrow contract addresses.

⚡ Deploying Solana (Anchor)
Build
cd contracts/solana
anchor build

Deploy
anchor deploy


Store the program ID inside .env:

SOLANA_PROGRAM_ID=

⚡ Deploying Tron

TronWeb contract deployment script:

node scripts/deployTron.js


Update:

TRON_ESCROW_ADDRESS=

🏗️ Processor API Endpoints
Create Invoice
POST /api/invoice/create
{
  "orderId": "123",
  "amount": "49.99",
  "currency": "USDT",
  "chain": "base"
}

Create Escrow
POST /api/escrow/create
{
  "orderId": "123",
  "payee": "0xabc...",
  "token": "0xUSDT...",
  "amount": 1000000,
  "chain": "ethereum"
}

Release Escrow
POST /api/escrow/release

Refund Escrow
POST /api/escrow/refund


Documentation: docs/api.md

🛒 E-commerce Integrations
OpenCart Plugin Flow

Customer selects BulwarkX Crypto Escrow

Order sent to processor

Processor generates:

Plisio invoice

On-chain BulwarkX escrow

Customer pays

Escrow locked

Merchant releases funds when satisfied

WooCommerce Plugin Flow

Identical flow using WP REST hooks.

🛡️ Bulwark Arbitrator Network

Full design in docs/arbitrator-network.md:

Arbitrators stake $BULWARK tokens

They earn:

dispute fees

arbitration rewards

Multi-sig controlled appeals

Reputation scoring

Incentive-slashing for dishonest rulings

🧪 Testing (Base-focused)

Run contract and processor tests locally:

- `cd contracts && npx hardhat test`
- `cd processor && npm test`

See `docs/testing-checklist-base.md` for the detailed Base coverage list.

📐 Architecture Diagram
Customer → Website → BulwarkX Processor → Blockchain (Escrow Contract)
                      ↓
                 Database (Invoices, Escrows)
                      ↓
               Merchant Dashboard


Multichain flow:

Processor
 ├── EVM (ethers.js)
 ├── Solana (Anchor + web3.js)
 └── Tron (TronWeb)

📹 Demo Video

Upload 1-minute demo → link in Base Grant form:

docs/demo.mp4

🧾 License

MIT License © BulwarkX
