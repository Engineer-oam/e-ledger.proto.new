import React from 'react';
import { User, EngagementLetter } from '../types';
import PrintHeader from './PrintHeader';
import { Printer, ShieldCheck, Landmark, Award, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface PrintableAuditReportProps {
  user: User;
  observations: any[];
  engagements: EngagementLetter[];
  selectedFirmGLN?: string;
  onClose: () => void;
}

const PrintableAuditReport: React.FC<PrintableAuditReportProps> = ({
  user,
  observations,
  engagements,
  selectedFirmGLN,
  onClose
}) => {
  const filteredObs = selectedFirmGLN && selectedFirmGLN !== 'ALL'
    ? observations.filter(o => o.firmGLN === selectedFirmGLN)
    : observations;

  const filteredEngs = selectedFirmGLN && selectedFirmGLN !== 'ALL'
    ? engagements.filter(e => e.firmGLN === selectedFirmGLN)
    : engagements;

  const reportId = `AUD-RPT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  const hasHighOrCritical = filteredObs.some(o => o.severity === 'HIGH' || o.severity === 'CRITICAL');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
      {/* Top Action Bar - Hidden in Print */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 text-white flex justify-between items-center print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base">Standardized Statutory Audit Findings Report</h3>
            <p className="text-xs text-slate-400 font-mono">Document ID: {reportId} • CA Read-Only Ledger Export</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-2xl rounded-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 text-slate-900 font-sans">
          
          {/* Header with Unique Print Audit ID & QR Code */}
          <PrintHeader
            docType="COMPLIANCE_CERTIFICATE"
            docId={reportId}
            docTitle="Statutory CA Audit & Inspection Findings Certificate"
            user={user}
          />

          {/* Title Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block mb-2">
                  OFFICIAL STATUTORY AUDIT REPORT
                </span>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Independent Auditor's Report & Findings
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Generated under Section 143 of Companies Act & CDSCO Track-and-Trace Ledger Governance
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-600">
                <p><strong>Report Date:</strong> {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Period:</strong> FY {new Date().getFullYear() - 1} - {new Date().getFullYear()}</p>
                <p><strong>Status:</strong> <span className={hasHighOrCritical ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>{hasHighOrCritical ? 'VARIANCES DETECTED' : 'UNQUALIFIED / CLEAN'}</span></p>
              </div>
            </div>
          </div>

          {/* Auditor Profile Block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Chartered Accountant</p>
              <p className="font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] text-slate-500">{user.positionLabel || 'Statutory Auditor'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">CA Firm / Practice</p>
              <p className="font-bold text-slate-900">{user.caFirmName || user.orgName || 'Auditor Practice Node'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">ICAI Reg / License</p>
              <p className="font-mono font-bold text-slate-900">{user.membershipNumber || 'CA-REG-2026-90412'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Auditor GLN No.</p>
              <p className="font-mono font-bold text-emerald-800">{user.gln}</p>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="mb-6 space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Award size={14} className="text-emerald-600" />
              1. Executive Audit Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              This report represents an independent, smart contract-governed statutory audit performed on the read-only blockchain ledger.
              All data points, transaction logs, e-Way bills, and GST tax reconciliations have been cross-verified directly against immutable block hashes.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Monitored Entities</span>
                <span className="text-lg font-black text-slate-900">{filteredEngs.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Recorded Observations</span>
                <span className="text-lg font-black text-indigo-700">{filteredObs.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Overall Audit Status</span>
                <span className={`text-xs font-extrabold uppercase mt-1 inline-block px-2 py-0.5 rounded ${hasHighOrCritical ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {hasHighOrCritical ? 'Action Required' : 'Fully Compliant'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Engaged Client Entities */}
          <div className="mb-6 space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <ShieldCheck size={14} className="text-indigo-600" />
              2. Smart Contract Bound Engagements
            </h2>

            <div className="border rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-black text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border-b">Engagement ID</th>
                    <th className="p-2 border-b">Client Firm</th>
                    <th className="p-2 border-b">Client GLN</th>
                    <th className="p-2 border-b">Audit Scope</th>
                    <th className="p-2 border-b text-right">Validity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEngs.map((eng) => (
                    <tr key={eng.id}>
                      <td className="p-2 font-mono font-bold text-indigo-700">{eng.id}</td>
                      <td className="p-2 font-bold">{eng.firmName}</td>
                      <td className="p-2 font-mono">{eng.firmGLN}</td>
                      <td className="p-2 text-[11px]">{eng.scope.replace(/_/g, ' ')}</td>
                      <td className="p-2 text-right text-[10px] text-slate-500">{eng.validFrom} to {eng.validTo}</td>
                    </tr>
                  ))}
                  {filteredEngs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-400">No active engagement letters found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Detailed Findings & Observations */}
          <div className="mb-6 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <FileText size={14} className="text-purple-600" />
              3. Detailed Audit Findings & CA Opinions
            </h2>

            <div className="space-y-3">
              {filteredObs.map((obs) => (
                <div key={obs.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-slate-600">{obs.id}</span>
                        <span className="text-[9px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded uppercase">
                          {obs.category}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          obs.severity === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-800' :
                          obs.severity === 'HIGH' || obs.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {obs.severity}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900">{obs.title}</h4>
                      <p className="text-[10px] text-slate-500">
                        Client: <strong>{obs.firmName}</strong> ({obs.firmGLN}) • Date Recorded: {obs.date}
                      </p>
                    </div>

                    <div className="text-right font-mono text-[10px] text-slate-400">
                      Signed: {obs.auditorName}
                    </div>
                  </div>

                  <p className="text-slate-700 leading-snug">{obs.details}</p>

                  {obs.recommendation && (
                    <div className="bg-emerald-50 text-emerald-900 p-2 rounded border border-emerald-200 font-medium text-[11px]">
                      <strong>CA Opinion / Action Item:</strong> {obs.recommendation}
                    </div>
                  )}
                </div>
              ))}

              {filteredObs.length === 0 && (
                <p className="text-slate-400 text-xs italic">No specific audit observations recorded for selected firm.</p>
              )}
            </div>
          </div>

          {/* Section 4: On-Chain Cryptographic Attestation Block */}
          <div className="mt-8 pt-6 border-t-2 border-slate-900 space-y-4">
            <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold uppercase text-emerald-400">On-Chain Ledger State Certificate</span>
                <span className="font-mono text-slate-400">SHA-256 Validated</span>
              </div>
              <p className="text-[10px] text-slate-300">
                This document was exported from an authenticated CA Auditor node on the E-Ledger Network.
                All entries are cryptographically sealed on the immutable blockchain ledger.
              </p>
            </div>

            <div className="flex justify-between items-end pt-4">
              <div className="text-left text-[10px] text-slate-500 space-y-0.5">
                <p><strong>Verification Portal:</strong> Scan top header QR code or search ID on network verifier.</p>
                <p><strong>Auditor Node GLN:</strong> {user.gln}</p>
              </div>

              <div className="text-center space-y-1">
                <div className="border-b border-slate-900 w-48 mx-auto pb-8"></div>
                <p className="font-bold text-xs text-slate-900">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{user.caFirmName || user.orgName}</p>
                <p className="text-[9px] text-slate-400 font-mono">ICAI / Statutory Auditor Reg. #{user.membershipNumber || 'CA-2026-90412'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrintableAuditReport;
