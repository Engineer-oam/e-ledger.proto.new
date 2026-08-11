
const crypto = require('crypto');

/**
 * SHA-256 Hashing for Blocks and Transactions
 */
const hash = (data) => {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Ed25519 Signing (Simulated using key derivation from GLN for MVP)
 * In production, this would use the actor's private key stored in a HSM/Vault.
 */
const sign = (data, gln) => {
  // Simulate private key derivation from GLN
  const privateKey = crypto.createHash('sha256').update(gln + 'system_salt').digest();
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(data)), {
    key: crypto.createPrivateKey({
      key: privateKey,
      format: 'der',
      type: 'pkcs8',
    }),
  });
  return signature.toString('hex');
};

const verify = (data, signature, publicKey) => {
  try {
    return crypto.verify(
      null,
      Buffer.from(JSON.stringify(data)),
      publicKey,
      Buffer.from(signature, 'hex')
    );
  } catch (e) {
    return false;
  }
};

module.exports = { hash, sign, verify };
