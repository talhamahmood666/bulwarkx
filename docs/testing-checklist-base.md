# Base Testing Checklist

## Smart Contract – Hardhat (Base-focused)
- [ ] Create escrow with native token (Base ETH)
- [ ] Create escrow with ERC20 token (e.g., USDC/USDT)
- [ ] Release escrow to payee (payer/authorized path)
- [ ] Refund escrow to payer (arbiter/payee path)
- [ ] Unauthorized release/refund attempts revert
- [ ] Edge cases revert (zero amount, bad escrowId, double release/refund)

## Processor – Jest
- [ ] Correct chain selection (Base, Ethereum, BSC) via env config
- [ ] Escrow creation uses correct contract + arguments
- [ ] Release/refund call the correct chain contract functions
- [ ] RPC/contract errors handled gracefully without crashes

## End-to-End (manual outline)
- [ ] Buyer checkout funds escrow on Base Sepolia
- [ ] Merchant releases escrow and payee receives funds
- [ ] Dispute triggers refund flow and payer receives funds
