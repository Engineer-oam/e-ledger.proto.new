
export const CryptoUtils = {
  /**
   * Generates a SHA-256 hash of the input string or object.
   */
  hash: async (data: any): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Deterministic Signature Simulation (Ed25519 placeholder).
   * In a real permissioned environment, this would interface with a PKI or hardware wallet.
   */
  sign: async (data: any, actorGLN: string): Promise<string> => {
    const content = JSON.stringify(data);
    const signatureBase = `${actorGLN}:${content}:v1`;
    // For MVP/Demo, we generate a unique cryptographic seal based on the payload and identity
    return CryptoUtils.hash(signatureBase);
  },

  /**
   * Verifies the cryptographic seal.
   */
  verify: async (data: any, signature: string, actorGLN: string): Promise<boolean> => {
    const expected = await CryptoUtils.sign(data, actorGLN);
    return expected === signature;
  }
};
