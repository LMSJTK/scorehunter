import { ERAS } from '../constants';
import { EraId, GameState, PlayResult, PlayType, DefensivePlayType } from '../types';

// Helper to get a random number between min and max
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

// Helper to roll against a probability (0 to 1)
const roll = (threshold: number) => Math.random() < threshold;

export const initializeGame = (eraId: EraId, homeTeam: string, awayTeam: string): GameState => {
  const era = ERAS[eraId];
  return {
    isPlaying: true,
    isGameOver: false,
    isKickoff: true,
    isPointAfter: false,
    quarter: 1,
    timeLeft: 900,
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

  // PAT Logic
  if (state.isPointAfter) {
    if (era.scoring.twoPtAvailable) {
      // Chart logic: Go for 2 if down by 2, 5, 9, 10 etc.
      if ([-2, -5, -9, -10, -13].includes(scoreDiff)) return PlayType.TWO_PT;
      // Random aggression
      if (scoreDiff < 0 && roll(0.1)) return PlayType.TWO_PT;
    }
    return PlayType.XP;
  }

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
      return PlayType.PASS;
    } else {
      return PlayType.PUNT;
    }
  }

  // 1st-3rd Down Logic
  const rand = Math.random();
  if (state.era === EraId.IRON_MAN && roll(era.probs.waste || 0)) {
    return PlayType.WASTE;
  } else if (rand < era.probs.run) {
    if (roll(0.05)) return PlayType.LATERAL;
    return PlayType.RUN;
  } else if (rand < era.probs.run + era.probs.pass) {
    return PlayType.PASS;
  } else {
    return state.era === EraId.GENESIS ? PlayType.PUNT : PlayType.RUN;
  }
};

/**
 * Determines what the AI defensive coordinator would call in this situation.
 */
export const getDefensiveCoachRecommendation = (state: GameState): DefensivePlayType => {
  const era = ERAS[state.era];

  if (state.isKickoff) {
    return DefensivePlayType.RETURN_SAFE;
  }

  if (state.isPointAfter) {
    // If opponent likely to kick
    if (!era.scoring.twoPtAvailable) return DefensivePlayType.FG_BLOCK;
    // Goal line if 2pt possible and likely
    return DefensivePlayType.GOAL_LINE;
  }

  // 3rd & Long or 4th Down -> Pass Defense
  if ((state.down === 3 && state.distance > 7) || state.down === 4) {
    return DefensivePlayType.PASS_DEFENSE;
  }

  // Short yardage -> Run Defense
  if (state.distance <= 2) {
    return DefensivePlayType.RUN_DEFENSE;
  }

  // Random mix based on Era
  const rand = Math.random();
  if (era.id === EraId.GENESIS || era.id === EraId.IRON_MAN) {
    return rand < 0.7 ? DefensivePlayType.RUN_DEFENSE : DefensivePlayType.STANDARD;
  }

  // Modern Eras: Mix in Blitzes
  if (rand < 0.2) return DefensivePlayType.BLITZ;
  if (rand < 0.6) return DefensivePlayType.STANDARD;
  return DefensivePlayType.PASS_DEFENSE;
};

/**
 * Executes a specific play type (either chosen by user or AI).
 */
