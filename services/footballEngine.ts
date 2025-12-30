import { ERAS } from '../constants';
import { EraId, GameState, PlayResult, PlayType } from '../types';

// Helper to get a random number between min and max
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

// Helper to roll against a probability (0 to 1)
const roll = (threshold: number) => Math.random() < threshold;

export const initializeGame = (eraId: EraId, homeTeam: string, awayTeam: string): GameState => {
  const era = ERAS[eraId];
  return {
    isPlaying: true,
    isGameOver: false,
    isKickoff: true, // Start game with a kickoff
    quarter: 1,
    timeLeft: 900, // 15 mins
    homeScore: 0,
    awayScore: 0,
    homeTeam,
    awayTeam,
    possession: 'home', // Arbitrary start, will kick off
    down: 1,
    distance: 10,
    ballLocation: era.rules.kickoffLine,
    playLog: [],
    era: eraId
  };
};

/**
 * Determines what the AI coach would do in this situation.
 */
export const getCoachRecommendation = (state: GameState): PlayType => {
  if (state.isKickoff) return PlayType.KICKOFF;

  const era = ERAS[state.era];
  const offenseScore = state.possession === 'home' ? state.homeScore : state.awayScore;
  const defenseScore = state.possession === 'home' ? state.awayScore : state.homeScore;
  const scoreDiff = offenseScore - defenseScore;
  const distToGoal = 100 - state.ballLocation;

  // 4th Down Logic
  if (state.down === 4) {
    if (distToGoal <= 35) {
      // Field Goal Range?
      const fgProb = state.era === EraId.GENESIS ? 0.9 : distToGoal > 30 ? 0.5 : 0.95;
      if (roll(fgProb)) {
        return PlayType.FG;
      } else {
        return PlayType.RUN; // Go for it
      }
    } else if (distToGoal < 45 && scoreDiff < 0 && state.timeLeft < 120) {
        // Desperation Hail Mary or Long FG
        return PlayType.PASS;
    } else {
      return PlayType.PUNT;
    }
  } 
  
  // 1st-3rd Down Logic
  const rand = Math.random();
  if (state.era === EraId.IRON_MAN && roll(era.probs.waste || 0)) {
      // Check if we are hypothetically near a sideline (simulated abstractly here)
      return PlayType.WASTE;
  } else if (rand < era.probs.run) {
    // Occasional AI lateral mix-in (5% of run calls)
    if (roll(0.05)) return PlayType.LATERAL;
    return PlayType.RUN;
  } else if (rand < era.probs.run + era.probs.pass) {
    return PlayType.PASS;
  } else {
    return state.era === EraId.GENESIS ? PlayType.PUNT : PlayType.RUN;
  }
};

/**
 * Executes a specific play type (either chosen by user or AI).
 */
