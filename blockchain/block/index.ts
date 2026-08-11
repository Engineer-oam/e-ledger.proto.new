
import { TransactionEnvelope } from '../tx';
import { CryptoUtils } from '../crypto';

export interface Block {
  index: number;
  timestamp: string;
  transactions: TransactionEnvelope[];
  previousHash: string;
  merkleRoot: string;
  hash: string;
  nonce: number;
}

export const BlockFactory = {
  calculateMerkleRoot: async (transactions: TransactionEnvelope[]): Promise<string> => {
    if (transactions.length === 0) return '0'.repeat(64);
    const hashes = await Promise.all(transactions.map(tx => CryptoUtils.hash(tx.txId)));
    // For MVP, we use a simple concatenation of hashes
    return CryptoUtils.hash(hashes.join(''));
  },

  createBlock: async (index: number, transactions: TransactionEnvelope[], previousHash: string): Promise<Block> => {
    const timestamp = new Date().toISOString();
    const merkleRoot = await BlockFactory.calculateMerkleRoot(transactions);
    const nonce = 0;
    
    const blockData = { index, timestamp, merkleRoot, previousHash, nonce };
    const hash = await CryptoUtils.hash(blockData);

    return {
      index,
      timestamp,
      transactions,
      previousHash,
      merkleRoot,
      hash,
      nonce
    };
  },

  createGenesisBlock: async (): Promise<Block> => {
    return BlockFactory.createBlock(0, [], '0'.repeat(64));
  }
};
