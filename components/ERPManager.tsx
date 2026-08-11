
import React, { useState, useEffect } from 'react';
import { User, ERPType } from '../types';
import { Cpu, RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon, Database, Terminal, FileJson, Clock, Wifi, WifiOff, Settings, Save, ChevronRight, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { ERPService } from '../services/erpService';

interface ERPManagerProps {
  user: User;
}

const ERPManager: React.FC<ERPManagerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'CONFIG'>('STATUS');
  const [syncing, setSyncing] = useState(false);
  const [checkingConn, setCheckingConn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'PENDING'>(user.erpStatus || 'PENDING');
  const [logs, setLogs] = useState<any[]>([]);
  
  // Config state
  const [selectedErp, setSelectedErp] = useState<ERPType>(user.erpType);
  const [endpoint, setEndpoint] = useState(`https://api.erp.corp/v1/adapter/${user.gln}`);

  useEffect(() => {
    // Generate dummy logs
    setLogs([
      { id: 1, type: 'FETCH', event: 'New Batch in SAP', status: 'SUCCESS', time: '2 mins ago' },
      { id: 2, type: 'PUBLISH', event: 'Dispatch Event to E-Ledger', status: 'SUCCESS', time: '5 mins ago' },
      { id: 3, type: 'FETCH', event: 'Invoice #123 generated', status: 'SUCCESS', time: '12 mins ago' },
    ]);
  }, []);

  const handleManualSync = () => {
    setSyncing(true);
    toast.info(`Scanning ${user.erpType} for new transactions...`);
    setTimeout(() => {
      setSyncing(false);
      toast.success("ERP Synchronization Complete. 2 New events recorded.");
      setLogs(prev => [
        { id: Date.now(), type: 'FETCH', event: 'Sync Manual Trigger', status: 'SUCCESS', time: 'Just now' },
        ...prev
      ]);
    }, 2000);
  };

  const handleCheckConnection = async () => {
    setCheckingConn(true);
    try {
      const status = await ERPService.checkConnection(user);
      setConnectionStatus(status);
      if (status === 'CONNECTED') {
        toast.success(`Securely connected to ${selectedErp} Gateway`);
      } else {
        toast.error(`Failed to reach ${selectedErp} endpoint`);
      }
    } catch (e) {
      setConnectionStatus('DISCONNECTED');
      toast.error("ERP Network failure");
    } finally {
      setCheckingConn(false);
    }
  };

  const handleSaveConfig = () => {
    toast.success("ERP configuration updated. Reconnecting...");
    handleCheckConnection();
    setActiveTab('STATUS');
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ERP Integration</h2>
          <p className="text-slate-500 text-sm">Adapter status and synchronization health</p>
        </div>
        
        <div className="flex gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setActiveTab('STATUS')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'STATUS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Live Status
                </button>
                <button 
                  onClick={() => setActiveTab('CONFIG')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'CONFIG' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Configuration
                </button>
            </div>
            
            {activeTab === 'STATUS' && (
                <button 
                onClick={handleManualSync}
                disabled={syncing || checkingConn}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Force Sync</span>
                </button>
            )}
        </div>
      </div>

      {activeTab === 'STATUS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Connection Status Card */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                    <div className="p-3 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-900/10">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{user.erpType}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ADAPTER v3.4.1</p>
                    </div>
                </div>
                
                <div className="space-y-4 flex-1">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Connection Status</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                <span className={`font-bold ${connectionStatus === 'CONNECTED' ? 'text-emerald-700' : connectionStatus === 'PENDING' ? 'text-amber-700' : 'text-red-700'}`}>
                                    {connectionStatus}
                                </span>
                            </div>
                            <button 
                            onClick={handleCheckConnection}
                            disabled={checkingConn}
                            className="text-[10px] bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 font-bold uppercase tracking-tighter flex items-center gap-1 transition-colors"
                            >
                            {checkingConn ? <RefreshCw size={10} className="animate-spin" /> : <Wifi size={10} />}
                            Verify
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Gateway Instance</p>
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 truncate bg-white p-2 rounded-lg border border-slate-100">
                            <LinkIcon size={12} className="text-slate-400" />
                            <span className="truncate">{endpoint}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                        <span>Success Rate</span>
                        <span className="text-emerald-600">99.8%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[99.8%]"></div>
                    </div>
                </div>
            </div>

            {/* Integration Logs */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Terminal size={18} className="text-slate-400" />
                        <span>Live Adapter Stream</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Auto-Refresh: ON
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-96 min-h-[300px]">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-6 py-3 font-bold">Event Log</th>
                                <th className="px-6 py-3 font-bold">Operation</th>
                                <th className="px-6 py-3 font-bold text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded group-hover:bg-white transition-colors">
                                                <FileJson size={14} className="text-slate-400" />
                                            </div>
                                            <span className="font-medium text-slate-700">{log.event}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                            log.type === 'FETCH' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-[11px] text-slate-400 flex items-center justify-end gap-1 font-medium">
                                        <Clock size={12} />
                                        {log.time}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] h-28 overflow-hidden shadow-inner leading-relaxed">
                    <p className="opacity-60">&gt; Starting ERP background worker v3.4.1...</p>
                    <p className="opacity-70">&gt; Auth: {user.gln} validated against E-Ledger Mainnet.</p>
                    <p className="opacity-80">&gt; Polling {selectedErp} instance at {new URL(endpoint).hostname}...</p>
                    <p className="font-bold">&gt; Heartbeat OK. Listening for EPCIS 2.0 Inbound Events.</p>
                    <p className="animate-pulse">&gt; _</p>
                </div>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right-8 duration-300">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Settings size={20} className="text-indigo-600" />
                    Adapter Configuration
                </h3>
                <p className="text-sm text-slate-500 mt-1">Select your enterprise system and configure the communication layer.</p>
            </div>
            
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Target ERP System</label>
                        <div className="grid grid-cols-1 gap-3">
                            {Object.values(ERPType).map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setSelectedErp(type)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedErp === type ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/5' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${selectedErp === type ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                        <span className={`font-bold text-sm ${selectedErp === type ? 'text-indigo-900' : 'text-slate-600'}`}>{type}</span>
                                    </div>
                                    {selectedErp === type && <Check size={18} className="text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">API Gateway Endpoint</label>
                            <div className="relative">
                                <LinkIcon size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                <input 
                                    type="text"
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800 leading-relaxed font-medium uppercase tracking-tight">
                                    Ensure the adapter is whitelisted for GLN: {user.gln} on your local firewall before attempting connection.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sync Frequency</label>
                            <select className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option>Real-time (EPCIS Webhooks)</option>
                                <option>Every 5 minutes (Polling)</option>
                                <option>Hourly Batch Process</option>
                                <option>Daily Reconciliation</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-8 border-t border-slate-50">
                    <button 
                        onClick={() => setActiveTab('STATUS')}
                        className="px-6 py-3 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button 
                        onClick={handleSaveConfig}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/10 active:scale-95"
                    >
                        <Save size={18} />
                        <span>Apply Configuration</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ERPManager;
