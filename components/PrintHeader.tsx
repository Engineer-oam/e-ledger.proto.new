import React, { useEffect, useState } from 'react';
import { PrintAuditRecord, User } from '../types';
import { LedgerService } from '../services/ledgerService';
import { ShieldCheck } from 'lucide-react';

interface PrintHeaderProps {
  docType: PrintAuditRecord['docType'];
  docId: string;
  docTitle?: string;
  user?: User | null;
  onAuditCreated?: (record: PrintAuditRecord) => void;
}

const PrintHeader: React.FC<PrintHeaderProps> = ({ docType, docId, docTitle, user, onAuditCreated }) => {
  const [printRecord, setPrintRecord] = useState<PrintAuditRecord | null>(null);

  useEffect(() => {
    let activeUser = user;
    if (!activeUser) {
      try {
        const stored = localStorage.getItem('eledger_active_session');
        if (stored) activeUser = JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }

    const userInfo = {
      gln: activeUser?.gln || '0890001234567',
      name: activeUser?.name || 'Authorized Operator',
      role: activeUser?.positionLabel || activeUser?.role || 'OPERATOR',
      orgName: activeUser?.caFirmName || activeUser?.orgName || 'Licensed Entity Node'
    };

    LedgerService.createPrintAuditRecord(userInfo, docType, docId, docTitle).then(rec => {
      setPrintRecord(rec);
      if (onAuditCreated) onAuditCreated(rec);
    });
  }, [docType, docId, docTitle, user, onAuditCreated]);

  if (!printRecord) return null;

  // Generate QR Code containing the Print Audit ID
  const encodedText = encodeURIComponent(printRecord.id);
  const qrUrl = `https://bwipjs-api.metafloor.com/?bcid=qrcode&text=${encodedText}&scale=2`;

  return (
    <div className="w-full border-b-2 border-slate-900 pb-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-900 print:bg-white print:border-slate-800 print:p-2 print:mb-4">
      <div className="flex justify-between items-center gap-4">
        {/* Left: Branding & Audit Info */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-1.5 text-indigo-700 print:text-black">
            <ShieldCheck size={16} className="shrink-0 text-emerald-600 print:text-black" />
            <span className="font-extrabold text-[11px] tracking-wider uppercase">Official Hard Copy • Print Audit Trail</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
            <span>PRINT AUDIT ID:</span>
            <span className="bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded border border-indigo-200 print:bg-slate-100 print:border-slate-400 print:text-black font-extrabold text-xs">
              {printRecord.id}
            </span>
          </div>
          <div className="text-[11px] text-slate-700 flex flex-wrap gap-x-3 gap-y-0.5">
            <span><strong>GLN NO:</strong> <code className="font-mono text-slate-900 font-bold">{printRecord.printedByGLN}</code></span>
            <span><strong>Printed By:</strong> {printRecord.printedByName} ({printRecord.printedByRole.replace(/_/g, ' ')})</span>
            <span><strong>Org / Firm:</strong> {printRecord.printedByOrg}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Print Time: {new Date(printRecord.timestamp).toLocaleString('en-IN', { timeZoneName: 'short' })}
          </p>
        </div>

        {/* Right: Header QR Code */}
        <div className="text-right shrink-0 flex flex-col items-end">
          <div className="border border-slate-900 p-1 bg-white rounded shadow-sm inline-block">
            <img 
              src={qrUrl} 
              alt={`QR ${printRecord.id}`}
              className="w-14 h-14 object-contain"
            />
          </div>
          <span className="text-[8px] font-mono font-extrabold text-slate-800 mt-0.5 tracking-tight uppercase">
            Scan QR to Audit Print
          </span>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
