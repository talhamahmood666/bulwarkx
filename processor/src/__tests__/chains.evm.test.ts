import { getEvmConfigForChain } from '../chains/evm';

describe('getEvmConfigForChain', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.BASE_RPC_URL = 'https://base.test';
    process.env.BASE_ESCROW_ADDRESS = '0xbaseescrow';
    process.env.BASE_PRIVATE_KEY = '0xbasekey';
    process.env.ETHEREUM_RPC_URL = 'https://eth.test';
    process.env.ETHEREUM_ESCROW_ADDRESS = '0xethescrow';
    process.env.ETHEREUM_PRIVATE_KEY = '0xethkey';
    process.env.BSC_RPC_URL = 'https://bsc.test';
    process.env.BSC_ESCROW_ADDRESS = '0xbscEscrow';
    process.env.BSC_PRIVATE_KEY = '0xbsckey';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns Base config with RPC and escrow address', () => {
    const config = getEvmConfigForChain('base');
    expect(config.rpcUrl).toBe('https://base.test');
    expect(config.escrowAddress).toBe('0xbaseescrow');
    expect(config.privateKey).toBe('0xbasekey');
  });

  it('returns Ethereum config when requested', () => {
    const config = getEvmConfigForChain('ethereum');
    expect(config.rpcUrl).toBe('https://eth.test');
    expect(config.escrowAddress).toBe('0xethescrow');
    expect(config.privateKey).toBe('0xethkey');
  });

  it('returns BSC config when requested', () => {
    const config = getEvmConfigForChain('bsc');
    expect(config.rpcUrl).toBe('https://bsc.test');
    expect(config.escrowAddress).toBe('0xbscEscrow');
    expect(config.privateKey).toBe('0xbsckey');
  });

  it('throws for unsupported chains', () => {
    expect(() => getEvmConfigForChain('polygon')).toThrow('Unsupported EVM chain');
  });

  it('throws if required values are missing', () => {
    delete process.env.BASE_RPC_URL;
    expect(() => getEvmConfigForChain('base')).toThrow('Missing configuration for chain');
  });
});
