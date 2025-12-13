/** @typedef {string} Address */

/**
 * @typedef {Object} TxRequestPayload
 * @property {Address} to
 * @property {string} data
 * @property {string} [value]
 * @property {number} [chainId]
 */

/**
 * @typedef {Object} TwoStepTxPayload
 * @property {TxRequestPayload} [approve]
 * @property {TxRequestPayload} create
 */

export const EscrowStatus = Object.freeze({
  Uninitialized: 0,
  Active: 1,
  Released: 2,
  Refunded: 3,
  Disputed: 4
})

/**
 * @typedef {Object} EscrowRecord
 * @property {Address} payer
 * @property {Address} payee
 * @property {Address} arbiter
 * @property {Address} token
 * @property {bigint} amount
 * @property {number} status
 * @property {bigint} createdAt
 * @property {bigint} updatedAt
 */
