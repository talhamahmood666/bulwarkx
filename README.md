# BulwarkX – Multichain Non-Custodial Escrow Protocol

BulwarkX is a chain-agnostic, non-custodial escrow settlement protocol designed to enable trust-minimized payments for ecommerce, freelancers, marketplaces, and onchain businesses.

It provides:
- A clean and composable escrow smart contract  
- Developer-friendly APIs  
- E-commerce plugins (Shopify / WooCommerce)  
- Automatic dispute → arbiter → release pipeline  
- Support for any EVM chain  

BulwarkX solves a global problem: **safe online transactions without middlemen**.

---

## 1. Why BulwarkX?

Most online commerce relies on trusting payment intermediaries (PayPal, Stripe, marketplaces).  
Crypto solves custody but not trust between buyer and seller.

BulwarkX provides:
- Trustless escrow  
- Dispute resolution  
- Instant global settlement  
- APIs for builders  
- Multichain deployment  

It is designed to become the escrow layer for onchain commerce.

---

## 2. Multichain Architecture

Works on any EVM chain:

### Supported today
- Base  
- Ethereum  
- BNB Chain  
- Polygon  
- Avalanche  

### Upcoming
- Optimism  
- Arbitrum  
- Solana (via Anchor adapter)  
- Tron (via wrapper processor)  

Processor dynamically selects chains through a unified configuration.

---

## 3. Optimized for Base (First Deployment)

Base is the first chain where BulwarkX is fully deployed and tested end-to-end.

Reasons for choosing Base:
- Low fees  
- Coinbase-powered distribution  
- Strong builder ecosystem  
- Ideal for consumer payments  

---

## 4. Deployment (Base Sepolia)

**BulwarkXEscrow contract:**

0xCa97AEAA6055cbA49D8626Ec44eE447c54c43f37


Explorer:  
https://sepolia.basescan.org/address/0xCa97AEAA6055cbA49D8626Ec44eE447c54c43f37

Upcoming deployments:
- Ethereum testnet  
- BNB Chain testnet  
- Polygon Amoy  
- Optimism Sepolia  

Mainnet rollouts follow after audit.

---

## 5. Escrow Lifecycle Demo (On-chain)

### Escrow #1 – Create → Release  
- Create: `0x158d30b3dbcde16b90bc915933be57f3224196cb44318611cf743f57e4862f68`  
- Release: `0xd407fecbc130ff4ec22d80a06065c43ae1fd3a6f6aa80b808aa8a7438d3045ff`

### Escrow #2 – Create → Refund  
- Create2: `0xbf279d037769deaf243e2ec4d348890172e2f251a78bde5ee13ed7cadbc2e1f0`  
- Refund: `0x9e93a97e8de83e5be51d87ea69f4b39411d3ac6c4461d94b6583076aa898a066`

These transactions confirm core protocol functionality on Base.

---

## 6. Contract Features

### Core
- Create escrow with ETH or ERC20  
- Auto-release timer  
- Refund flow  
- Arbiter-controlled disputes  
- Immutable, non-custodial logic  

### Planned
- USDC / USDbC stablecoin vaults  
- Multi-escrow batching  
- Invoice linking  
- zk-proof-based dispute outcomes  

---

## 7. Processor Backend

Located in `/processor`.

Provides:
- REST API endpoints  
- Chain selection  
- Contract call abstraction  
- Webhook callbacks  

Jest tests verify:
- Chain selection  
- Escrow actions  
- RPC error handling  

---

## 8. Developer Setup

Install
cd contracts
npm install

Compile
npx hardhat compile

Test Contracts
npx hardhat test

Test Processor
cd ../processor
npm install
npm test

## 9. Deploy (Any Chain)
Configure .env
RPC_URL=<rpc>
DEPLOYER_PRIVATE_KEY=<private_key>

Deploy
npx hardhat run scripts/deploy-bulwarkx.ts --network <chain>

## 10. Roadmap
# Phase 1 – Base

Testnet + mainnet launch

Merchant dashboard

Shopify + WooCommerce plugins

# Phase 2 – Multichain Expansion

Deploy to Ethereum, BNB, Polygon, Optimism

Stablecoin support (USDC, USDT)

Fiat on/off-ramp integrations

# Phase 3 – Global Arbitrator Network

Reputation system

Delegated resolution markets

Tokenized staking for arbitrators

## 11. Vision

BulwarkX becomes the default escrow infrastructure for the onchain economy.

Across all chains.
Across all use cases.
Fully open-source.
Fully decentralized.

## 12. License

MIT
