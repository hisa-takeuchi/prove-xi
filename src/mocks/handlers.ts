import { http, HttpResponse } from 'msw';
import { MockMatchRepository } from '@/infrastructure/repositories/MockMatchRepository';
import { Match, League, PredictionStatus, ApiResponse, MatchListResponse } from '@/types';

// MockMatchRepositoryインスタンスを使用してデータの一貫性を保つ
const mockRepository = new MockMatchRepository();

export const handlers = [
  // GET /api/matches - 試合一覧API
  http.get('/api/matches', async ({ request }) => {
    const url = new URL(request.url);
    const league = url.searchParams.get('league');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');

    try {
      // MockMatchRepositoryを使用してデータを取得
      const query = {
        league: league && league !== 'ALL' ? league as League : undefined,
        status: status && status !== 'ALL' ? status as PredictionStatus : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await mockRepository.findMatches(query);

      const response: ApiResponse<MatchListResponse> = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return HttpResponse.json(response);
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
          },
        },
        { status: 500 }
      );
    }
  }),

  // GET /api/matches/[id] - 試合詳細API
  http.get('/api/matches/:id', async ({ params }) => {
    const { id } = params;
    
    try {
      const match = await mockRepository.findById(id as string);

      if (!match) {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: 'MATCH_NOT_FOUND',
              message: '指定された試合が見つかりませんでした',
            },
          },
          { status: 404 }
        );
      }

      const response: ApiResponse<{ match: Match }> = {
        success: true,
        data: { match },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return HttpResponse.json(response);
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
          },
        },
        { status: 500 }
      );
    }
  }),
];