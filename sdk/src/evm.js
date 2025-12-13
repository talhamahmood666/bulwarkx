import { keccak256, keccak256Hex } from './keccak.js'

export function isHex(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value)
}

export function strip0x(value) {
  return isHex(value) ? value.slice(2) : value
}

export function add0x(value) {
  return value.startsWith('0x') ? value : `0x${value}`
}

export function pad32(value) {
  const clean = strip0x(value)
  return clean.padStart(64, '0')
}

export function toBigInt(value) {
  const bi = typeof value === 'bigint' ? value : BigInt(value)
  if (bi < 0n) throw new Error('value must be non-negative')
  return bi
}

export function hexToBytes(hex) {
  const clean = strip0x(hex)
  if (clean.length % 2 !== 0) throw new Error('Invalid hex length')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export function utf8ToBytes(str) {
  return new TextEncoder().encode(str)
}

export function abiEncodePacked(types, values) {
  let out = ''
  for (let i = 0; i < types.length; i++) {
    const type = types[i]
    const value = values[i]
    if (type === 'address') {
      const clean = strip0x(value)
      if (clean.length !== 40) throw new Error('Invalid address length')
      out += clean.padStart(40, '0')
    } else if (type === 'bytes32') {
      const clean = strip0x(value)
      if (clean.length !== 64) throw new Error('Invalid bytes32 length')
      out += clean
    } else if (type === 'uint256') {
      const hex = toBigInt(value).toString(16)
      out += hex.padStart(64, '0')
    } else {
      throw new Error(`Unsupported type ${type}`)
    }
  }
  return add0x(out)
}

export function functionSelector(signature) {
  const hash = keccak256(utf8ToBytes(signature))
  return '0x' + strip0x(hash).slice(0, 8)
}

function encodeWord(type, value) {
  if (type === 'address') {
    const clean = strip0x(value)
    if (clean.length !== 40) throw new Error('Invalid address length')
    return pad32(clean)
  }
  if (type === 'bytes32') {
    const clean = strip0x(value)
    if (clean.length !== 64) throw new Error('Invalid bytes32 length')
    return clean
  }
  if (type === 'uint256') {
    const hex = toBigInt(value).toString(16)
    return hex.padStart(64, '0')
  }
  throw new Error(`Unsupported type ${type}`)
}

export function encodeFunctionCall(signature, argTypes, args) {
  const selector = strip0x(functionSelector(signature))
  const words = argTypes.map((type, idx) => encodeWord(type, args[idx]))
  return add0x(selector + words.join(''))
}

export function encodeApprove(spender, amount) {
  return encodeFunctionCall('approve(address,uint256)', ['address', 'uint256'], [spender, amount])
}

export function encodeCreateNativeWithId(orderId, payee, arbiter, amount) {
  const data = encodeFunctionCall('createEscrowWithId(bytes32,address,address,uint256)', ['bytes32', 'address', 'address', 'uint256'], [orderId, payee, arbiter, amount])
  const value = add0x(toBigInt(amount).toString(16))
  return { data, value }
}

export function encodeCreateTokenWithId(orderId, token, payee, arbiter, amount) {
  const data = encodeFunctionCall('createEscrowTokenWithId(bytes32,address,address,address,uint256)', ['bytes32', 'address', 'address', 'address', 'uint256'], [orderId, token, payee, arbiter, amount])
  return { data }
}

export function computeEscrowId(params) {
  const packed = abiEncodePacked(
    ['bytes32', 'address', 'address', 'address', 'uint256', 'uint256'],
    [params.orderId, params.payer, params.payee, params.token, toBigInt(params.amount), toBigInt(params.nonce)]
  )
  return keccak256Hex(packed)
}
