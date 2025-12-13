import { computeEscrowId, encodeApprove, encodeCreateNativeWithId, encodeCreateTokenWithId, encodeFunctionCall, strip0x, add0x } from './evm.js'
import { EscrowStatus } from './types.js'
import { assertAddress, assertBytes32, assertChainId, assertUint } from './validate.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export class BulwarkXClient {
  constructor(options) {
    const { chainId, escrowAddress, provider, processorUrl } = options
    assertChainId(chainId)
    assertAddress(escrowAddress, 'escrowAddress')
    this.chainId = chainId
    this.escrowAddress = escrowAddress
    this.provider = provider
    this.processorUrl = processorUrl
  }

  buildNativeCreateTx(params) {
    const { orderId, payer, payee, arbiter, amountWei, nonce } = params
    assertBytes32(orderId, 'orderId')
    assertAddress(payer, 'payer')
    assertAddress(payee, 'payee')
    assertAddress(arbiter, 'arbiter')
    const amount = assertUint(amountWei, 'amountWei')
    const escrowId = computeEscrowId({ orderId, payer, payee, token: ZERO_ADDRESS, amount, nonce })
    const { data, value } = encodeCreateNativeWithId(orderId, payee, arbiter, amount)
    return {
      escrowId,
      tx: { to: this.escrowAddress, data, value, chainId: this.chainId }
    }
  }

  buildTokenCreateTx(params) {
    const { orderId, payer, payee, arbiter, token, amount, nonce } = params
    assertBytes32(orderId, 'orderId')
    assertAddress(payer, 'payer')
    assertAddress(payee, 'payee')
    assertAddress(arbiter, 'arbiter')
    assertAddress(token, 'token')
    const amt = assertUint(amount, 'amount')
    const escrowId = computeEscrowId({ orderId, payer, payee, token, amount: amt, nonce })
    const approveData = encodeApprove(this.escrowAddress, amt)
    const createCall = encodeCreateTokenWithId(orderId, token, payee, arbiter, amt)
    return {
      escrowId,
      approveTx: { to: token, data: approveData, chainId: this.chainId },
      createTx: { to: this.escrowAddress, data: createCall.data, chainId: this.chainId }
    }
  }

  buildFromProcessorCreate(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Invalid processor payload')
    const escrowId = assertBytes32(payload.escrowId || payload.id || payload.escrowID || payload.escrow_id, 'escrowId')
    const create = payload.create || payload.createTx || payload.tx
    if (!create) throw new Error('Missing create tx')
    const createTx = { to: assertAddress(create.to || this.escrowAddress, 'create.to'), data: create.data, value: create.value, chainId: this.chainId }
    const approve = payload.approve || payload.approveTx
    const approveTx = approve
      ? { to: assertAddress(approve.to, 'approve.to'), data: approve.data, value: approve.value, chainId: this.chainId }
      : undefined
    return { escrowId, approveTx, createTx }
  }

  async getEscrow(escrowId) {
    if (!this.provider) throw new Error('provider required')
    assertBytes32(escrowId, 'escrowId')
    const data = encodeFunctionCall('getEscrow(bytes32)', ['bytes32'], [escrowId])
    const result = await this.provider.call({ to: this.escrowAddress, data })
    if (result === '0x') return undefined
    const words = strip0x(result)
    const parts = []
    for (let i = 0; i < words.length; i += 64) {
      parts.push(words.slice(i, i + 64))
    }
    if (parts.length < 8) return undefined
    const toAddress = (hex) => add0x(hex.slice(24))
    return {
      payer: toAddress(parts[0]),
      payee: toAddress(parts[1]),
      arbiter: toAddress(parts[2]),
      token: toAddress(parts[3]),
      amount: BigInt('0x' + parts[4]),
      status: Number.parseInt(parts[5], 16),
      createdAt: BigInt('0x' + parts[6]),
      updatedAt: BigInt('0x' + parts[7])
    }
  }

  async verifyEscrowActive(escrowId) {
    const record = await this.getEscrow(escrowId)
    if (!record) return { ok: false }
    return { ok: record.status === EscrowStatus.Active, escrow: record }
  }

  async waitForEscrowCreated(escrowId, confirmations = 1, timeoutMs = 120000, intervalMs = 3000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const record = await this.getEscrow(escrowId)
      if (record && record.status !== EscrowStatus.Uninitialized) {
        return record
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    throw new Error('Timed out waiting for escrow creation')
  }

  async sendTx(signer, tx) {
    if (!signer || typeof signer.sendTransaction !== 'function') throw new Error('signer with sendTransaction required')
    return signer.sendTransaction({ to: tx.to, data: tx.data, value: tx.value })
  }

  async createNativeViaSigner(params, signer) {
    const { escrowId, tx } = this.buildNativeCreateTx(params)
    const res = await this.sendTx(signer, tx)
    return { escrowId, response: res }
  }

  async createTokenViaSigner(params, signer) {
    const { escrowId, approveTx, createTx } = this.buildTokenCreateTx(params)
    const approveResponse = await this.sendTx(signer, approveTx)
    const createResponse = await this.sendTx(signer, createTx)
    return { escrowId, approveResponse, createResponse }
  }
}
