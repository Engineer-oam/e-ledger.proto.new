import React, { useState, useEffect } from 'react';
import { User, EngagementLetter, Batch, AuditLog, AuditObservation, UserRole } from '../../types';
import { LedgerService } from '../../services/ledgerService';
import { 
  FileText, ShieldCheck, FileCheck, Landmark, Building, Lock, AlertCircle, 
  Plus, CheckCircle2, XCircle, Clock, Search, ExternalLink, Hash, Eye, 
  FileSpreadsheet, Scale, ChevronRight, Award, RefreshCw, Layers, Shield
} from 'lucide-react';
import { toast } from 'react-toastify';
import BatchManager from '../BatchManager';
import FinancialRecords from '../FinancialRecords';
import DocumentVault from '../DocumentVault';

interface AuditorDashboardProps {
  user: User;
}

const AuditorDashboard: React.FC<AuditorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'engagements' | 'data_inspector' | 'audit_observations'>('engagements');
  const [inspectorSubTab, setInspectorSubTab] = useState<'inventory' | 'financials' | 'documents'>('inventory');
  
  const [engagements, setEngagements] = useState<EngagementLetter[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Firm Filter
  const [selectedFirmGLN, setSelectedFirmGLN] = useState<string>('ALL');

  // Modal States
  const [showCreateEngagementModal, setShowCreateEngagementModal] = useState<boolean>(false);
  const [showNewObservationModal, setShowNewObservationModal] = useState<boolean>(false);

  // Form State for New Engagement
  const [engagementForm, setEngagementForm] = useState({
    firmName: 'Global Life Sciences Corp',
    firmGLN: '0890001234567',
    scope: 'FULL_STATUTORY_AUDIT' as EngagementLetter['scope'],
    validFrom: new Date().toISOString().split('T')[0],
    validTo: `${new Date().getFullYear() + 1}-03-31`,
    terms: 'Statutory Financial, Tax Reconciliation & GxP Quality Audit authorization under Section 143 of Companies Act 2013 and CDSCO Track & Trace guidelines.'
  });

  // Form State for Audit Observation
  const [observationForm, setObservationForm] = useState({
    firmGLN: '0890001234567',
    firmName: 'Global Life Sciences Corp',
    category: 'FINANCIAL' as 'FINANCIAL' | 'GXP_COMPLIANCE' | 'GST_TAX' | 'SERIALIZATION',
    severity: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'COMPLIANT',
    title: '',
    details: '',
    recommendation: ''
  });

  const [auditObservations, setAuditObservations] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const engs = await LedgerService.getEngagementLetters(user);
      setEngagements(engs);

      const bData = await LedgerService.getBatches(user);
      setBatches(bData);

      const logs = await LedgerService.getAuditLogs(user);
      setAuditLogs(logs);

      // Load Observations from localStorage
      const storedObs = localStorage.getItem('eledger_ca_observations');
      if (storedObs) {
        setAuditObservations(JSON.parse(storedObs));
      } else {
        const seedObs = [
          {
            id: 'OBS-2026-101',
            date: '2026-02-10',
            auditorName: user.name,
            firmName: 'Global Life Sciences Corp',
            firmGLN: '0890001234567',
            category: 'GST_TAX',
            severity: 'COMPLIANT',
            title: 'Q3 GST ITC & Tax Invoice Reconciliation Verified Clean',
            details: 'All outward B2B e-Way bills match line-item tax invoices and GSTR-2B returns with 100% precision.',
            recommendation: 'Clean statutory audit opinion recommended.'
          }
        ];
        localStorage.setItem('eledger_ca_observations', JSON.stringify(seedObs));
        setAuditObservations(seedObs);
      }
    } catch (err: any) {
      toast.error('Failed to sync CA Auditor records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const activeEngagements = engagements.filter(e => e.status === 'ACTIVE');
  const engagedFirmGLNs = activeEngagements.map(e => e.firmGLN);

  const handleCreateEngagement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await LedgerService.createEngagementLetter(
        {
          firmName: engagementForm.firmName,
          firmGLN: engagementForm.firmGLN,
          firmId: `FIRM-${engagementForm.firmGLN.slice(-4)}`,
          scope: engagementForm.scope,
          validFrom: engagementForm.validFrom,
          validTo: engagementForm.validTo,
          terms: engagementForm.terms
        },
        user
      );
      toast.success('Smart Contract Engagement Letter Proposed on-chain!');
      setShowCreateEngagementModal(false);
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create engagement letter');
    }
  };

  const handleSignEngagement = async (engagementId: string) => {
    try {
      await LedgerService.signEngagementLetter(engagementId, user);
      toast.success('Client firm accepted engagement letter. Smart contract activated!');
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate engagement');
    }
  };

  const handleTerminateEngagement = async (engagementId: string) => {
    if (confirm('Are you sure you want to terminate this smart contract engagement letter? Access to client data will be revoked immediately.')) {
      try {
        await LedgerService.terminateEngagementLetter(engagementId, user);
        toast.info('Engagement letter terminated on-chain.');
        loadDashboardData();
      } catch (err: any) {
        toast.error('Failed to terminate engagement');
      }
    }
  };

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationForm.title || !observationForm.details) {
      toast.error('Please fill in required fields');
      return;
    }

    const newObs = {
      id: `OBS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      auditorName: user.name,
      firmName: observationForm.firmName,
      firmGLN: observationForm.firmGLN,
      category: observationForm.category,
      severity: observationForm.severity,
      title: observationForm.title,
      details: observationForm.details,
      recommendation: observationForm.recommendation
    };

    const updated = [newObs, ...auditObservations];
    setAuditObservations(updated);
    localStorage.setItem('eledger_ca_observations', JSON.stringify(updated));
    toast.success('Statutory Audit Observation recorded on ledger.');
    setShowNewObservationModal(false);
    setObservationForm({
      firmGLN: '0890001234567',
      firmName: 'Global Life Sciences Corp',
      category: 'FINANCIAL',
      severity: 'LOW',
      title: '',
      details: '',
      recommendation: ''
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Landmark size={14} />
                Chartered Accountant & GxP Statutory Auditor
              </span>
              <span className="bg-white/10 text-slate-200 text-xs font-mono px-2.5 py-1 rounded-full">
                ICAI Reg: {user.membershipNumber || 'ICAI-512890'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {user.caFirmName || user.orgName || 'Statutory CA & Audit Portal'}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Smart Contract Enforced Read-Only Audit Interface. Confidential corporate ledger data is dynamically restricted to firms with active, verified Engagement Letters.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateEngagementModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus size={18} />
              <span>Propose Engagement</span>
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 text-white">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Engagements</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeEngagements.length}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Engaged Client Firms</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{engagedFirmGLNs.length}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Accessible Batches</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{batches.length}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Audit Findings</p>
            <p className="text-2xl font-black text-purple-400 mt-1">{auditObservations.length}</p>
          </div>
        </div>
      </div>

      {/* RBAC Safeguard Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900">
        <Lock className="text-emerald-700 shrink-0 mt-0.5" size={20} />
        <div className="text-xs sm:text-sm leading-relaxed">
          <p className="font-bold">Smart Contract Access Authorization (Strict Read-Only Mode):</p>
          <p className="text-emerald-800">
            You are viewing data governed by cryptographic Engagement Letters. Write operations are disabled by role design. Only data belonging to firms with an active contract is visible to your CA session.
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-sm p-1.5 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('engagements')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'engagements'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={18} />
          <span>Smart Contract Engagements ({engagements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('data_inspector')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'data_inspector'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye size={18} />
          <span>Client Data Inspector (Read-Only)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_observations')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'audit_observations'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award size={18} />
          <span>Audit Observations & Certificates ({auditObservations.length})</span>
        </button>
      </div>

      {/* TAB 1: Smart Contract Engagements */}
      {activeTab === 'engagements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Engagement Letters & Access Authorization</h3>
              <p className="text-xs text-slate-500">
                On-chain smart contracts binding CA Auditors to client entities. Access expires automatically on validity date.
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              title="Refresh engagements"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {engagements.map((eng) => (
              <div
                key={eng.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col shadow-sm ${
                  eng.status === 'ACTIVE'
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                    : eng.status === 'PROPOSED'
                    ? 'border-amber-300'
                    : 'border-slate-200 opacity-75'
                }`}
              >
                {/* Contract Card Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                        {eng.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          eng.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : eng.status === 'PROPOSED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {eng.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mt-2">{eng.firmName}</h4>
                    <p className="text-xs text-slate-500 font-mono">GLN: {eng.firmGLN}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-emerald-600">
                    <ShieldCheck size={24} />
                  </div>
                </div>

                {/* Contract Body */}
                <div className="p-5 space-y-4 flex-1 text-xs sm:text-sm text-slate-600">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Scope</span>
                      <span className="font-bold text-slate-800">{eng.scope.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Valid Period</span>
                      <span className="font-bold text-slate-800">{eng.validFrom} to {eng.validTo}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                      Terms & Statutory Basis
                    </span>
                    <p className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded border border-slate-200 leading-relaxed italic">
                      "{eng.terms}"
                    </p>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-500 bg-slate-900 text-slate-300 p-3 rounded-lg">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Hash size={14} />
                      <span>Smart Contract Address:</span>
                    </div>
                    <p className="truncate text-slate-200">{eng.smartContractAddress}</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                      <span>Hash: {eng.contractHash.substring(0, 16)}...</span>
                      <span>Auditor Signed: {eng.auditorSignedAt ? 'YES' : 'NO'}</span>
                    </div>
                  </div>
                </div>

                {/* Contract Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  {eng.status === 'PROPOSED' && (
                    <button
                      onClick={() => handleSignEngagement(eng.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle2 size={16} />
                      <span>Simulate Firm Co-Sign & Execute</span>
                    </button>
                  )}

                  {eng.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedFirmGLN(eng.firmGLN);
                          setActiveTab('data_inspector');
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5"
                      >
                        <Eye size={14} />
                        <span>Inspect Data</span>
                      </button>

                      <button
                        onClick={() => handleTerminateEngagement(eng.id)}
                        className="text-red-600 hover:text-red-800 font-bold text-xs py-2 px-3 rounded hover:bg-red-50 border border-red-200"
                      >
                        Terminate Contract
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {engagements.length === 0 && (
              <div className="col-span-2 p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-700">No Engagement Letters Found</p>
                <p className="text-xs mt-1">Propose a new engagement letter to gain read-only access to a client firm's data.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Client Data Inspector */}
      {activeTab === 'data_inspector' && (
        <div className="space-y-6">
          {/* Engaged Firm Selector Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Client Data Inspector</h3>
              <p className="text-xs text-slate-500">Read-Only view filtered strictly by active Smart Contract Engagements.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-600 uppercase shrink-0">Engaged Firm:</label>
              <select
                value={selectedFirmGLN}
                onChange={(e) => setSelectedFirmGLN(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
              >
                <option value="ALL">All Engaged Entities ({engagedFirmGLNs.length})</option>
                {activeEngagements.map((eng) => (
                  <option key={eng.id} value={eng.firmGLN}>
                    {eng.firmName} ({eng.firmGLN})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-tabs for Data Inspector */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setInspectorSubTab('inventory')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${
                inspectorSubTab === 'inventory'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Batches & Track-Trace
            </button>
            <button
              onClick={() => setInspectorSubTab('financials')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${
                inspectorSubTab === 'financials'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sales, Tax & GST Invoices
            </button>
            <button
              onClick={() => setInspectorSubTab('documents')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${
                inspectorSubTab === 'documents'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Compliance Docs & Certificates
            </button>
          </div>

          {/* Render Sub-components in Read-Only Mode */}
          {inspectorSubTab === 'inventory' && <BatchManager user={user} />}
          {inspectorSubTab === 'financials' && <FinancialRecords user={user} />}
          {inspectorSubTab === 'documents' && <DocumentVault user={user} />}
        </div>
      )}

      {/* TAB 3: Statutory Audit Observations */}
      {activeTab === 'audit_observations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-lg font-sans">Statutory CA Audit Findings & Certificates</h3>
              <p className="text-xs text-slate-500">
                Official audit observations recorded on-chain for engaged entities. Visible to client management & regulatory authorities.
              </p>
            </div>

            <button
              onClick={() => setShowNewObservationModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Plus size={16} />
              <span>Record Observation</span>
            </button>
          </div>

          <div className="space-y-4">
            {auditObservations.map((obs) => (
              <div key={obs.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500">{obs.id}</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                        {obs.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          obs.severity === 'COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : obs.severity === 'HIGH' || obs.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {obs.severity}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{obs.title}</h4>
                    <p className="text-xs text-slate-500">
                      Entity: <span className="font-bold text-slate-700">{obs.firmName}</span> ({obs.firmGLN}) • Date: {obs.date}
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-400">
                    Signed by: <span className="text-slate-700 font-bold">{obs.auditorName}</span>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 space-y-2">
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">{obs.details}</p>
                  {obs.recommendation && (
                    <div className="bg-emerald-50/60 text-emerald-900 p-3 rounded-lg border border-emerald-200/60 font-medium">
                      <span className="font-bold block text-[11px] uppercase text-emerald-800 mb-0.5">CA Recommendation / Opinion:</span>
                      {obs.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Propose Smart Contract Engagement */}
      {showCreateEngagementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <Landmark className="text-emerald-600" size={24} />
                <h3 className="font-bold text-xl text-slate-800">Propose Smart Contract Engagement</h3>
              </div>
              <button
                onClick={() => setShowCreateEngagementModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEngagement} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Client Entity Name</label>
                <input
                  type="text"
                  required
                  value={engagementForm.firmName}
                  onChange={(e) => setEngagementForm({ ...engagementForm, firmName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Global Life Sciences Corp"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Entity GLN (13-digit)</label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  minLength={13}
                  value={engagementForm.firmGLN}
                  onChange={(e) => setEngagementForm({ ...engagementForm, firmGLN: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="0890001234567"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Audit Scope</label>
                <select
                  value={engagementForm.scope}
                  onChange={(e) => setEngagementForm({ ...engagementForm, scope: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="FULL_STATUTORY_AUDIT">Full Statutory Audit (Financial & GxP Quality)</option>
                  <option value="FINANCIAL_AUDIT">Financial & Corporate Statutory Audit</option>
                  <option value="GST_TAX_RECONCILIATION">GST & Tax Credit (ITC) Reconciliation</option>
                  <option value="GXP_COMPLIANCE">GxP / CDSCO Track & Trace Compliance</option>
                  <option value="SERIALIZATION_SGTIN">Serialization & SGTIN Inventory Verification</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={engagementForm.validFrom}
                    onChange={(e) => setEngagementForm({ ...engagementForm, validFrom: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valid To</label>
                  <input
                    type="date"
                    required
                    value={engagementForm.validTo}
                    onChange={(e) => setEngagementForm({ ...engagementForm, validTo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Engagement Terms & Provisions</label>
                <textarea
                  rows={3}
                  required
                  value={engagementForm.terms}
                  onChange={(e) => setEngagementForm({ ...engagementForm, terms: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                <Shield size={16} className="shrink-0 text-amber-700" />
                <span>Generating this engagement creates an immutable SHA-256 smart contract proposal on the ledger.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateEngagementModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md"
                >
                  Deploy Smart Contract Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Audit Observation */}
      {showNewObservationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <Award className="text-purple-600" size={24} />
                <h3 className="font-bold text-xl text-slate-800">Record Statutory Audit Observation</h3>
              </div>
              <button
                onClick={() => setShowNewObservationModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddObservation} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Client Entity Name</label>
                <input
                  type="text"
                  required
                  value={observationForm.firmName}
                  onChange={(e) => setObservationForm({ ...observationForm, firmName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={observationForm.category}
                    onChange={(e) => setObservationForm({ ...observationForm, category: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="FINANCIAL">Financial & Accounting</option>
                    <option value="GST_TAX">GST & Tax Reconciliation</option>
                    <option value="GXP_COMPLIANCE">GxP / CDSCO Compliance</option>
                    <option value="SERIALIZATION">SGTIN Serialization</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Audit Status / Severity</label>
                  <select
                    value={observationForm.severity}
                    onChange={(e) => setObservationForm({ ...observationForm, severity: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="COMPLIANT">Clean / Fully Compliant</option>
                    <option value="LOW">Low Risk Observation</option>
                    <option value="MEDIUM">Medium Risk Variance</option>
                    <option value="HIGH">High Severity Non-Compliance</option>
                    <option value="CRITICAL">Critical Audit Failure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observation Title</label>
                <input
                  type="text"
                  required
                  value={observationForm.title}
                  onChange={(e) => setObservationForm({ ...observationForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. GST Input Tax Credit Reconciled Cleanly for FY 2025-26"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Audit Findings</label>
                <textarea
                  rows={3}
                  required
                  value={observationForm.details}
                  onChange={(e) => setObservationForm({ ...observationForm, details: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Detail ledger cross-verification results..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">CA Opinion / Recommendation</label>
                <input
                  type="text"
                  value={observationForm.recommendation}
                  onChange={(e) => setObservationForm({ ...observationForm, recommendation: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Recommended for Unqualified Statutory Clean Opinion."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewObservationModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-md"
                >
                  Log Observation On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditorDashboard;
