
const { hash } = require('./crypto');

class Block {
  constructor(index, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.merkleRoot = this.calculateMerkleRoot(transactions);
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return hash(
      this.index + 
      this.previousHash + 
      this.timestamp + 
      this.merkleRoot + 
      this.nonce
    );
  }

  calculateMerkleRoot(transactions) {
    if (transactions.length === 0) return hash('empty');
    const hashes = transactions.map(tx => hash(tx));
    // Simple Merkle Root simulation (concat + hash)
    return hash(hashes.join(''));
  }
}

const BlockchainEngine = {
  createGenesisBlock: () => {
    return new Block(0, [{ type: 'GENESIS', message: 'E-Ledger Mainnet Genesis Block' }], '0'.repeat(64));
  },

  validateChain: (chain) => {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // 1. Check if current hash is valid
      if (currentBlock.hash !== currentBlock.calculateHash()) return false;
      
      // 2. Check if linked to previous
      if (currentBlock.previousHash !== previousBlock.hash) return false;
    }
    return true;
  }
};

module.exports = { Block, BlockchainEngine };
