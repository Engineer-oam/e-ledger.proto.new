
import React from 'react';
import { EWayBill } from '../types';
import { Printer } from 'lucide-react';

interface PrintableInvoiceProps {
  type: 'INVOICE' | 'CREDIT_NOTE' | 'RECEIPT';
  data: {
    id: string; // Invoice No or Tx Hash
    date: string;
    from: { name: string; gln: string; address?: string };
    to: { name: string; gln: string; address?: string };
    items: Array<{
      product: string;
      batch: string;
      hsos: string; // HSN
      qty: number;
      unit: string;
      rate: number;
      amount: number;
    }>;
    tax?: { rate: number; amount: number };
    total: number;
    ewayBill?: EWayBill;
    remarks?: string;
  };
  onClose: () => void;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ type, data, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-3xl shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Screen-only Toolbar */}
        <div className="bg-slate-900 p-4 flex justify-between items-center print:hidden">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Printer size={20} />
            <span>Print Preview</span>
          </h3>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-slate-300 hover:text-white px-3 py-1">Close</button>
            <button 
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <Printer size={16} /> Print Hard Copy
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-8 print:p-8 print:overflow-visible bg-white text-slate-900 font-sans">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">
                {type === 'INVOICE' ? 'TAX INVOICE' : type === 'CREDIT_NOTE' ? 'CREDIT NOTE' : 'RETAIL RECEIPT'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">Original for Recipient</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-xl">{data.from.name}</h2>
              <p className="text-sm text-slate-600">GLN: {data.from.gln}</p>
              <p className="text-xs text-slate-500 max-w-[200px] ml-auto">{data.from.address || 'Registered Office, Industrial Area'}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Billed To</p>
              <p className="font-bold text-lg">{data.to.name}</p>
              <p className="text-sm font-mono text-slate-600">GLN: {data.to.gln}</p>
              <p className="text-sm text-slate-500">{data.to.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Document No</p>
                <p className="font-mono font-bold">{data.id}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date</p>
                <p>{new Date(data.date).toLocaleDateString()}</p>
              </div>
              {data.ewayBill && (
                <div className="col-span-2 bg-slate-50 p-2 rounded border border-slate-200 mt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">E-Way Bill No</p>
                  <p className="font-mono font-bold text-slate-900">{data.ewayBill.ewbNo}</p>
                  <p className="text-[10px] text-slate-500">Valid Until: {new Date(data.ewayBill.validUntil).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Product / Batch</th>
                <th className="px-4 py-3 text-left">HSN</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {data.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3">
                    <p className="font-bold">{item.product}</p>
                    <p className="text-xs font-mono text-slate-500">Batch: {item.batch}</p>
                  </td>
                  <td className="px-4 py-3">{item.hsos}</td>
                  <td className="px-4 py-3 text-right">{item.qty} {item.unit}</td>
                  <td className="px-4 py-3 text-right">₹{item.rate.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>₹{(data.total - (data.tax?.amount || 0)).toFixed(2)}</span>
              </div>
              {data.tax && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">GST ({data.tax.rate}%)</span>
                  <span>₹{data.tax.amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t-2 border-slate-900 pt-2">
                <span>Total</span>
                <span>₹{data.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {data.remarks && (
            <div className="mb-8 border border-slate-200 bg-slate-50 p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Remarks / Notes</p>
                <p className="text-sm text-slate-700">{data.remarks}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            <p className="mb-1">This is a computer-generated invoice secured by Blockchain.</p>
            <p>E-Ledger Traceability Platform • GS1 Compliant</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
