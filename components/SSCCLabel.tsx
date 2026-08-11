import React from 'react';
import { LogisticsUnit, User } from '../types';

interface SSCCLabelProps {
  unit: LogisticsUnit;
  user: User; // Creator info
  onClose: () => void;
}

const SSCCLabel: React.FC<SSCCLabelProps> = ({ unit, user, onClose }) => {
  
  // Format the SSCC for the barcode text (GS1-128 usually formatted with (00))
  // However, the barcode generator handles the raw number.
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Toolbar */}
        <div className="bg-slate-800 p-3 flex justify-between items-center text-white no-print">
          <h3 className="font-semibold">Print Preview: GS1 Logistics Label</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕ Close</button>
        </div>

        {/* Scrollable Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          
          {/* The Label - A6 Aspect Ratio Approx */}
          <div className="bg-white w-[350px] min-h-[500px] border border-black p-4 flex flex-col text-black shadow-lg">
            
            {/* Header Section: Company Info */}
            <div className="border-b-2 border-black pb-4 mb-4">
              <h1 className="text-xl font-bold uppercase mb-1">{user.orgName}</h1>
              <p className="text-sm">GLN: {user.gln}</p>
              <p className="text-xs mt-2 text-slate-500">FROM: Manufacturing Plant A, Industrial Zone, City.</p>
            </div>

            {/* Content Section */}
            <div className="border-b-2 border-black pb-4 mb-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-xs uppercase font-bold">Content</p>
                   <p className="text-lg font-bold">MIXED BATCHES</p>
                </div>
                <div>
                   <p className="text-xs uppercase font-bold">Count</p>
                   <p className="text-lg font-bold">{unit.contents.length} ITEMS</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase font-bold">Date</p>
                <p className="text-md">{new Date(unit.createdDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* SSCC Section */}
            <div className="text-center mt-auto">
              <p className="text-sm uppercase font-bold mb-1">Serial Shipping Container Code (SSCC)</p>
              <p className="text-3xl font-mono font-bold tracking-widest mb-4">
                (00) {unit.sscc}
              </p>
              
              {/* Barcode Visual */}
              <div className="flex justify-center mb-2">
                 {/* Using bwip-js online API to generate real barcode image */}
                 <img 
                   src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=00${unit.sscc}&scale=3&height=100&includetext`} 
                   alt="SSCC Barcode"
                   className="max-w-full"
                 />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end space-x-3 no-print">
           <button 
             onClick={onClose}
             className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
           >
             Cancel
           </button>
           <button 
             onClick={() => window.print()}
             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
           >
             <span>Print Label</span>
           </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .fixed { position: absolute; inset: 0; background: white; padding: 0; display: block; }
          .shadow-2xl, .shadow-lg { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SSCCLabel;