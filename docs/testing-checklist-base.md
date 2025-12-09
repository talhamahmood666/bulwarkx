# BulwarkX – Base Testing Checklist

## Smart Contracts (Hardhat – /contracts)

- [x] Compile contracts with Hardhat
- [x] Create escrow with native token (Base ETH)
- [x] Create escrow with ERC20 token (USDT/USDC-style)
- [x] Release escrow to payee (happy path)
- [x] Refund escrow to payer (dispute / cancel)
- [x] Dispute + arbiter resolution (release)
- [x] Dispute + arbiter resolution (refund)
- [x] Prevent unauthorized release/refund
- [x] Reject zero-amount escrows
- [x] Reject non-existent escrow IDs
- [x] Prevent double-release / double-refund

**Run:**

```bash
cd contracts
npx hardhat test
```
