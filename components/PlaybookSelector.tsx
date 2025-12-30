import React from 'react';
import { PlayType, DefensivePlayType, EraId } from '../types';
import { ERAS } from '../constants';

interface Props {
  onSelectPlay: (type: PlayType | DefensivePlayType) => void;
  recommendedPlay: PlayType | DefensivePlayType;
  era: EraId;
  disabled: boolean;
  possessionTeam: string;
  isDefense: boolean;
  isKickoff: boolean;
  isPointAfter: boolean;
}

const PlaybookSelector: React.FC<Props> = ({
  onSelectPlay,
  recommendedPlay,
  era,
  disabled,
  possessionTeam,
  isDefense,
  isKickoff,
  isPointAfter
}) => {
  const eraConfig = ERAS[era];

  // --- KICKOFF PHASE ---
  // Use the isKickoff flag to determine if we're in kickoff phase
  // We need to differentiate between the Kicker (Offense) and Returner (Defense).

  if (isKickoff) {
    if (isDefense) {
      // User is RECEIVING the kickoff
      return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl border-t-4 border-t-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Kick Return Strategy
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectPlay(DefensivePlayType.RETURN_SAFE)}
              disabled={disabled}
              className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg border-2 border-slate-600 hover:border-blue-400 text-left transition-all active:scale-95"
            >
              <div className="font-bold text-white">Safe Return</div>
              <div className="text-[10px] text-slate-400">Minimize Fumble Risk</div>
            </button>
            <button
              onClick={() => onSelectPlay(DefensivePlayType.RETURN_AGGRESSIVE)}
              disabled={disabled}
              className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg border-2 border-slate-600 hover:border-red-400 text-left transition-all active:scale-95"
            >
              <div className="font-bold text-white">Aggressive Return</div>
              <div className="text-[10px] text-slate-400">Chance for Big Play</div>
            </button>
          </div>
        </div>
      );
    } else {
      // User is KICKING OFF
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
              <div className="text-2xl font-black text-white">EXECUTE KICKOFF</div>
              <div className="text-xs text-slate-400 mt-2">REQUIRED</div>
            </div>
          </button>
        </div>
      );
    }
  }

  // --- PAT PHASE ---
  // Use the isPointAfter flag to determine if we're in PAT phase
  if (isPointAfter) {
    if (isDefense) {
      // Defense against PAT
      return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl border-t-4 border-t-red-500">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Point After Defense</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectPlay(DefensivePlayType.FG_BLOCK)}
              disabled={disabled}
              className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 font-bold text-white border-2 border-slate-600 hover:border-red-400 transition-all active:scale-95"
            >
              Block Kick
            </button>
            <button
              onClick={() => onSelectPlay(DefensivePlayType.GOAL_LINE)}
              disabled={disabled}
              className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 font-bold text-white border-2 border-slate-600 hover:border-red-400 transition-all active:scale-95"
            >
              Goal Line Stand
            </button>
          </div>
        </div>
      );
    } else {
      // Offense PAT Choice
      return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Point After Attempt
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectPlay(PlayType.XP)}
              disabled={disabled}
              className={`p-6 rounded-xl border-2 transition-all text-center active:scale-95 ${recommendedPlay === PlayType.XP ? 'bg-emerald-900/50 border-emerald-500' : 'bg-slate-700 border-slate-600 hover:border-slate-500'}`}
            >
              <div className="font-bold text-white text-xl">Kick XP</div>
              <div className="text-xs text-slate-400 mt-1">1 Point</div>
            </button>

            <button
              onClick={() => onSelectPlay(PlayType.TWO_PT)}
              disabled={disabled || !eraConfig.scoring.twoPtAvailable}
              className={`p-6 rounded-xl border-2 transition-all text-center relative active:scale-95 ${!eraConfig.scoring.twoPtAvailable ? 'opacity-30 cursor-not-allowed' : ''} ${recommendedPlay === PlayType.TWO_PT ? 'bg-emerald-900/50 border-emerald-500' : 'bg-slate-700 border-slate-600 hover:border-slate-500'}`}
            >
              {!eraConfig.scoring.twoPtAvailable && <div className="absolute inset-0 flex items-center justify-center text-red-500 font-black rotate-12 text-2xl opacity-50">N/A</div>}
              <div className="font-bold text-white text-xl">Go for 2</div>
              <div className="text-xs text-slate-400 mt-1">2 Points</div>
            </button>
          </div>
        </div>
      );
    }
  }

  // --- STANDARD PLAYBOOK ---
  if (isDefense) {
    const defPlays = [
      { type: DefensivePlayType.STANDARD, label: 'Base Defense', desc: 'Balanced approach' },
      { type: DefensivePlayType.RUN_DEFENSE, label: 'Stack Box', desc: 'Stops Run, weak to Pass' },
      { type: DefensivePlayType.PASS_DEFENSE, label: 'Zone Coverage', desc: 'Stops Pass, weak to Run' },
      { type: DefensivePlayType.BLITZ, label: 'All Out Blitz', desc: 'High Risk / High Reward' },
    ];

    return (
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl border-t-4 border-t-red-500">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Defensive Strategy
          </h3>
          <div className="text-xs text-slate-400">
            Opponent: <span className="text-emerald-500 font-bold">{possessionTeam}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {defPlays.map((play) => {
            const isRec = recommendedPlay === play.type;
            return (
              <button
                key={play.type}
                onClick={() => onSelectPlay(play.type)}
                disabled={disabled}
                className={`
                  relative overflow-hidden p-3 rounded-lg border-2 text-left transition-all
                  ${isRec
                    ? 'bg-red-900/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                `}
              >
                {isRec && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
                    COACH
                  </div>
                )}
                <div className="font-black text-sm text-slate-200">{play.label}</div>
                <div className="text-[10px] text-slate-400">{play.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard Offense
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
