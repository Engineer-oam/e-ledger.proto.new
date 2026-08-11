
const { hash, sign } = require('./crypto');
const { Block, BlockchainEngine } = require('./core');

const registerBlockchainRoutes = (app, db) => {
  
  // 1. GET ALL BLOCKS (Explorer)
  app.get('/api/blockchain/blocks', (req, res) => {
    db.all('SELECT * FROM blockchain_blocks ORDER BY index_no DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const blocks = rows.map(r => ({
        ...r,
        transactions: JSON.parse(r.transactions || '[]')
      }));
      res.json(blocks);
    });
  });

  // 2. GET CHAIN STATUS
  app.get('/api/blockchain/status', (req, res) => {
    db.get('SELECT COUNT(*) as count, MAX(index_no) as height FROM blockchain_blocks', [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        network: 'E-Ledger Mainnet v2.0',
        height: row.count || 0,
        status: 'SYNCHRONIZED',
        consensus: 'POA (Proof of Authority)'
      });
    });
  });

  // 3. INTERNAL HELPER: APPEND TRANSACTION
  // This is called by the main server handlers
  app.blockchain_submit = async (txData, actorGLN) => {
    return new Promise((resolve, reject) => {
      // Create Transaction Envelope
      const envelope = {
        payload: txData,
        actor: actorGLN,
        timestamp: new Date().toISOString(),
        txId: hash(JSON.stringify(txData) + Date.now()),
        signature: sign(txData, actorGLN) // Cryptographic seal
      };

      // Get last block to link
      db.get('SELECT * FROM blockchain_blocks ORDER BY index_no DESC LIMIT 1', [], (err, lastBlock) => {
        const index = lastBlock ? lastBlock.index_no + 1 : 0;
        const prevHash = lastBlock ? lastBlock.hash : '0'.repeat(64);
        
        const newBlock = new Block(index, [envelope], prevHash);

        db.run(
          `INSERT INTO blockchain_blocks (index_no, timestamp, transactions, previousHash, hash, merkleRoot)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newBlock.index, newBlock.timestamp, JSON.stringify(newBlock.transactions), newBlock.previousHash, newBlock.hash, newBlock.merkleRoot],
          (err) => {
            if (err) reject(err);
            else resolve(newBlock.hash);
          }
        );
      });
    });
  };
};

module.exports = { registerBlockchainRoutes };
