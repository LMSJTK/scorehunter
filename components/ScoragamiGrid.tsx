import React, { useMemo, useState } from 'react';
import { ScoragamiEntry } from '../types';

interface Props {
  history: ScoragamiEntry[];
  currentHome: number;
  currentAway: number;
}

const CELL_SIZE = 12;
const MAX_SCORE = 60; // Increased slightly for visibility

const ScoragamiGrid: React.FC<Props> = ({ history, currentHome, currentAway }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create a quick lookup map
  const scoreMap = useMemo(() => {
      const map = new Map<string, boolean>();
      history.forEach(h => map.set(`${h.winnerScore}-${h.loserScore}`, true));
      return map;
  }, [history]);

  const renderGrid = (size: number, showTooltips: boolean) => {
    const cells = [];
    for (let w = 0; w <= MAX_SCORE; w++) {
        for (let l = 0; l <= w; l++) {
            const key = `${w}-${l}`;
            const exists = scoreMap.has(key);
            
            const liveW = Math.max(currentHome, currentAway);
            const liveL = Math.min(currentHome, currentAway);
            const isLive = liveW === w && liveL === l;
  
            let bgClass = 'bg-slate-800';
            if (exists) bgClass = 'bg-emerald-500';
            if (isLive) bgClass = 'bg-yellow-400 animate-pulse';
  
            cells.push(
                <div 
                  key={key}
                  className={`${bgClass} border border-slate-900/20 hover:border-white transition-colors cursor-help group relative`}
                  style={{ 
                      width: size, 
                      height: size,
                      gridColumn: w + 1,
                      gridRow: l + 1
                  }}
                >
                   {showTooltips && (
                     <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black text-white text-xs p-2 rounded z-10 pointer-events-none shadow-xl border border-slate-700">
                         <div className="font-bold text-center mb-1">{w} - {l}</div>
                         <div className="text-[10px] text-center text-slate-400">{exists ? 'DISCOVERED' : 'MISSING'}</div>
                     </div>
                   )}
                </div>
            );
        }
    }
    return cells;
  };

  return (
    <>
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-inner overflow-hidden flex flex-col">
          <div className="flex justify-between items-end mb-4">
              <div>
                  <h3 className="text-lg font-bold text-white">Scoragami Board</h3>
                  <p className="text-xs text-slate-500">Collect every unique score.</p>
              </div>
              <div className="flex gap-4 items-end">
                  <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-emerald-400">{history.length}</div>
                      <div className="text-[10px] uppercase text-slate-600">Unique Scores</div>
                  </div>
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                    title="Expand View"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                      </svg>
                  </button>
              </div>
          </div>
          
          <div className="overflow-auto pb-2 min-h-[200px]">
              <div className="inline-grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${MAX_SCORE + 1}, ${CELL_SIZE}px)` }}>
                  {renderGrid(CELL_SIZE, true)}
              </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-600 flex gap-4">
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Discovered</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-800 rounded-sm"></div> Missing</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-sm"></div> Live</div>
          </div>
      </div>

      {/* MODAL */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Full Scoragami Matrix</h2>
                        <div className="text-emerald-400 font-mono text-sm">{history.length} Unique Scores Discovered</div>
                    </div>
                    <button 
                        onClick={() => setIsExpanded(false)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-8 bg-black/20 flex justify-center">
                    <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${MAX_SCORE + 1}, 14px)` }}>
                        {renderGrid(14, true)}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-center gap-8 text-sm text-slate-500">
                     <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-500 rounded"></div> Discovered</div>
                     <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-800 rounded border border-slate-700"></div> Missing</div>
                     <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-400 rounded animate-pulse"></div> Current Game</div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default ScoragamiGrid;