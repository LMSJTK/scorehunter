import React from 'react';
import { PlayType, EraId } from '../types';
import { ERAS } from '../constants';

interface Props {
  onSelectPlay: (type: PlayType) => void;
  recommendedPlay: PlayType;
  era: EraId;
  disabled: boolean;
  possessionTeam: string;
}

const PlaybookSelector: React.FC<Props> = ({ 
  onSelectPlay, 
  recommendedPlay, 
  era, 
  disabled,
  possessionTeam
}) => {
  const eraConfig = ERAS[era];

  // If recommended play is KICKOFF, that means it's required (start of game/after score)
  const isKickoffRequired = recommendedPlay === PlayType.KICKOFF;

  if (isKickoffRequired) {
      return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                     <span className="text-emerald-500">{possessionTeam}</span> Special Teams
                 </h3>
             </div>
             <button
                onClick={() => onSelectPlay(PlayType.KICKOFF)}
                disabled={disabled}
                className="w-full py-8 bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 hover:border-white rounded-lg group active:scale-95 transition-all"
             >
                <div className="text-center">
                    <div className="text-2xl font-black text-white">KICKOFF</div>
                    <div className="text-xs text-slate-400 mt-2">REQUIRED</div>
                </div>
             </button>
        </div>
      );
  }

  // Normal Play Options
  const plays = [
    { type: PlayType.RUN, label: 'Run Play', valid: true },
    { type: PlayType.LATERAL, label: 'Toss / Lateral', valid: true },
    { type: PlayType.PASS, label: 'Pass Play', valid: eraConfig.rules.passLegal || era === EraId.GENESIS }, 
    { type: PlayType.FG, label: 'Field Goal', valid: true },
    { type: PlayType.PUNT, label: 'Punt', valid: true },
    { type: PlayType.WASTE, label: 'Center Ball (Waste)', valid: era === EraId.IRON_MAN },
  ];

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                 <span className="text-emerald-500">{possessionTeam}</span> Playbook
             </h3>
             <div className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">
                 Coach Recommends: <span className="text-yellow-400 font-bold">{recommendedPlay}</span>
             </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {plays.filter(p => p.valid).map((play) => {
                const isRecommended = recommendedPlay === play.type;
                
                return (
                    <button
                        key={play.type}
                        onClick={() => onSelectPlay(play.type)}
                        disabled={disabled}
                        className={`
                            relative overflow-hidden group p-4 rounded-lg border-2 text-left transition-all
                            ${isRecommended 
                                ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'}
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                        `}
                    >
                        {isRecommended && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
                                COACH
                            </div>
                        )}
                        <div className={`font-black text-lg ${isRecommended ? 'text-emerald-100' : 'text-slate-200'}`}>
                            {play.label}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                            {play.type === PlayType.PASS && !eraConfig.rules.passLegal 
                                ? 'ILLEGAL / HIGH RISK' 
                                : play.type}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
  );
};

export default PlaybookSelector;
