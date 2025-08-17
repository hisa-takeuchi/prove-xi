import { MatchRepository } from '@/domain/repositories/MatchRepository';
import { GetMatchesQuery, MatchListResponse, League } from '@/types';

export interface GetMatchesUseCaseDependencies {
  readonly matchRepository: MatchRepository;
}

export const createGetMatchesUseCase = (dependencies: GetMatchesUseCaseDependencies) => {
  const { matchRepository } = dependencies;

  return {
    async execute(query: GetMatchesQuery): Promise<MatchListResponse> {
      // Validate query parameters
      if (query.limit && (query.limit < 1 || query.limit > 100)) {
        throw new Error('Limit must be between 1 and 100');
      }

      if (query.offset && query.offset < 0) {
        throw new Error('Offset must be non-negative');
      }

      return await matchRepository.findMatches(query);
    },

    async getUpcomingMatches(league?: League, limit = 10): Promise<MatchListResponse> {
      if (league) {
        const matches = await matchRepository.findUpcomingByLeague(league, limit);
        return {
          matches,
          total: matches.length,
          hasMore: false, // For simplicity, assume no pagination for this method
        };
      }

      return await matchRepository.findMatches({ limit });
    },

    async getAcceptingPredictions(limit = 10): Promise<MatchListResponse> {
      const matches = await matchRepository.findAcceptingPredictions(limit);
      return {
        matches,
        total: matches.length,
        hasMore: false,
      };
    },

    async getSupportedLeagues(): Promise<League[]> {
      return await matchRepository.getSupportedLeagues();
    },
  };
};

export type GetMatchesUseCase = ReturnType<typeof createGetMatchesUseCase>;