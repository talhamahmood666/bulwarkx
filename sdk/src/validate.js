import { CHAINS } from './chains.js'
import { isHex } from './evm.js'

export function assertAddress(value, label = 'address') {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`Invalid ${label}`)
  }
  return value
}

export function assertBytes32(value, label = 'bytes32') {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`Invalid ${label}`)
  }
  return value
}

export function assertChainId(value) {
  if (typeof value !== 'number' || !CHAINS[value]) {
    throw new Error('Unsupported chainId')
  }
  return value
}

export function assertUint(value, label = 'value') {
  try {
    const bi = BigInt(value)
    if (bi < 0n) throw new Error('negative')
    return bi
  } catch (err) {
    throw new Error(`Invalid ${label}`)
  }
}

export function assertHex(value, label = 'hex') {
  if (!isHex(value)) throw new Error(`Invalid ${label}`)
  return value
}
