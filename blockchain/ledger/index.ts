
import { Block, BlockFactory } from '../block';
import { TransactionEnvelope, createTxEnvelope } from '../tx';
import { BlockchainStorage } from '../storage';

export const LedgerEngine = {
  /**
   * Initializes the ledger if empty by creating a genesis block.
   */
  initialize: async () => {
    if (BlockchainStorage.getChain().length === 0) {
      const genesis = await BlockFactory.createGenesisBlock();
      BlockchainStorage.appendBlock(genesis);
    }
  },

  /**
   * Submits a validated transaction to the immutable blockchain.
   */
  submitTransaction: async (data: any, actorGLN: string): Promise<string> => {
    await LedgerEngine.initialize();
    
    // 1. Convert to cryptographically signed envelope
    const envelope = await createTxEnvelope(data, actorGLN);
    
    // 2. Prepare new block (Immediate minting for MVP)
    const lastBlock = BlockchainStorage.getLastBlock()!;
    const newBlock = await BlockFactory.createBlock(
      lastBlock.index + 1,
      [envelope],
      lastBlock.hash
    );

    // 3. Store immutably
    BlockchainStorage.appendBlock(newBlock);
    return newBlock.hash;
  },

  /**
   * Verifies the entire chain for cryptographic tampering.
   */
  verifyIntegrity: async (): Promise<{ valid: boolean; errorIndex?: number }> => {
    const chain = BlockchainStorage.getChain();
    const { CryptoUtils } = await import('../crypto');

    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      const previous = chain[i - 1];

      // Verify block link
      if (current.previousHash !== previous.hash) return { valid: false, errorIndex: i };

      // Verify block hash
      const blockData = { 
        index: current.index, 
        timestamp: current.timestamp, 
        merkleRoot: current.merkleRoot, 
        previousHash: current.previousHash, 
        nonce: current.nonce 
      };
      const recalculatedHash = await CryptoUtils.hash(blockData);
      if (recalculatedHash !== current.hash) return { valid: false, errorIndex: i };
    }

    return { valid: true };
  }
};
