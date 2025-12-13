import BulwarkXEscrow from '../BulwarkXEscrow.json';

type MockedEthers = typeof import('ethers') & { __mockContractInstance: any };

describe('escrow.service', () => {
  let ethers: MockedEthers;
  let mockContractInstance: any;
  let createEscrow: typeof import('../services/escrow.service').createEscrow;
  let releaseEscrow: typeof import('../services/escrow.service').releaseEscrow;
  let refundEscrow: typeof import('../services/escrow.service').refundEscrow;
  let configSpy: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    mockContractInstance = {
      createEscrow: jest.fn(),
      createEscrowToken: jest.fn(),
      releaseEscrow: jest.fn(),
      refundEscrow: jest.fn(),
      interface: { parseLog: jest.fn() },
    };

    jest.doMock('ethers', () => {
      const actual = jest.requireActual('ethers');
      return {
        ...actual,
        Contract: jest.fn(() => mockContractInstance),
        JsonRpcProvider: jest.fn(() => ({})),
        Wallet: jest.fn((_key: string, _provider: any) => ({ signer: true })),
        __mockContractInstance: mockContractInstance,
      };
    });

    jest.doMock('../chains/evm', () => {
      const originalModule = jest.requireActual('../chains/evm');
      const mockGetEvmConfigForChain = jest.fn((_chain?: string) => ({
        rpcUrl: 'https://base.test',
        escrowAddress: '0xbaseescrow',
        privateKey: '0xbasekey',
      }));

      return {
        ...originalModule,
        getEvmConfigForChain: mockGetEvmConfigForChain,
        getEscrowContractForChain: jest.fn((_chain: string, abi: any) => {
          const ethersModule = require('ethers') as MockedEthers;
          const { escrowAddress } = mockGetEvmConfigForChain(_chain);
          return new ethersModule.Contract(escrowAddress, abi, {} as any);
        }),
      };
    });

    ethers = require('ethers') as MockedEthers;
    const evm = require('../chains/evm');
    const service = require('../services/escrow.service');

    createEscrow = service.createEscrow;
    releaseEscrow = service.releaseEscrow;
    refundEscrow = service.refundEscrow;
    configSpy = evm.getEvmConfigForChain as jest.Mock;
  });

  function setupNativeEscrowMocks() {
    const tx = {
      hash: '0xtxhash',
      wait: jest.fn().mockResolvedValue({
        hash: '0xtxhash',
        logs: [{ data: '0x01' }],
      }),
    };
    ethers.__mockContractInstance.createEscrow.mockResolvedValue(tx);
    ethers.__mockContractInstance.interface.parseLog.mockReturnValue({
      name: 'EscrowCreated',
      args: { escrowId: '0xescrow' },
    });
    return tx;
  }

  function setupTokenEscrowMocks() {
    const tx = {
      hash: '0xtokentx',
      wait: jest.fn().mockResolvedValue({ hash: '0xtokentx', logs: [] }),
    };
    ethers.__mockContractInstance.createEscrowToken.mockResolvedValue(tx);
    return tx;
  }

  it('createEscrow calls EVM contract with correct params for native payments', async () => {
    const tx = setupNativeEscrowMocks();

    const result = await createEscrow({
      chain: 'base',
      payee: '0xpayee',
      arbiter: '0xarbiter',
      amount: '1.5',
    });

    expect(configSpy).toHaveBeenCalledWith('base');
    expect(ethers.Contract).toHaveBeenCalledWith(
      '0xbaseescrow',
      BulwarkXEscrow.abi,
      expect.any(Object)
    );
    expect(ethers.__mockContractInstance.createEscrow).toHaveBeenCalledWith(
      '0xpayee',
      '0xarbiter',
      3600,
      expect.objectContaining({ value: expect.any(BigInt) })
    );
    expect(tx.wait).toHaveBeenCalled();
    expect(result).toEqual({ escrowId: '0xescrow', txHash: '0xtxhash' });
  });

  it('createEscrow calls token-based flow when tokenAddress is provided', async () => {
    const tx = setupTokenEscrowMocks();

    const result = await createEscrow({
      chain: 'base',
      payee: '0xpayee',
      arbiter: '0xarbiter',
      amount: 5n,
      tokenAddress: '0xtoken',
      autoReleaseSeconds: 900,
    });

    expect(ethers.__mockContractInstance.createEscrowToken).toHaveBeenCalledWith(
      '0xpayee',
      '0xarbiter',
      '0xtoken',
      5n,
      900
    );
    expect(result).toEqual({ escrowId: undefined, txHash: '0xtokentx' });
    expect(tx.wait).toHaveBeenCalled();
  });

  it('releaseEscrow calls release on correct chain contract', async () => {
    const tx = { hash: '0xrelease', wait: jest.fn().mockResolvedValue({ hash: '0xrelease' }) };
    ethers.__mockContractInstance.releaseEscrow.mockResolvedValue(tx);

    const result = await releaseEscrow('base', '0xescrow');

    expect(configSpy).toHaveBeenCalledWith('base');
    expect(ethers.__mockContractInstance.releaseEscrow).toHaveBeenCalledWith('0xescrow');
    expect(result).toEqual({ txHash: '0xrelease' });
  });

  it('refundEscrow calls refund on correct chain contract', async () => {
    const tx = { hash: '0xrefund', wait: jest.fn().mockResolvedValue({ hash: '0xrefund' }) };
    ethers.__mockContractInstance.refundEscrow.mockResolvedValue(tx);

    const result = await refundEscrow('base', '0xescrow');

    expect(configSpy).toHaveBeenCalledWith('base');
    expect(ethers.__mockContractInstance.refundEscrow).toHaveBeenCalledWith('0xescrow');
    expect(result).toEqual({ txHash: '0xrefund' });
  });

  it('propagates RPC/contract errors for createEscrow', async () => {
    ethers.__mockContractInstance.createEscrow.mockRejectedValue(new Error('network down'));

    await expect(
      createEscrow({ chain: 'base', payee: '0xpayee', arbiter: '0xarbiter', amount: '1' })
    ).rejects.toThrow('network down');
  });

  it('propagates errors for releaseEscrow failures', async () => {
    ethers.__mockContractInstance.releaseEscrow.mockRejectedValue(new Error('cannot release'));

    await expect(releaseEscrow('base', '0xescrow')).rejects.toThrow('cannot release');
  });
});
