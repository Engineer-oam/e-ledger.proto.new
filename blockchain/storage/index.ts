
import { Block } from '../block';

const STORAGE_KEY = 'eledger_blockchain_chain';

export const BlockchainStorage = {
  saveChain: (blocks: Block[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  },

  getChain: (): Block[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  appendBlock: (block: Block): void => {
    const chain = BlockchainStorage.getChain();
    chain.push(block);
    BlockchainStorage.saveChain(chain);
  },

  getLastBlock: (): Block | null => {
    const chain = BlockchainStorage.getChain();
    return chain.length > 0 ? chain[chain.length - 1] : null;
  }
};
