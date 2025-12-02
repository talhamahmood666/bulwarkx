# BulwarkX

BulwarkX is a **non-custodial crypto escrow payment gateway** for e-commerce.

- 🔐 Non-custodial smart contract escrow (on-chain, no custody)
- 🧾 Invoices & payment links for merchants
- 🛒 Integrations with WooCommerce (first), Shopify, OpenCart, Magento
- ⚖️ Escrow with buyer protection, disputes, and arbiter flows

## Repo Structure

- `contracts/` – Solidity smart contracts (EVM escrow)
- `backend/` – Node.js (TypeScript) API & escrow engine
- `dashboard/` – Next.js React dashboard for merchants
- `plugins/woocommerce/` – BulwarkX WooCommerce payment gateway
- `docs/` – Product spec, architecture, API docs, tokenomics, roadmap

This repo is designed to be used with **ChatGPT Codex** as an AI pair programmer.
Codex can work on each subfolder independently, with clear separation of concerns.
