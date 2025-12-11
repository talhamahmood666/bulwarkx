
BulwarkX Architecture Overview
This document provides a high-level overview of how the BulwarkX system is structured.

Components
Smart Contracts (contracts/)

Escrow contracts that hold user funds in a non-custodial way.

Typically deployed on EVM-compatible networks (starting with Base & Optimism testnets).

Expose functions to create escrows, release funds, refund funds, and involve arbitrators.

Processor Service (processor/)

A backend service that:

Listens to ecommerce events (order created, payment requested, etc.).

Calls the smart contracts to open and manage escrows.

Exposes APIs & webhooks for merchants and plugins.

May persist data (invoices, status, metadata) in a database.

Dashboard (dashboard/)

A frontend where:

Merchants can see escrow statuses and configuration.

Developers can run test flows on testnets.

Future: arbitrators and partners may access certain tools.

Plugins & Integrations (plugins/ or similar)

Platform-specific adapters for:

OpenCart

WooCommerce

Other ecommerce platforms

Translate native order/payment flows into BulwarkX escrow operations.

Arbitrator Network (Concept)

A layer of vetted third-parties that can:

Resolve disputes

Trigger releases or refunds based on evidence

Implemented via additional contracts and/or off-chain coordination with on-chain hooks.

Data Flow (Simplified)

Order is created in an ecommerce platform.

Plugin calls the processor, requesting an escrow for that order.

Processor creates the escrow on-chain via the contracts.

Buyer pays into the escrow (on-chain transaction).

Merchant ships goods / provides services.

If all is well:

Buyer or merchant (depending on flow) confirms, and funds are released from escrow to the merchant.

If there is a problem:

A dispute can be opened, and an arbitrator may intervene according to protocol rules.

Events & statuses are synced back to the ecommerce platform & dashboard.

Non-Custodial Design

The core design principle is that:

BulwarkX never takes custody of user funds.

Funds are always in user-controlled wallets or protocol-controlled smart contracts with clearly defined rules.

Future Directions

More chains and assets

Advanced arbitrator reputation systems

Rich analytics and monitoring (not necessarily open-sourced)

Formal verification and multiple independent audits
