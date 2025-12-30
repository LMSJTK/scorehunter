import React from 'react';
import { GameState } from '../types';

interface Props {
  state: GameState;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const Scoreboard: React.FC<Props> = ({ state }) => {
  const getFieldPos = () => {
      const loc = state.ballLocation;
      if (loc === 50) return '50 Yard Line';
      if (loc > 50) return `Opp ${100 - loc}`;
      return `Own ${loc}`;
  };

  const getQuarter = (q: number) => {
      if (q > 4) return 'OT';
      return `Q${q}`;
  };

  // Calculate visual position (0-100%)
  // If Home (Left side team) has ball: 0 (Own) -> 100 (Opp) moves Left -> Right
  // If Away (Right side team) has ball: 0 (Own) -> 100 (Opp) moves Right -> Left
  const visualProgress = state.possession === 'home' 
      ? state.ballLocation 
      : 100 - state.ballLocation;

  return (
    <div className="bg-black border-b-4 border-slate-800 shadow-2xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Main Score Area */}
        <div className="flex justify-between items-center font-mono">
            {/* Home Team */}
            <div className="flex-1 text-center border-r border-slate-800">
                <div className={`text-3xl md:text-5xl font-black ${state.possession === 'home' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-500'}`}>
                    {state.homeScore}
                </div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-widest mt-1">{state.homeTeam}</div>
                {state.possession === 'home' && <div className="text-[10px] text-emerald-500 mt-1">● POSSESSION</div>}
            </div>

            {/* Game Clock & Meta */}
            <div className="flex-1 px-4 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-amber-500 tracking-wider">
                    {formatTime(state.timeLeft)}
                </div>
                <div className="text-sm text-slate-400 font-bold mt-1 bg-slate-900 px-3 py-1 rounded">
                    {getQuarter(state.quarter)}
                </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center border-l border-slate-800">
                <div className={`text-3xl md:text-5xl font-black ${state.possession === 'away' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-500'}`}>
                    {state.awayScore}
                </div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-widest mt-1">{state.awayTeam}</div>
                {state.possession === 'away' && <div className="text-[10px] text-emerald-500 mt-1">● POSSESSION</div>}
            </div>
        </div>

        {/* Situational Display */}
        {!state.isGameOver && (
            <div className="mt-4 flex justify-between items-center bg-slate-900/80 rounded px-4 py-2 border border-slate-800">
                <div className="text-emerald-400 font-bold font-mono w-24">
                    {state.down === 1 ? '1st' : state.down === 2 ? '2nd' : state.down === 3 ? '3rd' : '4th'} & {state.distance}
                </div>
                <div className="h-2 flex-1 mx-4 bg-slate-800 rounded-full overflow-hidden relative">
                    {/* Direction Indicator Arrow Background (optional context) */}
                    <div className="absolute inset-0 flex justify-between px-1 items-center opacity-20">
                         <div className={`text-[8px] leading-none ${state.possession === 'away' ? 'text-white' : 'text-transparent'}`}>{'<<<'}</div>
                         <div className={`text-[8px] leading-none ${state.possession === 'home' ? 'text-white' : 'text-transparent'}`}>{'>>>'}</div>
                    </div>

                    {/* Drive Progress Bar (Territory Covered) */}
                    <div 
                        className={`absolute top-0 bottom-0 opacity-30 transition-all duration-500 ${state.possession === 'home' ? 'bg-blue-500 left-0' : 'bg-red-500 right-0'}`}
                        style={{ width: `${state.ballLocation}%` }}
                    />

                    {/* Field Viz Marker (The Ball) */}
                    <div 
                        className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)] transition-all duration-500 z-10"
                        style={{ left: `${visualProgress}%` }}
                    />
                </div>
                <div className="text-slate-400 font-mono text-sm w-24 text-right">
                    {getFieldPos()}
                </div>
            </div>
        )}
        
        {state.isGameOver && (
             <div className="mt-4 text-center bg-red-900/20 text-red-200 border border-red-900/50 py-2 rounded font-bold tracking-widest animate-pulse">
                 FINAL SCORE
             </div>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;