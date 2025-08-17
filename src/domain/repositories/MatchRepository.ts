import { Match, MatchId, League, GetMatchesQuery, MatchListResponse } from '@/types';

export interface MatchRepository {
  /**
   * Get matches based on query parameters
   */
  findMatches(query: GetMatchesQuery): Promise<MatchListResponse>;
  
  /**
   * Get a specific match by ID
   */
  findById(matchId: MatchId): Promise<Match | null>;
  
  /**
   * Get upcoming matches for a specific league
   */
  findUpcomingByLeague(league: League, limit?: number): Promise<Match[]>;
  
  /**
   * Get matches accepting predictions
   */
  findAcceptingPredictions(limit?: number): Promise<Match[]>;
  
  /**
   * Get all supported leagues
   */
  getSupportedLeagues(): Promise<League[]>;
}