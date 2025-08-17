import { MatchRepository } from '@/domain/repositories/MatchRepository';
import { Match, MatchId, League, PredictionStatus, GetMatchesQuery, MatchListResponse, MatchStatus, MatchPrediction, LiveOdds } from '@/types';
import { createMatch, calculatePredictionStatus } from '@/domain/entities/Match';
import { createTeam } from '@/domain/entities/Team';

export class MockMatchRepository implements MatchRepository {
  private readonly mockMatches: Match[];

  constructor() {
    this.mockMatches = this.generateMockMatches();
  }

  async findMatches(query: GetMatchesQuery): Promise<MatchListResponse> {
    let filteredMatches = [...this.mockMatches];

    // Filter by league
    if (query.league) {
      filteredMatches = filteredMatches.filter(match => match.league === query.league);
    }

    // Filter by prediction status
    if (query.status) {
      filteredMatches = filteredMatches.filter(match => match.predictionStatus === query.status);
    }

    // Sort by kickoff time
    filteredMatches.sort((a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginatedMatches = filteredMatches.slice(offset, offset + limit);

    return {
      matches: paginatedMatches,
      total: filteredMatches.length,
      hasMore: offset + limit < filteredMatches.length,
    };
  }

  async findById(matchId: MatchId): Promise<Match | null> {
    return this.mockMatches.find(match => match.id === matchId) || null;
  }

  async findUpcomingByLeague(league: League, limit = 10): Promise<Match[]> {
    const now = new Date();
    return this.mockMatches
      .filter(match => match.league === league && match.kickoffTime > now)
      .sort((a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime())
      .slice(0, limit);
  }

  async findAcceptingPredictions(limit = 10): Promise<Match[]> {
    return this.mockMatches
      .filter(match => match.predictionStatus === PredictionStatus.ACCEPTING)
      .sort((a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime())
      .slice(0, limit);
  }

  async getSupportedLeagues(): Promise<League[]> {
    return [League.PREMIER_LEAGUE, League.LA_LIGA, League.BUNDESLIGA, League.SERIE_A, League.LIGUE_1];
  }

  // API-Football 2025年新機能対応メソッド

  async getMatchPrediction(matchId: MatchId): Promise<MatchPrediction | null> {
    const match = await this.findById(matchId);
    if (!match) return null;

    // モック予測データの生成
    return {
      fixtureId: matchId,
      winner: {
        id: Math.random() > 0.5 ? 1 : 2,
        name: Math.random() > 0.5 ? match.homeTeam.name : match.awayTeam.name,
        comment: 'Based on recent form and head-to-head record'
      },
      goals: {
        home: (Math.random() * 3 + 1).toFixed(1),
        away: (Math.random() * 3 + 1).toFixed(1)
      },
      advice: Math.random() > 0.5 ? 'Over 2.5 goals' : 'Under 2.5 goals',
      percent: {
        home: (Math.random() * 40 + 30).toFixed(0) + '%',
        draw: (Math.random() * 30 + 20).toFixed(0) + '%',
        away: (Math.random() * 40 + 30).toFixed(0) + '%'
      },
      comparison: {
        form: {
          home: (Math.random() * 100).toFixed(0) + '%',
          away: (Math.random() * 100).toFixed(0) + '%'
        },
        att: {
          home: (Math.random() * 100).toFixed(0) + '%',
          away: (Math.random() * 100).toFixed(0) + '%'
        },
        def: {
          home: (Math.random() * 100).toFixed(0) + '%',
          away: (Math.random() * 100).toFixed(0) + '%'
        },
        goals: {
          home: (Math.random() * 3 + 1).toFixed(1),
          away: (Math.random() * 3 + 1).toFixed(1)
        }
      }
    };
  }

  async getLiveOdds(matchId: MatchId): Promise<LiveOdds | null> {
    const match = await this.findById(matchId);
    if (!match || match.status !== MatchStatus.LIVE) return null;

    // モックライブオッズデータの生成
    return {
      fixtureId: matchId,
      bookmaker: {
        id: 8,
        name: 'Bet365'
      },
      bets: [
        {
          id: 1,
          name: 'Match Winner',
          values: [
            { value: 'Home', odd: (Math.random() * 2 + 1).toFixed(2) },
            { value: 'Draw', odd: (Math.random() * 2 + 2).toFixed(2) },
            { value: 'Away', odd: (Math.random() * 2 + 1).toFixed(2) }
          ]
        },
        {
          id: 5,
          name: 'Goals Over/Under',
          values: [
            { value: 'Over 2.5', odd: (Math.random() * 1 + 1.5).toFixed(2) },
            { value: 'Under 2.5', odd: (Math.random() * 1 + 1.5).toFixed(2) }
          ]
        }
      ],
      updatedAt: new Date()
    };
  }

  async getMultipleMatches(matchIds: MatchId[]): Promise<Match[]> {
    const matches = await Promise.all(
      matchIds.map(id => this.findById(id))
    );
    return matches.filter((match): match is Match => match !== null);
  }

  private generateMockMatches(): Match[] {
    const now = new Date();
    const teams = this.generateMockTeams();
    
    const matches: Match[] = [];
    
    // Generate matches for the next 7 days
    for (let i = 0; i < 20; i++) {
      const kickoffTime = new Date(now.getTime() + (i * 12 + Math.random() * 12) * 60 * 60 * 1000);
      const predictionDeadline = new Date(kickoffTime.getTime() - 60 * 60 * 1000); // 1 hour before
      
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam.id === homeTeam.id) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      const status = i < 15 ? MatchStatus.SCHEDULED : 
                    i < 18 ? MatchStatus.LIVE : MatchStatus.FINISHED;
      
      const predictionStatus = calculatePredictionStatus(
        kickoffTime,
        predictionDeadline,
        status,
        now
      );

      matches.push(createMatch({
        id: `match-${i + 1}`,
        homeTeam,
        awayTeam,
        kickoffTime,
        status,
        venue: `Stadium ${i + 1}`,
        league: homeTeam.league as League,
        season: '2024-25',
        predictionStatus,
        predictionDeadline,
      }));
    }

    return matches;
  }

  private generateMockTeams() {
    return [
      // Premier League
      createTeam({
        id: 'arsenal',
        name: 'Arsenal',
        shortName: 'ARS',
        logo: '/logos/arsenal.png',
        league: League.PREMIER_LEAGUE,
        country: 'England',
      }),
      createTeam({
        id: 'chelsea',
        name: 'Chelsea',
        shortName: 'CHE',
        logo: '/logos/chelsea.png',
        league: League.PREMIER_LEAGUE,
        country: 'England',
      }),
      createTeam({
        id: 'liverpool',
        name: 'Liverpool',
        shortName: 'LIV',
        logo: '/logos/liverpool.png',
        league: League.PREMIER_LEAGUE,
        country: 'England',
      }),
      createTeam({
        id: 'manchester-city',
        name: 'Manchester City',
        shortName: 'MCI',
        logo: '/logos/man-city.png',
        league: League.PREMIER_LEAGUE,
        country: 'England',
      }),
      // La Liga
      createTeam({
        id: 'real-madrid',
        name: 'Real Madrid',
        shortName: 'RMA',
        logo: '/logos/real-madrid.png',
        league: League.LA_LIGA,
        country: 'Spain',
      }),
      createTeam({
        id: 'barcelona',
        name: 'FC Barcelona',
        shortName: 'BAR',
        logo: '/logos/barcelona.png',
        league: League.LA_LIGA,
        country: 'Spain',
      }),
      // Bundesliga
      createTeam({
        id: 'bayern-munich',
        name: 'Bayern Munich',
        shortName: 'BAY',
        logo: '/logos/bayern.png',
        league: League.BUNDESLIGA,
        country: 'Germany',
      }),
      createTeam({
        id: 'borussia-dortmund',
        name: 'Borussia Dortmund',
        shortName: 'BVB',
        logo: '/logos/dortmund.png',
        league: League.BUNDESLIGA,
        country: 'Germany',
      }),
    ];
  }
}