export const simulatePlay = (state: GameState, chosenPlay?: PlayType): { newState: GameState; result: PlayResult } => {
  const era = ERAS[state.era];
  const newState = { ...state };
  
  // Determine decision: User choice OR AI recommendation
  let decision = chosenPlay;
  
  // Force Kickoff if state dictates
  if (newState.isKickoff) {
      decision = PlayType.KICKOFF;
  } else if (!decision) {
      decision = getCoachRecommendation(state);
  }

  // Override: Pre-1906 Pass Ban enforcement (Sim engine overrides illegal user choices if strict, 
  // but we'll allow users to try illegal things for fun outcomes/penalties, handled in the switch below)
  if (!era.rules.passLegal && decision === PlayType.PASS && !chosenPlay) {
      // If AI picked pass illegally (shouldn't happen based on probs), force run
      decision = PlayType.RUN;
  }

  // Determine who is on offense for this play (before possession changes)
  const currentOffense = newState.possession;

  let result: PlayResult = {
    type: decision,
    yardsGained: 0,
    description: '',
    timeElapsed: 0, // Calculated at end
    offense: currentOffense
  };

  const distToGoal = 100 - newState.ballLocation;

  // --- EXECUTION LOGIC ---
  let playTime = 0;

  switch (decision) {
    case PlayType.KICKOFF:
        // Similar to Punt, but longer
        const kickDist = randomInt(45, 75);
        result.yardsGained = kickDist;
        result.possessionChange = true;
        
        // Calculate landing spot relative to current field (0 = own endzone)
        // Kickoff starts at ballLocation (e.g. 35). Lands at 35 + 60 = 95.
        // Opponent receives at 95 (which is their 5 yard line).
        // Flip logic: New Location = 100 - (CurrentLoc + Dist)
        
        let landingSpot = newState.ballLocation + kickDist;
        let returnYards = randomInt(15, 30); // Simple return logic
        
        // Touchback logic
        if (landingSpot >= 100) {
            result.description = "Kickoff - Touchback.";
            newState.ballLocation = 20; // Start at 20
        } else {
             result.description = `Kickoff of ${kickDist} yards. Returned ${returnYards} yards.`;
             // New Spot = 100 - (Landing - Return)
             // Example: Kick from 35. Goes 60. Lands at 95.
             // Return 20. Ball at 95 - 20 = 75 (relative to kicker).
             // Flip: 100 - 75 = 25.
             newState.ballLocation = 100 - (landingSpot - returnYards);
        }

        newState.isKickoff = false;
        newState.down = 1;
        newState.distance = 10;
        playTime = randomInt(10, 20);
        break;

    case PlayType.WASTE:
        result.yardsGained = 0;
        result.description = "Ball carrier dives to center the ball away from the sideline.";
        
        if (newState.down === 4) {
            result.description += " TURNOVER ON DOWNS.";
            result.possessionChange = true;
            newState.ballLocation = 100 - newState.ballLocation;
        } else {
            newState.down++;
        }
        
        playTime = randomInt(30, 45);
        break;

    case PlayType.PUNT:
        const puntDist = randomInt(30, 50);
        result.yardsGained = puntDist;
        result.description = `Punt of ${puntDist} yards.`;
        result.possessionChange = true;
        // Flip field
        newState.ballLocation = 100 - (newState.ballLocation + puntDist);
        if (newState.ballLocation < 0) newState.ballLocation = 20; // Touchback
        newState.down = 1;
        newState.distance = 10;
        playTime = randomInt(10, 20); // Special teams plays are quick
        break;

    case PlayType.FG:
        // Accuracy
        let fgChance = 0.6; // Base
        if (state.era === EraId.GENESIS || state.era === EraId.IRON_MAN) fgChance = 0.4;
        if (state.era === EraId.IRON_MAN) fgChance = 0.7; 
        if (state.era === EraId.STRATEGY) fgChance = 0.85;

        // Distance modifier
        fgChance -= (distToGoal - 20) * 0.01;

        if (roll(fgChance)) {
            result.description = `Field Goal from ${distToGoal + 17} yards is GOOD!`;
            result.scoreChange = {
                team: newState.possession,
                points: era.scoring.fg,
                type: 'FG'
            };
            // On Score, set up Kickoff for next play
            newState.isKickoff = true;
            newState.ballLocation = era.rules.kickoffLine;
            result.possessionChange = false; // Keep possession to kick off
        } else {
            result.description = `Field Goal from ${distToGoal + 17} yards is NO GOOD.`;
            result.possessionChange = true;
            newState.ballLocation = 100 - newState.ballLocation; // Turnover at spot
            newState.down = 1;
            newState.distance = 10;
        }
        playTime = randomInt(5, 10);
        break;

    case PlayType.RUN:
    case PlayType.PASS:
    case PlayType.LATERAL:
        let yards = 0;
        let isTurnover = false;
        let isTD = false;
        let isIncomplete = false;

        // Validation for Passing in early eras
        if (decision === PlayType.PASS && !era.rules.passLegal) {
             // If user forced a pass in an illegal era
             if (roll(0.8)) {
                 result.description = "Illegal Forward Pass! Penalty.";
                 yards = -5;
                 
                 // Penalty logic for downs
                 if (era.rules.incompletionPenalty) {
                    // In early eras, some penalties lost down, others didn't. 
                    // Simplifying to down loss for flow.
                    if (newState.down === 4) {
                        result.description += " TURNOVER ON DOWNS.";
                        result.possessionChange = true;
                        newState.ballLocation = 100 - (newState.ballLocation + yards);
                    } else {
                        newState.down++;
                    }
                 }
                 
                 playTime = 10;
                 result.yardsGained = yards;
                 newState.ballLocation += yards; // Backwards
                 newState.distance -= yards; // Increase distance
                 break; 
             }
        }

        // Turnover Check
        // Fumble logic varies by play type
        let fumbleChance = era.rules.fumbleRate;
        if (decision === PlayType.LATERAL) fumbleChance *= 1.5; // Pitch plays are riskier
        
        if (decision !== PlayType.PASS && roll(fumbleChance)) {
             isTurnover = true;
             result.description = "FUMBLE! Turnover.";
        } else if (decision === PlayType.PASS && roll(era.rules.interceptionRate)) {
             isTurnover = true;
             result.description = "INTERCEPTED!";
        } else if (decision === PlayType.PASS && state.era === EraId.GENESIS && roll(0.6)) {
             // Incomplete pass in early era = penalty
             if (era.rules.incompletionPenalty) {
                 result.description = "Incomplete pass! 15 yard penalty.";
                 yards = -15;
             } else {
                 result.description = "Incomplete pass.";
                 isIncomplete = true;
             }
        } else {
            // Successful Play Calculation
            if (decision === PlayType.RUN) {
                // Skewed towards 3-4 yards
                yards = randomInt(-2, 12);
                if (roll(0.05)) yards += randomInt(10, 40);
                result.description = `Run for ${yards} yards.`;
            } else if (decision === PlayType.LATERAL) {
                // High Variance
                const outcome = Math.random();
                if (outcome < 0.25) {
                    // Tackled in backfield
                    yards = randomInt(-7, -2);
                    result.description = `Toss play stuffed for ${yards} yards.`;
                } else if (outcome < 0.40) {
                     // Short gain / No gain
                     yards = randomInt(-1, 2);
                     result.description = `Lateral goes for ${yards} yards.`;
                } else {
                     // Outside seal
                     yards = randomInt(5, 20);
                     if (roll(0.15)) yards += randomInt(20, 50); // Big breakout chance
                     result.description = `Toss to the outside for ${yards} yards.`;
                }
            } else {
                // Pass logic
                if (roll(0.60)) { // Completion rate
                    yards = randomInt(5, 20);
                    if (roll(0.10)) yards += randomInt(20, 60); // Deep ball
                    result.description = `Pass complete for ${yards} yards.`;
                } else {
                    yards = 0;
                    result.description = "Pass incomplete.";
                    isIncomplete = true;
                }
            }
        }

        // Apply Logic
        if (isTurnover) {
            result.possessionChange = true;
            result.turnover = true;
            newState.ballLocation = 100 - (newState.ballLocation + yards); // Simplified recovery spot
            newState.down = 1;
            newState.distance = 10;
            playTime = randomInt(10, 20); // Clock stops on turnover
        } else if (isIncomplete) {
            result.yardsGained = 0;
            
            if (newState.down === 4) {
                result.description += " TURNOVER ON DOWNS.";
                result.possessionChange = true;
                newState.ballLocation = 100 - newState.ballLocation;
            } else {
                newState.down++;
            }
            
            playTime = randomInt(5, 10); // Clock stops on incomplete
        } else {
            result.yardsGained = yards;
            newState.ballLocation += yards;
            newState.distance -= yards;
            
            // Clock Logic for standard play
            if (decision === PlayType.PASS) {
                playTime = randomInt(25, 40);
            } else {
                playTime = randomInt(30, 45); // Runs/Laterals take time
            }

            // TD Check
            if (newState.ballLocation >= 100) {
                isTD = true;
                result.description += " TOUCHDOWN!";
                result.scoreChange = {
                    team: newState.possession,
                    points: era.scoring.td, // Base TD points
                    type: 'TD'
                };

                // XP / 2PT Logic
                const goFor2 = era.scoring.twoPtAvailable && Math.random() < 0.1;
                let extraPoints = 0;
                if (goFor2) {
                    if (roll(0.45)) {
                        extraPoints = 2;
                        result.description += " (2-Pt Conversion Good)";
                    } else {
                        result.description += " (2-Pt Failed)";
                    }
                } else {
                    // XP
                    let xpChance = 0.95;
                    if (state.era === EraId.SPREAD) xpChance = 0.94; // Longer XP
                    if (state.era === EraId.GENESIS) xpChance = 0.85; 
                    
                    if (roll(xpChance)) {
                         extraPoints = era.scoring.xp;
                         result.description += " (XP Good)";
                    } else {
                        result.description += " (XP Missed)";
                    }
                }
                
                if (result.scoreChange) {
                    result.scoreChange.points += extraPoints;
                }

                // Setup Kickoff
                newState.isKickoff = true;
                newState.ballLocation = era.rules.kickoffLine;
                result.possessionChange = false; // Scoring team keeps ball to kick
                
                playTime = randomInt(5, 10); // Clock stops on TD
            } else if (newState.distance <= 0) {
                // First Down
                newState.down = 1;
                newState.distance = 10;
                result.description += " FIRST DOWN!";
            } else {
                // Not a First Down
                if (newState.down === 4) {
                    result.description += " TURNOVER ON DOWNS.";
                    result.possessionChange = true;
                    // Turnover at spot: Field position flips for opponent
                    newState.ballLocation = 100 - newState.ballLocation;
                } else {
                    newState.down++;
                }
            }
        }
        break;
  }

  // Safety Check (Own Endzone)
  if (newState.ballLocation <= 0 && !result.possessionChange && decision !== PlayType.KICKOFF) {
      result.description += " SAFETY!";
      result.scoreChange = {
          team: newState.possession === 'home' ? 'away' : 'home',
          points: era.scoring.safety,
          type: 'SAFETY'
      };
      
      // Safety = Free Kick from 20
      newState.isKickoff = true;
      newState.ballLocation = 20; 
      result.possessionChange = false; // Kicking team keeps ball
      
      playTime = randomInt(5, 10);
  }

  // Assign calculated time
  result.timeElapsed = playTime;

  // Time Management
  newState.timeLeft -= result.timeElapsed;
  if (newState.timeLeft <= 0) {
      if (newState.quarter >= 4) {
          if (newState.homeScore === newState.awayScore && era.rules.otEnabled && newState.quarter === 4) {
              newState.quarter = 5; // OT
              newState.timeLeft = 900;
              result.description += " End of Regulation. Going to Overtime!";
          } else {
              newState.isGameOver = true;
              result.description += " GAME OVER.";
          }
      } else {
          newState.quarter++;
          newState.timeLeft = 900;
          result.description += ` End of Quarter ${newState.quarter - 1}.`;
      }
  }

  // Handle Possession Change
  if (result.possessionChange && !newState.isGameOver) {
      newState.possession = newState.possession === 'home' ? 'away' : 'home';
      // Reset downs, but DO NOT overwrite ballLocation. 
      // The individual play types (Punt, Turnover, Kickoff) must calculate field position logic.
      newState.down = 1;
      newState.distance = 10;
  }

  // Apply Scores
  if (result.scoreChange) {
      if (result.scoreChange.team === 'home') newState.homeScore += result.scoreChange.points;
      else newState.awayScore += result.scoreChange.points;
  }

  newState.playLog = [result, ...newState.playLog];
  return { newState, result };
};
