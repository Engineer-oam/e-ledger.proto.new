
import { LedgerEngine } from '../ledger';
import { BlockchainStorage } from '../storage';

export const BlockchainAPI = {
  submit: async (txData: any, actorGLN: string) => {
    return await LedgerEngine.submitTransaction(txData, actorGLN);
  },

  getBlocks: () => {
    return BlockchainStorage.getChain().reverse();
  },

  getStatus: async () => {
    const chain = BlockchainStorage.getChain();
    const integrity = await LedgerEngine.verifyIntegrity();
    return {
      network: 'E-Ledger Permissioned Mainnet',
      height: chain.length,
      status: integrity.valid ? 'SYNCHRONIZED' : 'TAMPERED',
      lastBlock: chain.length > 0 ? chain[chain.length - 1].hash : null
    };
  }
};
