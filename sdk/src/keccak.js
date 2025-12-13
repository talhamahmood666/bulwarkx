import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Keccak = require('../../contracts/node_modules/keccak')

function toBuffer(input) {
  return Buffer.from(input)
}

export function keccak256(bytes) {
  const k = new Keccak('keccak256')
  k.update(toBuffer(bytes))
  return '0x' + k.digest('hex')
}

export function keccak256Hex(hexString) {
  const clean = hexString.startsWith('0x') ? hexString.slice(2) : hexString
  if (clean.length % 2 !== 0) throw new Error('invalid hex input length')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return keccak256(bytes)
}

export function keccak256Utf8(str) {
  const encoder = new TextEncoder()
  return keccak256(encoder.encode(str))
}
