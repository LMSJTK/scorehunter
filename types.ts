
export enum EraId {
  GENESIS = '1869_1919',
  IRON_MAN = '1920_1932',
  BREAKOUT = '1933_1949',
  DEAD_BALL = '1950_1977',
  AIR_CORYELL = '1978_1992',
  STRATEGY = '1993_2010',
  SPREAD = '2011_PRES',
}

export interface EraConfig {
  id: EraId;
  name: string;
  yearRange: string;
  description: string;
  scoring: {
    td: number;
    fg: number;
    safety: number;
    xp: number; // 1 point conversion
    twoPtAvailable: boolean;
  };
  probs: {
    run: number;
    pass: number;
    kick: number; // Punt or FG
    waste?: number; // Special for Iron Man era
  };
  rules: {
    passLegal: boolean;
    hashMarks: boolean;
    otEnabled: boolean;
    kickoffLine: number;
    fumbleRate: number;
    interceptionRate: number;
    incompletionPenalty: boolean; // Era 1 specific
  };
}

export enum PlayType {
  RUN = 'RUN',
  PASS = 'PASS',
  LATERAL = 'LATERAL',
  KICK = 'KICK',
  WASTE = 'WASTE', // Centering the ball
  PUNT = 'PUNT',
  FG = 'FG',
  XP = 'XP',
  TWO_PT = 'TWO_PT',
  KICKOFF = 'KICKOFF'
}

export enum DefensivePlayType {
  STANDARD = 'STANDARD',
  RUN_DEFENSE = 'RUN_DEFENSE', // Stuffs runs, weak to pass
  PASS_DEFENSE = 'PASS_DEFENSE', // Stops deep passes, allows short runs
  BLITZ = 'BLITZ', // High risk/reward: Sacks or Big Plays
}

export interface PlayResult {
  type: PlayType;
  defensivePlay?: DefensivePlayType;
  yardsGained: number;
  description: string;
  scoreChange?: {
    team: 'home' | 'away';
    points: number;
    type: 'TD' | 'FG' | 'SAFETY' | 'XP' | '2PT';
  };
  turnover?: boolean;
  timeElapsed: number;
  newDown?: number;
  newDistance?: number;
  newBallLocation?: number; // 0 to 100 (0 is home endzone, 100 is away endzone)
  possessionChange?: boolean;
  offense: 'home' | 'away';
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  isKickoff: boolean; // New flag to track if next play must be a kickoff
  quarter: number;
  timeLeft: number; // Seconds remaining in quarter
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  possession: 'home' | 'away';
  down: number;
  distance: number;
  ballLocation: number; // 0-100. 50 is midfield. 90 is opponent 10 yard line.
  playLog: PlayResult[];
  era: EraId;
}

export interface ScoragamiEntry {
  winnerScore: number;
  loserScore: number;
  count: number;
  firstDiscovered: number; // Timestamp
  lastEra: string;
}
