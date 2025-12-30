import React from 'react';
import { TEAMS, TEAM_COLORS } from '../constants';

interface Props {
  label: string;
  selectedTeam: string;
  onSelect: (team: string) => void;
  exclude?: string;
}

const TeamPicker: React.FC<Props> = ({ label, selectedTeam, onSelect, exclude }) => {
  const color = TEAM_COLORS[selectedTeam] || '#333';

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</label>
        <div 
            className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" 
            style={{ backgroundColor: color, color: color }}
        />
      </div>
      
      <div className="relative">
        <select
          value={selectedTeam}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none bg-slate-900 border border-slate-600 text-white py-3 px-4 pr-10 rounded-lg font-bold font-mono focus:outline-none focus:border-emerald-500 hover:border-slate-500 transition-colors cursor-pointer"
        >
          {TEAMS.map((team) => (
            <option key={team} value={team} disabled={team === exclude} className="bg-slate-900">
              {team}
            </option>
          ))}
        </select>
        {/* Chevron Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
      </div>
      
      {/* Jersey Preview Strip */}
      <div className="mt-3 h-2 w-full rounded-full opacity-50 transition-colors duration-300" style={{ backgroundColor: color }}></div>
    </div>
  );
};

export default TeamPicker;