export const simulatePlay = (
  state: GameState,
  userPlay?: PlayType | DefensivePlayType,
  userTeamSide: 'home' | 'away' = 'home'
): { newState: GameState; result: PlayResult } => {
  const era = ERAS[state.era];
  const newState = { ...state };

  // Determine who is on offense for this play (before possession changes)
  const currentOffense = newState.possession;
  const isUserOffense = currentOffense === userTeamSide;

  // Determine plays based on user control
  let offPlay: PlayType;
  let defPlay: DefensivePlayType;

  if (newState.isKickoff) {
    // Offense is Kicking Team
    offPlay = PlayType.KICKOFF;
    // Defense is Receiving Team (controls return)
    if (!isUserOffense) {
      // User is Receiving Team
      defPlay = (userPlay as DefensivePlayType) || getDefensiveCoachRecommendation(state);
    } else {
      // AI is Receiving Team
      defPlay = getDefensiveCoachRecommendation(state);
    }
  } else if (newState.isPointAfter) {
    if (isUserOffense) {
      offPlay = (userPlay as PlayType) || getCoachRecommendation(state);
    } else {
      offPlay = getCoachRecommendation(state);
    }

    if (!isUserOffense) {
      defPlay = (userPlay as DefensivePlayType) || getDefensiveCoachRecommendation(state);
    } else {
      defPlay = getDefensiveCoachRecommendation(state);
    }
  } else {
    // Normal Play
    if (isUserOffense) {
      offPlay = (userPlay as PlayType) || getCoachRecommendation(state);
    } else {
      offPlay = getCoachRecommendation(state);
    }

    if (!isUserOffense) {
      defPlay = (userPlay as DefensivePlayType) || getDefensiveCoachRecommendation(state);
    } else {
      defPlay = getDefensiveCoachRecommendation(state);
    }
  }

  // Ensure defPlay is defined
  if (!defPlay) defPlay = DefensivePlayType.STANDARD;

  // Illegal pass check
  if (!era.rules.passLegal && offPlay === PlayType.PASS && !isUserOffense) {
    offPlay = PlayType.RUN;
  }

  let result: PlayResult = {
    type: offPlay,
    defensivePlay: defPlay,
    yardsGained: 0,
    description: '',
    timeElapsed: 0,
    offense: currentOffense
  };

  // Modifiers
  let runDefenseBonus = 0;
  let passDefenseBonus = 0;
  let sackChance = 0;
  let bigPlayChance = 0;

  switch (defPlay) {
    case DefensivePlayType.RUN_DEFENSE:
    case DefensivePlayType.GOAL_LINE:
      runDefenseBonus = 3;
      passDefenseBonus = -0.15;
      bigPlayChance = 0.05;
      break;
    case DefensivePlayType.PASS_DEFENSE:
      runDefenseBonus = -2;
      passDefenseBonus = 0.15;
      bigPlayChance = -0.05;
      break;
    case DefensivePlayType.BLITZ:
      runDefenseBonus = 1;
      sackChance = 0.15;
      bigPlayChance = 0.10;
      break;
    case DefensivePlayType.FG_BLOCK:
      // Weak vs Fake, strong vs Kick
      runDefenseBonus = -5;
      passDefenseBonus = -0.30;
      break;
    case DefensivePlayType.STANDARD:
    default:
      break;
  }

  const distToGoal = 100 - newState.ballLocation;

  // --- EXECUTION ---
  let playTime = 0;

  switch (offPlay) {
    case PlayType.KICKOFF:
      const kickDist = randomInt(45, 75);
      result.yardsGained = kickDist;
      result.possessionChange = true;

      let landingSpot = newState.ballLocation + kickDist;
      let returnYards = 0;

      // Return Logic
      if (landingSpot >= 100) {
        result.description = "Kickoff - Touchback.";
        newState.ballLocation = 20;
      } else {
        // Calculate Return
        let baseReturn = randomInt(10, 25);
        let fumbleRisk = era.rules.fumbleRate * 1.5;

        if (defPlay === DefensivePlayType.RETURN_SAFE) {
          baseReturn -= 5;
          fumbleRisk = 0;
          result.description = `Kickoff of ${kickDist} yards. Safe return for ${Math.max(0, baseReturn)} yards.`;
        } else if (defPlay === DefensivePlayType.RETURN_AGGRESSIVE) {
          baseReturn += 10;
          fumbleRisk *= 3;
          // Big return chance
          if (roll(0.05)) baseReturn += randomInt(20, 60);
          result.description = `Kickoff of ${kickDist} yards. Aggressive return for ${baseReturn} yards.`;
        } else {
          result.description = `Kickoff of ${kickDist} yards. Returned ${baseReturn} yards.`;
        }

        if (roll(fumbleRisk)) {
          result.description += " FUMBLE on return! Kicking team recovers!";
          result.turnover = true;
          // Kicking team keeps ball
          result.possessionChange = false;
          // Recovered at end of run
          newState.ballLocation = landingSpot - baseReturn;
        } else {
          returnYards = baseReturn;
          // New Spot = 100 - (Landing - Return)
          newState.ballLocation = 100 - (landingSpot - returnYards);
        }
      }

      newState.isKickoff = false;
      newState.down = 1;
      newState.distance = 10;
      playTime = randomInt(10, 20);
      break;

    case PlayType.XP:
      let xpChance = 0.96;
      // Distance difficulty
      if (era.rules.xpLine > 10) xpChance = 0.93; // Modern
      if (era.id === EraId.GENESIS) xpChance = 0.85;

      // Block chance
      if (defPlay === DefensivePlayType.FG_BLOCK && roll(0.05)) {
        xpChance = 0;
        result.description = "Extra Point BLOCKED!";
      }

      if (roll(xpChance)) {
        result.description = "Extra Point is GOOD.";
        result.scoreChange = {
          team: newState.possession,
          points: era.scoring.xp,
          type: 'XP'
        };
      } else if (xpChance > 0) {
        result.description = "Extra Point is NO GOOD (Wide).";
      }

      newState.isPointAfter = false;
      newState.isKickoff = true;
      newState.ballLocation = era.rules.kickoffLine;
      result.possessionChange = false; // Kickoff pending
      playTime = 0; // Untimed down usually
      break;

    case PlayType.TWO_PT:
      // Essentially a short yardage play from the 2
      let conversionSuccess = false;
      // Simple logic: Run vs Pass
      if (roll(0.5)) {
        // Run
        let pwr = randomInt(1, 100) + (defPlay === DefensivePlayType.GOAL_LINE ? -20 : 0);
        if (pwr > 40) conversionSuccess = true;
        result.description = conversionSuccess ? "2-Pt Conversion (Run) SUCCESS!" : "2-Pt Conversion (Run) STOPPED.";
      } else {
        // Pass
        let acc = randomInt(1, 100) + (defPlay === DefensivePlayType.PASS_DEFENSE ? -20 : 0);
        if (acc > 45) conversionSuccess = true;
        result.description = conversionSuccess ? "2-Pt Conversion (Pass) SUCCESS!" : "2-Pt Conversion (Pass) INCOMPLETE.";
      }

      if (conversionSuccess) {
        result.scoreChange = {
          team: newState.possession,
          points: 2,
          type: '2PT'
        };
      }

      newState.isPointAfter = false;
      newState.isKickoff = true;
      newState.ballLocation = era.rules.kickoffLine;
      result.possessionChange = false;
      playTime = 0;
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
      newState.ballLocation = 100 - (newState.ballLocation + puntDist);
      if (newState.ballLocation < 0) newState.ballLocation = 20;
      newState.down = 1;
      newState.distance = 10;
      playTime = randomInt(10, 20);
      break;

    case PlayType.FG:
      let fgChance = 0.6;
      if (state.era === EraId.GENESIS || state.era === EraId.IRON_MAN) fgChance = 0.4;
      if (state.era === EraId.IRON_MAN) fgChance = 0.7;
      if (state.era === EraId.STRATEGY) fgChance = 0.85;

      // Block check
      if (defPlay === DefensivePlayType.FG_BLOCK && roll(0.10)) {
        fgChance = 0;
        result.description = "Field Goal BLOCKED!";
      } else {
        fgChance -= (distToGoal - 20) * 0.01;
      }

      if (roll(fgChance)) {
        result.description = `Field Goal from ${distToGoal + 17} yards is GOOD!`;
        result.scoreChange = {
          team: newState.possession,
          points: era.scoring.fg,
          type: 'FG'
        };
        newState.isKickoff = true;
        newState.ballLocation = era.rules.kickoffLine;
        result.possessionChange = false;
      } else {
        result.description = `Field Goal from ${distToGoal + 17} yards is NO GOOD.`;
        result.possessionChange = true;
        newState.ballLocation = 100 - newState.ballLocation;
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
      if (offPlay === PlayType.PASS && !era.rules.passLegal) {
        if (roll(0.8)) {
          result.description = "Illegal Forward Pass! Penalty.";
          yards = -5;
          if (era.rules.incompletionPenalty) {
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
          newState.ballLocation += yards;
          newState.distance -= yards;
          break;
        }
      }

      // Sack Check
      if (offPlay === PlayType.PASS && sackChance > 0 && roll(sackChance)) {
        yards = randomInt(-8, -1);
        result.description = `SACKED for ${yards} yards!`;
        result.yardsGained = yards;
        newState.ballLocation += yards;
        newState.distance -= yards;

        if (newState.down === 4) {
          result.description += " TURNOVER ON DOWNS.";
          result.possessionChange = true;
          newState.ballLocation = 100 - newState.ballLocation;
        } else {
          newState.down++;
        }
        playTime = randomInt(5, 10);
        break;
      }

      // Turnover Check
      let fumbleChance = era.rules.fumbleRate;
      if (offPlay === PlayType.LATERAL) fumbleChance *= 1.5;

      if (offPlay !== PlayType.PASS && roll(fumbleChance)) {
        isTurnover = true;
        result.description = "FUMBLE! Turnover.";
      } else if (offPlay === PlayType.PASS && roll(era.rules.interceptionRate)) {
        isTurnover = true;
        result.description = "INTERCEPTED!";
      } else if (offPlay === PlayType.PASS && state.era === EraId.GENESIS && roll(0.6)) {
        if (era.rules.incompletionPenalty) {
          result.description = "Incomplete pass! 15 yard penalty.";
          yards = -15;
        } else {
          result.description = "Incomplete pass.";
          isIncomplete = true;
        }
      } else {
        // Successful Play
        if (offPlay === PlayType.RUN) {
          yards = randomInt(-2, 12) - runDefenseBonus;
          if (roll(0.05 + bigPlayChance)) yards += randomInt(10, 40);
          result.description = `Run for ${yards} yards.`;
        } else if (offPlay === PlayType.LATERAL) {
          const outcome = Math.random();
          if (outcome < 0.25) {
            yards = randomInt(-7, -2) - runDefenseBonus;
            result.description = `Toss play stuffed for ${yards} yards.`;
          } else if (outcome < 0.40) {
            yards = randomInt(-1, 2) - runDefenseBonus;
            result.description = `Lateral goes for ${yards} yards.`;
          } else {
            yards = randomInt(5, 20) - runDefenseBonus;
            if (roll(0.15 + bigPlayChance)) yards += randomInt(20, 50);
            result.description = `Toss to the outside for ${yards} yards.`;
          }
        } else {
          const completionChance = 0.60 - passDefenseBonus;
          if (roll(completionChance)) {
            yards = randomInt(5, 20);
            if (roll(0.10 + bigPlayChance)) yards += randomInt(20, 60);
            result.description = `Pass complete for ${yards} yards.`;
          } else {
            yards = 0;
            result.description = "Pass incomplete.";
            isIncomplete = true;
          }
        }
      }

      if (isTurnover) {
        result.possessionChange = true;
        result.turnover = true;
        newState.ballLocation = 100 - (newState.ballLocation + yards);
        newState.down = 1;
        newState.distance = 10;
        playTime = randomInt(10, 20);
      } else if (isIncomplete) {
        result.yardsGained = 0;
        if (newState.down === 4) {
          result.description += " TURNOVER ON DOWNS.";
          result.possessionChange = true;
          newState.ballLocation = 100 - newState.ballLocation;
        } else {
          newState.down++;
        }
        playTime = randomInt(5, 10);
      } else {
        result.yardsGained = yards;
        newState.ballLocation += yards;
        newState.distance -= yards;

        if (offPlay === PlayType.PASS) {
          playTime = randomInt(25, 40);
        } else {
          playTime = randomInt(30, 45);
        }

        if (newState.ballLocation >= 100) {
          isTD = true;
          result.description += " TOUCHDOWN!";
          result.scoreChange = {
            team: newState.possession,
            points: era.scoring.td,
            type: 'TD'
          };

          // Trigger PAT
          newState.isPointAfter = true;
          newState.isKickoff = false; // Not yet

          // Set Ball for PAT
          newState.ballLocation = 100 - era.rules.xpLine;
          newState.down = 1;
          newState.distance = era.rules.xpLine; // Distance to goal

          playTime = randomInt(5, 10);
        } else if (newState.distance <= 0) {
          newState.down = 1;
          newState.distance = 10;
          result.description += " FIRST DOWN!";
        } else {
          if (newState.down === 4) {
            result.description += " TURNOVER ON DOWNS.";
            result.possessionChange = true;
            newState.ballLocation = 100 - newState.ballLocation;
          } else {
            newState.down++;
          }
        }
      }
      break;
  }

  // Safety Check
  if (newState.ballLocation <= 0 && !result.possessionChange && offPlay !== PlayType.KICKOFF) {
    result.description += " SAFETY!";
    result.scoreChange = {
      team: newState.possession === 'home' ? 'away' : 'home',
      points: era.scoring.safety,
      type: 'SAFETY'
    };

    newState.isKickoff = true;
    newState.isPointAfter = false;
    newState.ballLocation = 20;
    result.possessionChange = false;
    playTime = randomInt(5, 10);
  }

  result.timeElapsed = playTime;
  newState.timeLeft -= result.timeElapsed;

  // Game Over / Quarter End Check
  if (newState.timeLeft <= 0) {
    if (newState.quarter >= 4) {
      if (newState.homeScore === newState.awayScore && era.rules.otEnabled && newState.quarter === 4) {
        newState.quarter = 5;
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

  if (result.possessionChange && !newState.isGameOver) {
    newState.possession = newState.possession === 'home' ? 'away' : 'home';
    newState.down = 1;
    newState.distance = 10;
  }

  if (result.scoreChange) {
    if (result.scoreChange.team === 'home') newState.homeScore += result.scoreChange.points;
    else newState.awayScore += result.scoreChange.points;
  }

  newState.playLog = [result, ...newState.playLog];
  return { newState, result };
};
