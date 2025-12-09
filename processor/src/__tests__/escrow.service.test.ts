jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  const mockContractInstance = {
    createEscrow: jest.fn(),
    createEscrowToken: jest.fn(),
    releaseEscrow: jest.fn(),
    refundEscrow: jest.fn(),
    interface: { parseLog: jest.fn() },
  };

  return {
    ...actual,
    Contract: jest.fn(() => mockContractInstance),
    JsonRpcProvider: jest.fn(() => ({})),
    Wallet: jest.fn((_key: string, _provider: any) => ({ signer: true })),
    __mockContractInstance: mockContractInstance,
  };
});

type MockedEthers = typeof import('ethers') & { __mockContractInstance: any };

import { createEscrow, refundEscrow, releaseEscrow } from '../services/escrow.service';
import BulwarkXEscrow from '../BulwarkXEscrow.json';
import { getEvmConfigForChain } from '../chains/evm';

jest.mock('../chains/evm', () => {
  const originalModule = jest.requireActual('../chains/evm');
  return {
    ...originalModule,
    getEvmConfigForChain: jest.fn(() => ({
      rpcUrl: 'https://base.test',
      escrowAddress: '0xbaseescrow',
      privateKey: '0xbasekey',
    })),
  };
});

describe('escrow.service', () => {
  const ethers = require('ethers') as MockedEthers;
  const configSpy = getEvmConfigForChain as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupCreateEscrowMocks() {
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

  it('createEscrow calls EVM contract with correct params', async () => {
    const tx = setupCreateEscrowMocks();

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

  it('handles RPC/contract errors gracefully', async () => {
    ethers.__mockContractInstance.createEscrow.mockRejectedValue(
      new Error('network down')
    );

    await expect(
      createEscrow({ chain: 'base', payee: '0xpayee', arbiter: '0xarbiter', amount: '1' })
    ).rejects.toThrow('network down');
  });
});
