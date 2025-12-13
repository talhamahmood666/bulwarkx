import assert from 'node:assert/strict'
import test from 'node:test'
import { computeEscrowId, encodeApprove, encodeCreateNativeWithId, encodeCreateTokenWithId, functionSelector } from '../src/evm.js'

const orderId = '0x' + 'ab'.repeat(32)
const payer = '0x' + '12'.repeat(20)
const payee = '0x' + '34'.repeat(20)
const arbiter = '0x' + '56'.repeat(20)
const token = '0x' + '78'.repeat(20)

const baseEscrowConfig = {
  orderId,
  payer,
  payee,
  token: '0x0000000000000000000000000000000000000000',
  amount: 1234n,
  nonce: 7n,
}

const expectedEscrowId = computeEscrowId(baseEscrowConfig)

await test('deterministic escrow id', () => {
  const derived = computeEscrowId(baseEscrowConfig)
  assert.equal(derived, expectedEscrowId)
})

await test('function selectors match expected', () => {
  assert.equal(functionSelector('approve(address,uint256)'), '0x095ea7b3')
  assert.equal(functionSelector('createEscrowWithId(bytes32,address,address,uint256)'), '0xb198071a')
  assert.equal(functionSelector('createEscrowTokenWithId(bytes32,address,address,address,uint256)'), '0xb18b5fb7')
})

await test('native create calldata includes selector and value', () => {
  const amount = 1000000000000000000n
  const { data, value } = encodeCreateNativeWithId(orderId, payee, arbiter, amount)
  assert.ok(data.startsWith('0xb198071a'))
  assert.equal(BigInt(value), amount)
  assert.equal(data.length, 2 + 8 + 64 * 4)
})

await test('token approve + create calldata', () => {
  const approveData = encodeApprove(payee, 500n)
  assert.ok(approveData.startsWith('0x095ea7b3'))

  const { data } = encodeCreateTokenWithId(orderId, token, payee, arbiter, 500n)
  assert.ok(data.startsWith('0xb18b5fb7'))
  assert.equal(data.length, 2 + 8 + 64 * 5)
})
