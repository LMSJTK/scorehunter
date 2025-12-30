import React from 'react';
import { PlayResult } from '../types';

interface Props {
  logs: PlayResult[];
}

const PlayLog: React.FC<Props> = ({ logs }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 h-96 flex flex-col">
       <div className="p-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
           <h3 className="text-xs font-bold uppercase text-slate-400">Play-by-Play Log</h3>
       </div>
       <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm custom-scrollbar">
           {logs.length === 0 && (
               <div className="text-slate-600 text-center italic mt-10">Waiting for kickoff...</div>
           )}
           {logs.map((play, i) => (
               <div key={i} className={`flex gap-3 pb-3 border-b border-slate-700/50 last:border-0 animate-in fade-in slide-in-from-top-2 duration-300`}>
                   <div className="text-slate-500 w-12 shrink-0 text-xs pt-1">Play {logs.length - i}</div>
                   <div className="flex-1">
                       <p className={`${
                           play.description.includes("TOUCHDOWN") ? "text-yellow-400 font-bold" :
                           play.description.includes("INTERCEPTED") || play.description.includes("FUMBLE") ? "text-red-400 font-bold" :
                           "text-slate-300"
                       }`}>
                           {play.description}
                       </p>
                       {play.scoreChange && (
                           <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded border border-emerald-900">
                               {play.scoreChange.type} +{play.scoreChange.points} {play.scoreChange.team.toUpperCase()}
                           </span>
                       )}
                   </div>
                   <div className="text-slate-600 text-xs w-12 text-right">-{play.timeElapsed}s</div>
               </div>
           ))}
       </div>
    </div>
  );
};

export default PlayLog;