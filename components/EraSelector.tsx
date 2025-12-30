import React from 'react';
import { ERAS } from '../constants';
import { EraId } from '../types';

interface Props {
  selectedEra: EraId;
  onSelect: (id: EraId) => void;
  disabled: boolean;
}

const EraSelector: React.FC<Props> = ({ selectedEra, onSelect, disabled }) => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 mb-6">
      <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Historical Era Selection</h2>
      {/* Changed from horizontal scroll flex to wrapping grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.values(ERAS).map((era) => (
          <button
            key={era.id}
            onClick={() => onSelect(era.id)}
            disabled={disabled}
            className={`
              p-3 rounded-lg text-left transition-all duration-200
              flex flex-col gap-1 border h-full
              ${selectedEra === era.id 
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-[10px] font-mono opacity-70 block">{era.yearRange}</span>
            <span className="text-sm font-bold leading-tight block">{era.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
        <p className="text-sm text-slate-300">
            <strong className="text-emerald-400">Context:</strong> {ERAS[selectedEra].description}
        </p>
        <div className="mt-2 flex gap-4 text-xs font-mono text-slate-500">
            <span>TD: {ERAS[selectedEra].scoring.td}pts</span>
            <span>FG: {ERAS[selectedEra].scoring.fg}pts</span>
            <span>Hashmarks: {ERAS[selectedEra].rules.hashMarks ? 'YES' : 'NO'}</span>
        </div>
      </div>
    </div>
  );
};

export default EraSelector;