import { Match, MatchId, Team, MatchStatus, League, PredictionStatus } from '@/types';

export interface MatchProps {
  readonly id: MatchId;
  readonly homeTeam: Team;
  readonly awayTeam: Team;
  readonly kickoffTime: Date;
  readonly status: MatchStatus;
  readonly venue?: string;
  readonly league: League;
  readonly season: string;
  readonly predictionStatus: PredictionStatus;
  readonly predictionDeadline: Date;
}

export const createMatch = (props: MatchProps): Match => {
  validateMatch(props);
  return {
    ...props,
  };
};

const validateMatch = (props: MatchProps): void => {
  if (!props.id) {
    throw new Error('Match ID is required');
  }
  
  if (!props.homeTeam || !props.awayTeam) {
    throw new Error('Both home and away teams are required');
  }
  
  if (props.homeTeam.id === props.awayTeam.id) {
    throw new Error('Home and away teams cannot be the same');
  }
  
  if (!props.kickoffTime) {
    throw new Error('Kickoff time is required');
  }
  
  if (!props.predictionDeadline) {
    throw new Error('Prediction deadline is required');
  }
  
  if (props.predictionDeadline >= props.kickoffTime) {
    throw new Error('Prediction deadline must be before kickoff time');
  }
};

// Business logic for determining prediction status
export const calculatePredictionStatus = (
  kickoffTime: Date,
  predictionDeadline: Date,
  matchStatus: MatchStatus,
  currentTime: Date = new Date()
): PredictionStatus => {
  if (matchStatus === MatchStatus.FINISHED) {
    return PredictionStatus.FINISHED;
  }
  
  if (currentTime >= predictionDeadline) {
    return PredictionStatus.CLOSED;
  }
  
  return PredictionStatus.ACCEPTING;
};

// Business logic for match display
export const isUpcoming = (kickoffTime: Date, currentTime: Date = new Date()): boolean => {
  return kickoffTime > currentTime;
};

export const isPredictionOpen = (predictionStatus: PredictionStatus): boolean => {
  return predictionStatus === PredictionStatus.ACCEPTING;
};