import React, { useMemo } from 'react';
import { PlayResult, PlayType, EraId } from '../types';
import { TEAM_COLORS } from '../constants';

interface Props {
  play: PlayResult | null;
  era: EraId;
  homeTeam: string;
  awayTeam: string;
}

// Coordinate system: 0,0 is top-left. 
// Field width: 300 units.
// LOS (Line of Scrimmage) is roughly at Y = 300.
// Forward direction is UP (negative Y).
// 1 Yard approx 10 units.

const PlayVisualizer: React.FC<Props> = ({ play, era, homeTeam, awayTeam }) => {
  // Memoize the random layout generation so it doesn't jitter on re-renders unless play changes
  const vizData = useMemo(() => {
    if (!play) return null;

    const isPass = play.type === PlayType.PASS;
    const isRun = play.type === PlayType.RUN;
    const isLateral = play.type === PlayType.LATERAL;
    const isKick = play.type === PlayType.PUNT || play.type === PlayType.FG;
    const isKickoff = play.type === PlayType.KICKOFF;
    const yards = play.yardsGained;

    // --- FORMATION GENERATION ---
    // Randomize slightly for "messy" look
    const randOffset = () => (Math.random() - 0.5) * 10;
    
    // Offense
    let offense = [
      { id: 'LT', x: 110, y: 300 },
      { id: 'LG', x: 130, y: 300 },
      { id: 'C',  x: 150, y: 300 },
      { id: 'RG', x: 170, y: 300 },
      { id: 'RT', x: 190, y: 300 },
      { id: 'QB', x: 150, y: 320 }, // QB under center or shotgun
    ];
    
    // Kickoff Formation Override
    if (isKickoff) {
        offense = [
            { id: 'K', x: 150, y: 350 },
            { id: 'L1', x: 130, y: 350 },
            { id: 'L2', x: 110, y: 350 },
            { id: 'L3', x: 90, y: 350 },
            { id: 'L4', x: 70, y: 350 },
            { id: 'L5', x: 50, y: 350 },
            { id: 'R1', x: 170, y: 350 },
            { id: 'R2', x: 190, y: 350 },
            { id: 'R3', x: 210, y: 350 },
            { id: 'R4', x: 230, y: 350 },
            { id: 'R5', x: 250, y: 350 },
        ];
    } else {
        // Normal Offense Era specific tweaks
        let wrCount = 2;
        if (era === EraId.SPREAD || era === EraId.AIR_CORYELL) {
            offense.find(p => p.id === 'QB')!.y = 340; // Shotgun
            wrCount = 3;
        } else if (era === EraId.GENESIS || era === EraId.IRON_MAN) {
            // T-Formation / Single Wing roughly
            offense.find(p => p.id === 'QB')!.x = 160; // Offset
        }
        
        // Skill positions (only for non-kickoff)
        if (wrCount >= 2) {
            offense.push({ id: 'WR1', x: 40, y: 300 }); // Wide Left
            offense.push({ id: 'WR2', x: 260, y: 300 }); // Wide Right
        }
        if (wrCount >= 3) {
            offense.push({ id: 'WR3', x: 80, y: 300 }); // Slot
        }
        
        // Backfield
        if (era === EraId.GENESIS) {
            offense.push({ id: 'FB', x: 140, y: 330 });
            offense.push({ id: 'TB', x: 160, y: 340 });
            offense.push({ id: 'WB', x: 220, y: 310 });
        } else {
            offense.push({ id: 'RB', x: 150, y: 350 }); // Deep back
        }
    }

    // Adjust RB position for Lateral if needed
    if (isLateral) {
        const rb = offense.find(p => p.id === 'RB' || p.id === 'TB');
        if (rb) {
            rb.x = Math.random() > 0.5 ? 90 : 210; // Start wider? Or QB pitches to him
            rb.y = 340;
        }
    }

    const allOffense = offense.map(p => ({...p, x: p.x + randOffset(), y: p.y + randOffset()}));

    // Defense (Red X's by default, changed later) - 4-3 Base default
    let defense = [];
    if (isKickoff) {
        // Return Team
        defense = [
            { id: 'R1', x: 150, y: 50 }, // Deep returner
            { id: 'B1', x: 100, y: 150 },
            { id: 'B2', x: 200, y: 150 },
            { id: 'B3', x: 80, y: 200 },
            { id: 'B4', x: 220, y: 200 },
             // Front Line
            { id: 'F1', x: 150, y: 250 },
            { id: 'F2', x: 120, y: 250 },
            { id: 'F3', x: 180, y: 250 },
            { id: 'F4', x: 90, y: 250 },
            { id: 'F5', x: 210, y: 250 },
        ];
    } else {
        defense = [
            { id: 'DE1', x: 100, y: 290 },
            { id: 'DT1', x: 125, y: 290 },
            { id: 'DT2', x: 175, y: 290 },
            { id: 'DE2', x: 200, y: 290 },
            { id: 'LB1', x: 115, y: 260 }, // Will
            { id: 'LB2', x: 150, y: 260 }, // Mike
            { id: 'LB3', x: 185, y: 260 }, // Sam
            { id: 'CB1', x: 40, y: 280 },
            { id: 'CB2', x: 260, y: 280 },
            { id: 'FS', x: 140, y: 220 },
            { id: 'SS', x: 160, y: 230 },
        ];
    }
    
    defense = defense.map(p => ({...p, x: p.x + randOffset(), y: p.y + randOffset()}));


    // --- ACTION VECTORS ---
    let mainActionPath = "";
    let secondaryPaths: string[] = [];
    let ballEndPos = { x: 150, y: 300 };

    if (isRun) {
        // Run logic: Handoff to RB, then arrow to gap
        const rb = allOffense.find(p => p.id === 'RB' || p.id === 'TB') || allOffense[0];
        const gap = Math.random() > 0.5 ? 20 : -20; // Left or Right bias
        const gainUnits = yards * 10;
        
        // Path: QB to RB (handoff)
        secondaryPaths.push(`M 150 320 L ${rb.x} ${rb.y}`);
        
        // Path: RB run
        // Curve from RB pos to LOS+Gap then up
        const endY = 300 - gainUnits;
        const endX = 150 + (Math.random() * 100 - 50); // Random lateral movement
        mainActionPath = `M ${rb.x} ${rb.y} Q ${150 + gap} 300, ${endX} ${endY}`;
        ballEndPos = { x: endX, y: endY };
    } 
    else if (isLateral) {
         // Lateral: Pitch from QB (center) to RB (Wide) then run upfield
         const rb = allOffense.find(p => p.id === 'RB' || p.id === 'TB') || allOffense[0];
         const gainUnits = yards * 10;
         const isLeft = rb.x < 150;
         
         // Path 1: Pitch
         secondaryPaths.push(`M 150 320 Q 150 330, ${rb.x} ${rb.y}`);

         // Path 2: Run
         const endY = 300 - gainUnits;
         const endX = rb.x + (isLeft ? -20 : 20); // Continue wide?
         mainActionPath = `M ${rb.x} ${rb.y} Q ${isLeft ? 50 : 250} 300, ${endX} ${endY}`;
         ballEndPos = { x: endX, y: endY };
    }
    else if (isPass) {
        // Pass logic: WR routes
        allOffense.filter(p => p.id.startsWith('WR') || p.id === 'TE').forEach((wr, i) => {
            const routeDepth = Math.random() * 100 + 50;
            const routeType = Math.random();
            let routeD = `M ${wr.x} ${wr.y} `;
            if (routeType > 0.6) {
                // Go route
                routeD += `L ${wr.x} ${wr.y - routeDepth}`;
            } else if (routeType > 0.3) {
                // Slant
                routeD += `L ${wr.x} ${wr.y - 20} L 150 ${wr.y - 40}`;
            } else {
                // Out
                routeD += `L ${wr.x} ${wr.y - 40} L ${wr.x < 150 ? 10 : 290} ${wr.y - 40}`;
            }
            secondaryPaths.push(routeD);
        });

        // Ball Flight
        const targetX = 150 + (Math.random() * 200 - 100);
        const targetY = 300 - (yards === 0 ? 0 : yards * 10); // If incomplete/0 gain, roughly LOS or deep incomplete
        
        if (yards === 0 && !play.description.includes("INTERCEPTED")) {
            // Incomplete
            const incDepth = 300 - (Math.random() * 100 + 50);
            mainActionPath = `M 150 320 Q 150 350, ${targetX} ${incDepth}`; // Dropback then throw
        } else {
            // Complete or Int
            mainActionPath = `M 150 320 Q 150 350, ${targetX} ${targetY}`; // Dropback then throw
            ballEndPos = { x: targetX, y: targetY };
        }
    }
    else if (isKick || isKickoff) {
        const kickerX = 150;
        const kickerY = 350;
        // Kickoff goes deeper usually
        const dist = play.yardsGained * (isKickoff ? 5 : 10); // Visual scale
        mainActionPath = `M ${kickerX} ${kickerY} L 150 ${350 - dist}`;
        ballEndPos = { x: 150, y: 350 - dist };
    }

    return { offense: allOffense, defense, mainActionPath, secondaryPaths, ballEndPos, isPass, isRun };
  }, [play, era]);

  if (!play || !vizData) {
      return (
          <div className="h-96 w-full bg-emerald-900 rounded-xl flex items-center justify-center border-4 border-slate-700 shadow-inner">
              <span className="text-emerald-500/50 font-bold text-2xl uppercase font-mono tracking-widest">Awaiting Snap...</span>
          </div>
      );
  }

  // --- COLOR LOGIC ---
  const homeColor = TEAM_COLORS[homeTeam] || '#3b82f6';
  const awayColor = TEAM_COLORS[awayTeam] || '#ef4444';
  
  const isHomeOffense = play.offense === 'home';
  const offenseColor = isHomeOffense ? homeColor : awayColor;
  const defenseColor = isHomeOffense ? awayColor : homeColor;

  // Contrast check
  let finalDefenseColor = defenseColor;
  if (offenseColor === defenseColor) {
      finalDefenseColor = '#ffffff';
  }

  // --- EVENTS DETECTION ---
  const isTD = play.description.includes("TOUCHDOWN");
  const isFumble = play.description.includes("FUMBLE");
  const isInterception = play.description.includes("INTERCEPTED");
  const isSafety = play.description.includes("SAFETY");
  const isTurnoverOnDowns = play.description.includes("TURNOVER ON DOWNS");
  
  // Turnovers or big negative plays turn the action line red
  const isBadPlay = isFumble || isInterception || isTurnoverOnDowns || play.yardsGained < 0;

  return (
    <div className="relative h-96 w-full bg-emerald-900 rounded-xl border-4 border-slate-700 shadow-inner overflow-hidden select-none group">
        
        {/* FIELD MARKINGS */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            {/* Yard lines every 10% (approx 5 yards visually) */}
            {[...Array(10)].map((_, i) => (
                <div key={i} className="absolute w-full h-px bg-white/50" style={{ top: `${i * 10}%` }}></div>
            ))}
            {/* Hash marks */}
            {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute left-[40%] width-[20%] h-px bg-white/30" style={{ top: `${i * 5}%`, width: '20%' }}></div>
            ))}
        </div>

        {/* LINE OF SCRIMMAGE (Blue) */}
        {!play.type.includes("KICK") && (
            <>
                <div className="absolute left-0 right-0 h-1 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ top: '75%' }}></div>
                <div className="absolute left-0 right-0 h-1 bg-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ top: '50%' }}></div>
            </>
        )}

        {/* SVG LAYER FOR PATHS */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet">
            <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill={isBadPlay ? '#ef4444' : '#fbbf24'} />
                </marker>
                 <marker id="arrowhead-white" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#ffffff" />
                </marker>
                {/* Shadow filters for text/circles */}
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="black" floodOpacity="0.8"/>
                </filter>
            </defs>

            {/* Secondary Routes (WRs, decoys) */}
            {vizData.secondaryPaths.map((d, i) => (
                <path key={i} d={d} stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" strokeDasharray="5,5" markerEnd="url(#arrowhead-white)" />
            ))}

            {/* Main Action Path (Ball carrier/Flight) */}
            <path 
                d={vizData.mainActionPath} 
                stroke={isBadPlay ? '#ef4444' : '#fbbf24'} // Red if bad play, Yellow if normal
                strokeWidth="4" 
                fill="none" 
                strokeLinecap="round"
                className="drop-shadow-lg"
                markerEnd="url(#arrowhead)"
                // Simple CSS animation to draw the line
                style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: 1000,
                    animation: 'drawPath 1.5s ease-out forwards'
                }}
            />

            {/* Players - OFFENSE */}
            {vizData.offense.map(p => (
                 <circle 
                    key={p.id} 
                    cx={p.x} 
                    cy={p.y} 
                    r="6" 
                    fill={offenseColor} 
                    stroke="white" 
                    strokeWidth="2" 
                    className="drop-shadow-md" 
                />
            ))}
            
            {/* Players - DEFENSE */}
            {vizData.defense.map(p => (
                 <text 
                    key={p.id} 
                    x={p.x} 
                    y={p.y} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill={finalDefenseColor} 
                    stroke="white"
                    strokeWidth="0.5" // Slight outline for contrast
                    fontSize="16" 
                    fontWeight="900" 
                    style={{ fontFamily: 'sans-serif', filter: 'url(#shadow)' }}
                 >
                    X
                 </text>
            ))}
        </svg>

        {/* OVERLAY TEXT */}
        <div className="absolute top-4 left-4 right-4 text-center pointer-events-none">
            <div className={`
                inline-block px-4 py-2 rounded-lg font-bold font-mono text-lg shadow-xl border border-white/10
                ${isTD ? 'bg-yellow-500/90 text-black' : 
                  (isFumble || isInterception) ? 'bg-red-600/90 text-white' : 
                  'bg-slate-900/80 text-white'}
            `}>
                {play.type} {play.yardsGained !== 0 && (play.yardsGained > 0 ? `+${play.yardsGained}` : `${play.yardsGained}`)} yds
            </div>
        </div>

        {/* TOUCHDOWN GRAPHIC OVERLAY */}
        {isTD && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500 z-10">
                <div className="relative transform rotate-[-5deg]">
                    <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-50 animate-pulse rounded-full"></div>
                    <h1 className="relative text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] stroke-black"
                        style={{ WebkitTextStroke: '2px black', textShadow: '4px 4px 0px #000' }}>
                        TOUCHDOWN!
                    </h1>
                </div>
            </div>
        )}

        {/* TURNOVER GRAPHIC OVERLAY */}
        {(isFumble || isInterception) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500 z-10">
                <div className="relative transform rotate-[5deg]">
                    <div className="absolute inset-0 bg-red-600 blur-3xl opacity-50 animate-pulse rounded-full"></div>
                    <h1 className="relative text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] stroke-black"
                        style={{ WebkitTextStroke: '2px black', textShadow: '4px 4px 0px #000' }}>
                        {isFumble ? "FUMBLE!" : "INTERCEPTED!"}
                    </h1>
                </div>
            </div>
        )}

        {/* TURNOVER ON DOWNS GRAPHIC OVERLAY */}
        {isTurnoverOnDowns && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500 z-10">
                <div className="relative transform rotate-[-2deg]">
                    <div className="absolute inset-0 bg-slate-600 blur-3xl opacity-60 animate-pulse rounded-full"></div>
                    <h1 className="relative text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] stroke-black text-center"
                        style={{ WebkitTextStroke: '2px black', textShadow: '4px 4px 0px #000' }}>
                        TURNOVER<br/>ON DOWNS!
                    </h1>
                </div>
            </div>
        )}

        {/* SAFETY GRAPHIC OVERLAY */}
        {isSafety && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500 z-10">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-600 blur-3xl opacity-50 animate-pulse rounded-full"></div>
                    <h1 className="relative text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] stroke-black"
                        style={{ WebkitTextStroke: '2px black', textShadow: '4px 4px 0px #000' }}>
                        SAFETY!
                    </h1>
                </div>
            </div>
        )}

        <style>{`
            @keyframes drawPath {
                to { stroke-dashoffset: 0; }
            }
        `}</style>
    </div>
  );
};

export default PlayVisualizer;
