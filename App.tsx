import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TEAMS, ERAS } from './constants';
import { EraId, GameState, ScoragamiEntry, PlayType, DefensivePlayType } from './types';
import { initializeGame, simulatePlay, getCoachRecommendation, getDefensiveCoachRecommendation } from './services/footballEngine';
import Scoreboard from './components/Scoreboard';
import EraSelector from './components/EraSelector';
import PlayLog from './components/PlayLog';
import ScoragamiGrid from './components/ScoragamiGrid';
import PlayVisualizer from './components/PlayVisualizer';
import PlaybookSelector from './components/PlaybookSelector';
import TeamPicker from './components/TeamPicker';

type ViewMode = 'log' | 'visual';

const App: React.FC = () => {
  // --- STATE ---
  const [selectedEra, setSelectedEra] = useState<EraId>(EraId.STRATEGY);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [scoragamiHistory, setScoragamiHistory] = useState<ScoragamiEntry[]>([]);
  const [autoSim, setAutoSim] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('log');
  
  // Team Selection State
  const [homeTeam, setHomeTeam] = useState<string>(TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState<string>(TEAMS[1]);

  // User Control State - which team is the user controlling?
  const [userSide, setUserSide] = useState<'home' | 'away'>('home');

  // --- PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem('chronogrid_scoragami');
    if (saved) {
      try {
        setScoragamiHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    // Randomize initial teams
    randomizeTeams();
  }, []);

  const saveScoragami = (winnerScore: number, loserScore: number, era: string) => {
    const w = Math.max(winnerScore, loserScore);
    const l = Math.min(winnerScore, loserScore);
    
    setScoragamiHistory(prev => {
      const exists = prev.find(p => p.winnerScore === w && p.loserScore === l);
      if (exists) {
        return prev;
      }
      
      const newEntry: ScoragamiEntry = {
        winnerScore: w,
        loserScore: l,
        count: 1,
        firstDiscovered: Date.now(),
        lastEra: era
      };
      
      const updated = [...prev, newEntry];
      localStorage.setItem('chronogrid_scoragami', JSON.stringify(updated));
      return updated;
    });
  };

  // --- GAMEPLAY ACTIONS ---
  
  const randomizeTeams = () => {
      const h = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      let a = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      while (a === h) a = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      setHomeTeam(h);
      setAwayTeam(a);
  };

  const startGame = () => {
    setGameState(initializeGame(selectedEra, homeTeam, awayTeam));
    setAutoSim(false);
    setViewMode('log'); // Reset to log on new game
  };

  const handleSimulatePlay = useCallback((playChoice?: PlayType | DefensivePlayType) => {
    if (!gameState || gameState.isGameOver) return;

    const { newState, result } = simulatePlay(gameState, playChoice, userSide);
    setGameState(newState);

    if (newState.isGameOver) {
      setAutoSim(false);
      saveScoragami(newState.homeScore, newState.awayScore, ERAS[selectedEra].name);
    }
  }, [gameState, selectedEra, userSide]);

  const toggleAutoSim = () => {
    if (gameState?.isGameOver) return;
    setAutoSim(!autoSim);
  };

  // Auto Sim Effect
  useEffect(() => {
    let interval: any;
    if (autoSim && gameState && !gameState.isGameOver) {
      // Slower simulation if in visual mode so user can see the diagram
      const speed = viewMode === 'visual' ? 2000 : 100;
      interval = setInterval(() => {
        handleSimulatePlay(); // No arg = Auto Sim decides
      }, speed);
    }
    return () => clearInterval(interval);
  }, [autoSim, gameState, handleSimulatePlay, viewMode]);

  // Derived State
  const isUserDefense = gameState ? gameState.possession !== userSide : false;

  const recommendedPlay = useMemo(() => {
    if (!gameState) return PlayType.RUN;
    if (isUserDefense) return getDefensiveCoachRecommendation(gameState);
    return getCoachRecommendation(gameState);
  }, [gameState, isUserDefense]);

  // --- RENDER ---

  return (
    <div className="bg-slate-950 min-h-screen pb-20">
      {/* HEADER */}
      {gameState ? <Scoreboard state={gameState} /> : (
        <div className="py-12 text-center bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">CHRONO<span className="text-emerald-500">GRID</span></h1>
          <p className="text-slate-400">Tactical Football Simulator & Scoragami Hunter</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Controls & Era */}
        <div className="lg:col-span-2 space-y-6">
          <EraSelector 
            selectedEra={selectedEra} 
            onSelect={setSelectedEra} 
            disabled={!!gameState && !gameState.isGameOver}
          />

          {!gameState ? (
             <div className="space-y-4">
                 {/* Team Selection */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TeamPicker label="Home Team" selectedTeam={homeTeam} onSelect={setHomeTeam} exclude={awayTeam} />
                    <TeamPicker label="Away Team" selectedTeam={awayTeam} onSelect={setAwayTeam} exclude={homeTeam} />
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex gap-3">
                    <button 
                        onClick={randomizeTeams} 
                        className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-colors"
                        title="Randomize Teams"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                    <button 
                        onClick={startGame}
                        className="flex-1 py-4 text-xl font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all active:scale-[0.98]"
                    >
                    INITIALIZE SIMULATION
                    </button>
                 </div>
             </div>
          ) : (
            <div className="space-y-4">
                {/* Team Control Toggle */}
                <div className="flex justify-center">
                  <div className="bg-slate-900 p-1 rounded-full border border-slate-700 flex text-xs font-bold">
                    <button
                      onClick={() => setUserSide('home')}
                      className={`px-4 py-1.5 rounded-full transition-all ${userSide === 'home' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Play as {gameState.homeTeam}
                    </button>
                    <button
                      onClick={() => setUserSide('away')}
                      className={`px-4 py-1.5 rounded-full transition-all ${userSide === 'away' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Play as {gameState.awayTeam}
                    </button>
                  </div>
                </div>

                {/* GAME CONTROLS AREA */}
                {!gameState.isGameOver && (
                    <div className="flex flex-col gap-4">
                        {/* If AutoSim is ON, show status. If OFF, show Playbook. */}
                        {autoSim ? (
                             <button
                                onClick={toggleAutoSim}
                                className="w-full py-8 bg-amber-600 hover:bg-amber-500 border border-amber-500 text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center animate-pulse gap-2"
                             >
                                <span className="text-2xl">SIMULATION RUNNING</span>
                                <span className="text-xs font-mono uppercase">Click to take control</span>
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <PlaybookSelector
                                    onSelectPlay={(type) => handleSimulatePlay(type)}
                                    recommendedPlay={recommendedPlay}
                                    era={selectedEra}
                                    disabled={false}
                                    possessionTeam={gameState.possession === 'home' ? gameState.homeTeam : gameState.awayTeam}
                                    isDefense={isUserDefense}
                                    isKickoff={gameState.isKickoff}
                                    isPointAfter={gameState.isPointAfter}
                                />
                                <div className="text-center">
                                    <button 
                                        onClick={toggleAutoSim}
                                        className="text-xs text-emerald-500 hover:text-emerald-400 font-mono underline"
                                    >
                                        RESUME AUTO-SIMULATION
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {gameState.isGameOver && (
                       <button 
                        onClick={() => setGameState(null)}
                        className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl shadow-lg border border-slate-600"
                       >
                           RETURN TO MENU
                       </button>
                )}

                {/* MODE TOGGLE */}
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setViewMode('log')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all ${viewMode === 'log' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Play Log
                    </button>
                    <button 
                        onClick={() => setViewMode('visual')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all ${viewMode === 'visual' ? 'bg-emerald-900/50 text-emerald-400 shadow border border-emerald-900' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Visual Playbook
                    </button>
                </div>

                {/* VIEW AREA */}
                {viewMode === 'log' ? (
                    <PlayLog logs={gameState.playLog} />
                ) : (
                    <div key={gameState.playLog.length}> {/* Force re-mount for animation */}
                        <PlayVisualizer 
                            play={gameState.playLog.length > 0 ? gameState.playLog[0] : null} 
                            era={selectedEra}
                            homeTeam={gameState.homeTeam}
                            awayTeam={gameState.awayTeam}
                        />
                         <div className="mt-2 text-center text-xs text-slate-500 font-mono">
                            Auto-Sim speed is reduced in Visual Mode
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Scoragami */}
        <div className="space-y-6">
          <ScoragamiGrid 
            history={scoragamiHistory} 
            currentHome={gameState?.homeScore || 0} 
            currentAway={gameState?.awayScore || 0}
          />
          
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Latest Discoveries</h4>
              <div className="space-y-2">
                  {[...scoragamiHistory].sort((a,b) => b.firstDiscovered - a.firstDiscovered).slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2 last:border-0">
                          <span className="font-mono text-emerald-400 font-bold">{entry.winnerScore} - {entry.loserScore}</span>
                          <span className="text-slate-500 text-xs">{entry.lastEra}</span>
                      </div>
                  ))}
                  {scoragamiHistory.length === 0 && <div className="text-slate-600 text-xs italic">No games recorded yet.</div>}
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;