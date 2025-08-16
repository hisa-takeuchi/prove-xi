// PROVEXI Core Type Definitions

// Domain Value Objects
export type UserId = string;
export type MatchId = string;
export type TeamId = string;
export type PlayerId = string;
export type PredictionId = string;
export type FormationId = string;

// Core Entities
export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly nickname: string;
  readonly favoriteClub?: TeamId;
  readonly totalPoints: number;
  readonly subscriptionPlan: SubscriptionPlan;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Team {
  readonly id: TeamId;
  readonly name: string;
  readonly shortName: string;
  readonly logo: string;
  readonly league: string;
  readonly country: string;
}

export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly position: Position;
  readonly teamId: TeamId;
  readonly number?: number;
  readonly photo?: string;
}

export interface Match {
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

export interface Prediction {
  readonly id: PredictionId;
  readonly userId: UserId;
  readonly matchId: MatchId;
  readonly formation: Formation;
  readonly startingEleven: StartingEleven;
  readonly submittedAt: Date;
  readonly points?: number;
}

export interface Formation {
  readonly id: FormationId;
  readonly system: FormationSystem;
  readonly name: string;
}

export interface StartingEleven {
  readonly players: readonly PlayerPosition[];
}

export interface PlayerPosition {
  readonly player: Player;
  readonly position: FieldPosition;
}

// Enums
export enum SubscriptionPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED'
}

// Match Status for Prediction UI
export enum PredictionStatus {
  ACCEPTING = 'ACCEPTING',      // 予想受付中
  CLOSED = 'CLOSED',           // 受付終了  
  FINISHED = 'FINISHED'        // 結果確定
}

// League types
export enum League {
  PREMIER_LEAGUE = 'PREMIER_LEAGUE',
  LA_LIGA = 'LA_LIGA',
  BUNDESLIGA = 'BUNDESLIGA',
  SERIE_A = 'SERIE_A',
  LIGUE_1 = 'LIGUE_1'
}

export enum Position {
  GOALKEEPER = 'GOALKEEPER',
  DEFENDER = 'DEFENDER',
  MIDFIELDER = 'MIDFIELDER',
  FORWARD = 'FORWARD'
}

export enum FormationSystem {
  'FOUR_FOUR_TWO' = '4-4-2',
  'FOUR_THREE_THREE' = '4-3-3',
  'FOUR_TWO_THREE_ONE' = '4-2-3-1',
  'THREE_FIVE_TWO' = '3-5-2',
  'FIVE_THREE_TWO' = '5-3-2'
}

// Field Position (for tactical positioning)
export interface FieldPosition {
  readonly x: number; // 0-100 (left to right)
  readonly y: number; // 0-100 (defensive to attacking)
}

// API Response Types
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly meta?: {
    readonly timestamp: string;
    readonly version?: string;
  };
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

// Application DTOs
export interface CreatePredictionDto {
  readonly matchId: MatchId;
  readonly formationSystem: FormationSystem;
  readonly players: readonly {
    readonly playerId: PlayerId;
    readonly position: FieldPosition;
  }[];
}

export interface UserStatsDto {
  readonly totalPredictions: number;
  readonly correctPredictions: number;
  readonly averagePoints: number;
  readonly rank: number;
  readonly currentStreak: number;
}

// Match List DTOs
export interface GetMatchesQuery {
  readonly league?: League;
  readonly status?: PredictionStatus;
  readonly limit?: number;
  readonly offset?: number;
}

export interface MatchListResponse {
  readonly matches: readonly Match[];
  readonly total: number;
  readonly hasMore: boolean;
}