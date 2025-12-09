import type { getEvmConfigForChain as GetConfigFn } from '../chains/evm';

describe('getEvmConfigForChain', () => {
  const originalEnv = process.env;
  let getEvmConfigForChain: typeof GetConfigFn;

  async function loadWithEnv(envOverrides: NodeJS.ProcessEnv) {
    jest.resetModules();
    process.env = { ...originalEnv, ...envOverrides } as NodeJS.ProcessEnv;
    ({ getEvmConfigForChain } = await import('../chains/evm'));
  }

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns Base config with RPC and escrow address', async () => {
    await loadWithEnv({
      BASE_RPC_URL: 'https://base.test',
      BASE_ESCROW_ADDRESS: '0xbaseescrow',
      BASE_PRIVATE_KEY: '0xbasekey',
    });

    const config = getEvmConfigForChain('base');
    expect(config.rpcUrl).toBe('https://base.test');
    expect(config.escrowAddress).toBe('0xbaseescrow');
    expect(config.privateKey).toBe('0xbasekey');
  });

  it('returns Ethereum config when requested', async () => {
    await loadWithEnv({
      ETHEREUM_RPC_URL: 'https://eth.test',
      ETHEREUM_ESCROW_ADDRESS: '0xethescrow',
      ETHEREUM_PRIVATE_KEY: '0xethkey',
    });

    const config = getEvmConfigForChain('ethereum');
    expect(config.rpcUrl).toBe('https://eth.test');
    expect(config.escrowAddress).toBe('0xethescrow');
    expect(config.privateKey).toBe('0xethkey');
  });

  it('returns BSC config when requested', async () => {
    await loadWithEnv({
      BSC_RPC_URL: 'https://bsc.test',
      BSC_ESCROW_ADDRESS: '0xbscEscrow',
      BSC_PRIVATE_KEY: '0xbsckey',
    });

    const config = getEvmConfigForChain('bsc');
    expect(config.rpcUrl).toBe('https://bsc.test');
    expect(config.escrowAddress).toBe('0xbscEscrow');
    expect(config.privateKey).toBe('0xbsckey');
  });

  it('falls back to shared env vars for Base when chain-specific values are missing', async () => {
    await loadWithEnv({
      RPC_URL: 'https://fallback-rpc.test',
      ESCROW_CONTRACT: '0xfallbackescrow',
      PRIVATE_KEY: '0xfallbackkey',
    });

    const config = getEvmConfigForChain('base');
    expect(config.rpcUrl).toBe('https://fallback-rpc.test');
    expect(config.escrowAddress).toBe('0xfallbackescrow');
    expect(config.privateKey).toBe('0xfallbackkey');
  });

  it('throws for unsupported chains', async () => {
    await loadWithEnv({ RPC_URL: 'https://fallback-rpc.test', ESCROW_CONTRACT: '0xfallback' });
    expect(() => getEvmConfigForChain('polygon')).toThrow('Unsupported EVM chain');
  });

  it('throws if required values are missing', async () => {
    await loadWithEnv({});
    expect(() => getEvmConfigForChain('base')).toThrow('Missing configuration for chain');
  });
});
