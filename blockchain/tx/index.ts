
export interface TransactionEnvelope<T = any> {
  txId: string;
  payload: T;
  actorGLN: string;
  timestamp: string;
  signature: string;
  metadata: {
    version: string;
    networkId: string;
  };
}

export const createTxEnvelope = async (payload: any, actorGLN: string): Promise<TransactionEnvelope> => {
  const { CryptoUtils } = await import('../crypto');
  const timestamp = new Date().toISOString();
  const txId = await CryptoUtils.hash({ payload, actorGLN, timestamp });
  const signature = await CryptoUtils.sign(payload, actorGLN);

  return {
    txId,
    payload,
    actorGLN,
    timestamp,
    signature,
    metadata: {
      version: '2.0.0',
      networkId: 'eledger-mainnet-p1'
    }
  };
};
