export const ESCROW_ABI = [
  'function createEscrowWithId(bytes32 orderId, address payee, address arbiter, uint256 amount) payable',
  'function createEscrowTokenWithId(bytes32 orderId, address token, address payee, address arbiter, uint256 amount)',
  'function getEscrow(bytes32 escrowId) view returns (tuple(address payer, address payee, address arbiter, address token, uint256 amount, uint8 status, uint256 createdAt, uint256 updatedAt))'
]

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]
