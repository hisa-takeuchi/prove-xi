import { NextRequest, NextResponse } from 'next/server';
import { createGetMatchesUseCase } from '@/application/usecases/GetMatchesUseCase';
import { MockMatchRepository } from '@/infrastructure/repositories/MockMatchRepository';
import { GetMatchesQuery, League, PredictionStatus, ApiResponse, MatchListResponse } from '@/types';

// Initialize dependencies
const matchRepository = new MockMatchRepository();
const getMatchesUseCase = createGetMatchesUseCase({ matchRepository });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: GetMatchesQuery = {
      league: parseLeague(searchParams.get('league')),
      status: parsePredictionStatus(searchParams.get('status')),
      limit: parseNumber(searchParams.get('limit')),
      offset: parseNumber(searchParams.get('offset')),
    };

    const result = await getMatchesUseCase.execute(query);
    
    const response: ApiResponse<MatchListResponse> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/matches:', error);
    
    const errorResponse: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

function parseLeague(value: string | null): League | undefined {
  if (!value) return undefined;
  
  // Check if the value is a valid League enum value
  if (Object.values(League).includes(value as League)) {
    return value as League;
  }
  
  return undefined;
}

function parsePredictionStatus(value: string | null): PredictionStatus | undefined {
  if (!value) return undefined;
  
  // Check if the value is a valid PredictionStatus enum value
  if (Object.values(PredictionStatus).includes(value as PredictionStatus)) {
    return value as PredictionStatus;
  }
  
  return undefined;
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}