import { config } from 'dotenv'
import { BulwarkXClient } from '@bulwarkx/sdk'
import { JsonRpcProvider, Wallet } from 'ethers'

config()

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var ${name}`)
  }
  return value
}

async function main() {
  const chainId = Number(requireEnv('CHAIN_ID'))
  const escrowAddress = requireEnv('ESCROW_ADDRESS')
  const orderId = requireEnv('ORDER_ID')
  const payer = requireEnv('PAYER')
  const payee = requireEnv('PAYEE')
  const arbiter = requireEnv('ARBITER')
  const amountInput = requireEnv('AMOUNT')
  const token = process.env.TOKEN
  const nonce = process.env.NONCE ?? '0'

  const rpcUrl = process.env.RPC_URL
  const privateKey = process.env.PRIVATE_KEY

  const provider = rpcUrl ? new JsonRpcProvider(rpcUrl) : undefined
  const client = new BulwarkXClient({ chainId, escrowAddress, provider })

  if (token) {
    const { escrowId, approveTx, createTx } = client.buildTokenCreateTx({
      orderId,
      payer,
      payee,
      arbiter,
      token,
      amount: amountInput,
      nonce
    })
    console.log('EscrowId:', escrowId)
    console.log('Approve payload:', JSON.stringify(approveTx, null, 2))
    console.log('Create payload:', JSON.stringify(createTx, null, 2))

    if (provider && privateKey) {
      const signer = new Wallet(privateKey, provider)
      console.log('Sending approve...')
      const approveRes = await client.sendTx(signer, approveTx)
      console.log('Approve tx hash:', approveRes.hash)
      console.log('Sending create...')
      const createRes = await client.sendTx(signer, createTx)
      console.log('Create tx hash:', createRes.hash)
    }
  } else {
    const { escrowId, tx } = client.buildNativeCreateTx({
      orderId,
      payer,
      payee,
      arbiter,
      amountWei: amountInput,
      nonce
    })
    console.log('EscrowId:', escrowId)
    console.log('Create payload:', JSON.stringify(tx, null, 2))

    if (provider && privateKey) {
      const signer = new Wallet(privateKey, provider)
      console.log('Sending create...')
      const res = await client.sendTx(signer, tx)
      console.log('Create tx hash:', res.hash)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
