import React from 'react';
import Logo from './Logo';

interface FooterProps {
  variant?: 'light' | 'dark';
}

const Footer: React.FC<FooterProps> = ({ variant = 'light' }) => {
  if (variant === 'dark') {
    return (
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-10 px-6 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <p className="font-black text-white uppercase tracking-wider text-sm">E-Ledger Network</p>
              <p className="text-slate-500 text-[10px]">Pharma & Excise Supply Chain Traceability</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="font-medium text-slate-300">
              Engineered & Maintained by{' '}
              <span className="font-black text-teal-400 tracking-wide">Synthrova Technologies</span>
            </p>
            <p className="text-slate-500 text-[11px]">
              © {new Date().getFullYear()} Synthrova Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-8 pt-4 pb-2 border-t border-slate-200/80 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-700">E-Ledger Network</span>
        <span>•</span>
        <span className="text-slate-400">Immutable Supply Chain Governance</span>
      </div>

      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
        <span>Powered by</span>
        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
          Synthrova Technologies
        </span>
      </div>
    </footer>
  );
};

export default Footer;
