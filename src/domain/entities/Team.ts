import { Team, TeamId } from '@/types';

export interface TeamProps {
  readonly id: TeamId;
  readonly name: string;
  readonly shortName: string;
  readonly logo: string;
  readonly league: string;
  readonly country: string;
}

export const createTeam = (props: TeamProps): Team => {
  validateTeam(props);
  return {
    ...props,
  };
};

const validateTeam = (props: TeamProps): void => {
  if (!props.id) {
    throw new Error('Team ID is required');
  }
  
  if (!props.name || props.name.trim().length === 0) {
    throw new Error('Team name is required');
  }
  
  if (!props.shortName || props.shortName.trim().length === 0) {
    throw new Error('Team short name is required');
  }
  
  if (props.shortName.length > 5) {
    throw new Error('Team short name must be 5 characters or less');
  }
  
  if (!props.league || props.league.trim().length === 0) {
    throw new Error('Team league is required');
  }
  
  if (!props.country || props.country.trim().length === 0) {
    throw new Error('Team country is required');
  }
};