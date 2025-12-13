# BulwarkX SDK (install-free build)

Lightweight, wallet-agnostic helpers for building BulwarkX escrow transaction payloads. The SDK is pure ESM JavaScript with no external runtime dependencies, so it works even in offline or locked CI environments.

## Quickstart (5 minutes)

1. Copy the package (or add as a workspace) and run the built-in scripts:

```bash
cd sdk
npm run build
node --test
```

2. Build a non-custodial escrow payload:

```js
import { BulwarkXClient } from '@bulwarkx/sdk'

const client = new BulwarkXClient({ chainId: 8453, escrowAddress: '0xEscrow...' })
const { escrowId, tx } = client.buildNativeCreateTx({
  orderId: '0x' + 'ab'.repeat(32),
  payer: '0xPayer...',
  payee: '0xPayee...',
  arbiter: '0xArbiter...',
  amountWei: 1_000_000_000_000_000_000n,
  nonce: 1n
})
console.log({ escrowId, tx })
```

3. Send via any signer (ethers, viem, wallet adapters) or pass to a frontend wallet:

```js
await signer.sendTransaction(tx) // ethers/viem compatible shape
```

4. Verify escrow status with a provider:

```js
const record = await client.getEscrow(escrowId)
if (record?.status === 1) {
  console.log('Escrow active!')
}
```

### Processor payloads
If you call the optional BulwarkX processor and receive pre-built payloads, feed them back in:

```js
const fromProcessor = await fetch('https://processor/builder', { method: 'POST', body: JSON.stringify({ /* ... */ }) })
const payload = await fromProcessor.json()
const { escrowId, approveTx, createTx } = client.buildFromProcessorCreate(payload)
```

### Notes
- Default mode is non-custodial: helpers only build transactions; you sign/broadcast externally.
- All validation is lightweight and offline-friendly (no npm installs required).
