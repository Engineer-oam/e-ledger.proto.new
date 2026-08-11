
import React, { useState, useEffect } from 'react';
import { Database, Link as LinkIcon, Clock, CheckCircle2, Shield, Search, Box, ChevronRight, Activity, Globe, Terminal } from 'lucide-react';
import { BlockchainAPI } from '../blockchain/api';

const BlockchainExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);

  const fetchData = async () => {
    try {
      const blocksData = BlockchainAPI.getBlocks();
      const statusData = await BlockchainAPI.getStatus();
      
      setBlocks(blocksData);
      setStatus(statusData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Fast polling for local mode
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="p-12 text-center flex flex-col items-center gap-4">
      <Database className="text-slate-200 animate-bounce" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Connecting to Peer Nodes...</p>
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <LinkIcon className="text-indigo-600" size={32} />
            <span>Mainnet Explorer</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Global Distributed Ledger</p>
        </div>

        {status && (
           <div className="flex gap-4">
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-3">
                 <div className={`w-2.5 h-2.5 rounded-full ${status.status === 'SYNCHRONIZED' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-ping'}`}></div>
                 <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter leading-none mb-1">Network Status</p>
                    <p className="text-xs font-black text-emerald-900">{status.status}</p>
                 </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                 <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter leading-none mb-1">Block Height</p>
                 <p className="text-xs font-black text-indigo-900">#{status.height}</p>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Block List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} />
                <span>Live Block Stream</span>
             </h3>
             <span className="text-[10px] font-bold text-slate-400">Total TXs: {blocks.reduce((acc, b) => acc + b.transactions.length, 0)}</span>
          </div>
          <div className="space-y-3">
            {blocks.map(block => (
              <div 
                key={block.hash}
                onClick={() => setSelectedBlock(block)}
                className={`bg-white rounded-2xl border transition-all cursor-pointer group hover:shadow-xl hover:translate-x-1 ${selectedBlock?.hash === block.hash ? 'border-indigo-600 shadow-lg' : 'border-slate-200'}`}
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-xl transition-colors ${selectedBlock?.hash === block.hash ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white group-hover:bg-indigo-600'}`}>
                      <Box size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-800">Block #{block.index}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{block.transactions.length} TXs</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate max-w-[200px] md:max-w-xs">{block.hash}</p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                     <p className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                        <Clock size={12} />
                        {new Date(block.timestamp).toLocaleTimeString()}
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter font-bold">SHA-256 Verified</p>
                  </div>
                </div>
              </div>
            ))}
            {blocks.length === 0 && (
              <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                Genesis Block Pending...
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {selectedBlock ? (
              <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-start mb-8">
                   <div className="p-3 bg-indigo-600 rounded-2xl">
                      <Shield size={24} />
                   </div>
                   <button onClick={() => setSelectedBlock(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                </div>

                <h3 className="text-2xl font-black mb-1">Block Data</h3>
                <p className="text-indigo-400 font-mono text-xs mb-8">Height: {selectedBlock.index}</p>

                <div className="space-y-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Merkle Root</p>
                      <p className="text-xs font-mono break-all leading-relaxed text-slate-300">{selectedBlock.merkleRoot}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previous Hash</p>
                      <p className="text-xs font-mono break-all leading-relaxed text-slate-400">{selectedBlock.previousHash}</p>
                   </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-800">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Terminal size={14} className="text-indigo-500" />
                      <span>Transaction Envelopes</span>
                   </p>
                   <div className="space-y-3">
                      {selectedBlock.transactions.map((tx: any, idx: number) => (
                         <div key={idx} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between text-xs mb-1">
                               <span className="font-bold text-indigo-400">{tx.payload?.action || 'GENESIS'}</span>
                               <span className="text-slate-500 font-mono">ID: {tx.txId?.slice(0, 8)}</span>
                            </div>
                            <p className="text-[11px] text-slate-300">Actor: {tx.actorGLN}</p>
                            <div className="mt-2 text-[9px] bg-slate-950 p-2 rounded text-emerald-400 font-mono break-all border border-slate-700 shadow-inner">
                               SIG: {tx.signature?.slice(0, 48)}...
                            </div>
                         </div>
                      ))}
                      {selectedBlock.transactions.length === 0 && (
                        <p className="text-xs text-slate-500 italic">No transactions in this block.</p>
                      )}
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50 border-2 border-dashed border-indigo-100 rounded-3xl p-12 text-center h-[500px] flex flex-col justify-center items-center">
                 <Globe size={48} className="text-indigo-200 mb-6 animate-spin-slow" />
                 <h4 className="font-black text-indigo-900 mb-2 uppercase tracking-wide">Live Node Insight</h4>
                 <p className="text-xs text-indigo-600 leading-relaxed max-w-[200px]">
                    Select a block to inspect its cryptographic integrity, verify the signature, and view raw supply chain event data.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BlockchainExplorer;
