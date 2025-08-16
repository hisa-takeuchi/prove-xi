# PROVEXI TypeScript型定義書

## 1. 概要

### 1.1. 型定義の目的
- **型安全性の確保**: コンパイル時のエラー検出とランタイムエラーの防止
- **開発効率の向上**: IDEの補完機能とリファクタリング支援
- **コードの可読性**: 明確な型定義による意図の明確化
- **保守性の向上**: 型による契約の明示化

### 1.2. 型定義の原則
- **厳密性**: 可能な限り厳密な型定義を行う
- **再利用性**: 共通の型は再利用可能な形で定義
- **一貫性**: 命名規則と構造の統一
- **拡張性**: 将来の機能追加を考慮した設計

## 2. 基本型定義

### 2.1. プリミティブ型エイリアス

```typescript
// types/primitives.ts

// ID型
export type UserId = string;
export type MatchId = string;
export type TeamId = string;
export type PlayerId = string;
export type LeagueId = string;
export type SeasonId = string;
export type PredictionId = string;
export type SubscriptionPlanId = string;

// 値オブジェクト型
export type Email = string;
export type Nickname = string;
export type Points = number;
export type Timestamp = string; // ISO 8601 format
export type Url = string;

// 列挙型
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type FormationSystem = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' | '5-3-2';
export type SubscriptionPlanType = 'FREE' | 'PREMIUM';
export type PredictionStatus = 'PENDING' | 'COMPLETED';
export type RankingPeriod = 'OVERALL' | 'MONTHLY' | 'WEEKLY';
```

### 2.2. ユーティリティ型

```typescript
// types/utils.ts

// APIレスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: Timestamp;
    requestId?: string;
  };
}

// ページネーション型
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiResponse<T>['meta'] & {
    pagination: PaginationMeta;
  };
}

// フォーム型
export type FormState<T> = {
  [K in keyof T]: {
    value: T[K];
    error?: string;
    touched: boolean;
  };
};

// 部分更新型
export type PartialUpdate<T> = {
  [K in keyof T]?: T[K];
};

// 必須フィールド指定型
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// オプショナルフィールド指定型
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

## 3. ドメインエンティティ型

### 3.1. ユーザー関連型

```typescript
// types/user.ts

export interface User {
  id: UserId;
  email: Email;
  nickname: Nickname;
  favoriteClub?: Team;
  totalPoints: Points;
  subscriptionPlan: SubscriptionPlan;
  avatarUrl?: Url;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  type: SubscriptionPlanType;
  maxPredictionsPerWeek: number;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
}

export interface UserProfile extends User {
  statistics: UserStatistics;
  recentPredictions: Prediction[];
}

export interface UserStatistics {
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  currentRank: number;
  weeklyStats: {
    predictions: number;
    points: Points;
  };
  monthlyStats: {
    predictions: number;
    points: Points;
  };
}

// 認証関連型
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
}

export interface LoginCredentials {
  email: Email;
  password: string;
}

export interface RegisterData {
  email: Email;
  password: string;
  nickname: Nickname;
  favoriteClubId?: TeamId;
}
```

### 3.2. 試合・チーム関連型

```typescript
// types/match.ts

export interface League {
  id: LeagueId;
  name: string;
  country: string;
  logoUrl: Url;
  apiFootballId: number;
  isActive: boolean;
}

export interface Season {
  id: SeasonId;
  leagueId: LeagueId;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isCurrent: boolean;
}

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  logoUrl: Url;
  league: League;
  apiFootballId: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  team: Team;
  position: PlayerPosition;
  jerseyNumber: number;
  nationality: string;
  birthDate?: string; // YYYY-MM-DD
  apiFootballId: number;
}

export interface Match {
  id: MatchId;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  season: Season;
  kickoffTime: Timestamp;
  status: MatchStatus;
  predictionDeadline: Timestamp;
  apiFootballId: number;
  userPrediction?: Prediction;
}

export interface MatchDetail extends Match {
  teams: {
    home: TeamDetail;
    away: TeamDetail;
  };
  result?: MatchResult;
}

export interface TeamDetail extends Team {
  players: Player[];
  recentForm: ('W' | 'L' | 'D')[]; // 最近5試合の結果
}

export interface MatchResult {
  id: string;
  matchId: MatchId;
  homeFormation: FormationSystem;
  awayFormation: FormationSystem;
  lineups: {
    home: LineupPlayer[];
    away: LineupPlayer[];
  };
}

export interface LineupPlayer {
  player: Player;
  position: PlayerPosition;
  positionX: number; // 0-100
  positionY: number; // 0-100
  isStarter: boolean;
}
```

### 3.3. 予想関連型

```typescript
// types/prediction.ts

export interface Prediction {
  id: PredictionId;
  userId: UserId;
  match: Match;
  formation: Formation;
  pointsEarned?: Points;
  status: PredictionStatus;
  submittedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Formation {
  system: FormationSystem;
  players: FormationPlayer[];
}

export interface FormationPlayer {
  player: Player;
  position: PlayerPosition;
  positionX: number; // ピッチ上のX座標 (0-100)
  positionY: number; // ピッチ上のY座標 (0-100)
}

// 予想作成用の型
export interface PredictionDraft {
  matchId: MatchId;
  formation: Partial<Formation>;
  lastSaved?: Timestamp;
  isValid: boolean;
}

export interface PredictionSubmission {
  matchId: MatchId;
  formation: {
    system: FormationSystem;
    players: Array<{
      playerId: PlayerId;
      position: PlayerPosition;
      positionX: number;
      positionY: number;
    }>;
  };
}

// 予想結果分析用の型
export interface PredictionAnalysis {
  prediction: Prediction;
  actualLineup: LineupPlayer[];
  comparison: {
    correctPlayers: Player[];
    correctPositions: Player[];
    totalPoints: Points;
    breakdown: {
      playerPoints: Points;
      positionPoints: Points;
      bonusPoints: Points;
    };
  };
}
```

### 3.4. ランキング関連型

```typescript
// types/ranking.ts

export interface RankingEntry {
  rank: number;
  user: {
    id: UserId;
    nickname: Nickname;
    avatarUrl?: Url;
    favoriteClub?: Team;
  };
  points: Points;
  predictions: number;
  accuracyRate: number;
  change?: number; // 前回からの順位変動
}

export interface Ranking {
  period: RankingPeriod;
  league?: League;
  entries: RankingEntry[];
  userRank?: {
    position: number;
    points: Points;
  };
  meta: {
    totalUsers: number;
    lastUpdated: Timestamp;
  };
}

export interface RankingFilters {
  period: RankingPeriod;
  leagueId?: LeagueId;
  page: number;
  limit: number;
}
```

## 4. API関連型

### 4.1. リクエスト型

```typescript
// types/api/requests.ts

// 認証API
export interface LoginRequest {
  email: Email;
  password: string;
}

export interface RegisterRequest {
  email: Email;
  password: string;
  nickname: Nickname;
  favoriteClubId?: TeamId;
}

// ユーザーAPI
export interface UpdateProfileRequest {
  nickname?: Nickname;
  favoriteClubId?: TeamId;
  avatarUrl?: Url;
}

// 予想API
export interface SubmitPredictionRequest {
  matchId: MatchId;
  formation: {
    system: FormationSystem;
    players: Array<{
      playerId: PlayerId;
      position: PlayerPosition;
      positionX: number;
      positionY: number;
    }>;
  };
}

// クエリパラメータ型
export interface MatchesQuery {
  leagueId?: LeagueId;
  status?: MatchStatus;
  date?: string; // YYYY-MM-DD
  teamId?: TeamId;
  page?: number;
  limit?: number;
}

export interface PredictionsQuery {
  status?: PredictionStatus;
  leagueId?: LeagueId;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface RankingQuery {
  period?: RankingPeriod;
  leagueId?: LeagueId;
  page?: number;
  limit?: number;
}
```

### 4.2. レスポンス型

```typescript
// types/api/responses.ts

// 認証API
export interface LoginResponse {
  user: User;
  session: AuthSession;
}

export interface RegisterResponse extends LoginResponse {}

// ユーザーAPI
export interface ProfileResponse extends User {}

export interface UserStatsResponse extends UserStatistics {}

// 試合API
export interface MatchesResponse {
  matches: Match[];
}

export interface MatchDetailResponse {
  match: MatchDetail;
}

// 予想API
export interface SubmitPredictionResponse {
  prediction: {
    id: PredictionId;
    matchId: MatchId;
    formation: Formation;
    submittedAt: Timestamp;
  };
}

export interface PredictionsResponse {
  predictions: Prediction[];
}

export interface PredictionDetailResponse {
  prediction: Prediction;
  analysis?: PredictionAnalysis;
}

// ランキングAPI
export interface RankingResponse extends Ranking {}

// リーグ・チームAPI
export interface LeaguesResponse {
  leagues: League[];
}

export interface TeamsResponse {
  teams: Team[];
}

export interface PlayersResponse {
  players: Player[];
}
```

## 5. フロントエンド関連型

### 5.1. コンポーネントProps型

```typescript
// types/components.ts

// 共通Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// カードコンポーネント
export interface MatchCardProps extends BaseComponentProps {
  match: Match;
  onPredictClick?: (matchId: MatchId) => void;
  showPrediction?: boolean;
}

export interface PredictionCardProps extends BaseComponentProps {
  prediction: Prediction;
  onViewClick?: (predictionId: PredictionId) => void;
  showResult?: boolean;
}

export interface RankingCardProps extends BaseComponentProps {
  entry: RankingEntry;
  currentUserId?: UserId;
  showChange?: boolean;
}

// フォームコンポーネント
export interface LoginFormProps extends BaseComponentProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isLoading?: boolean;
  error?: string;
}

export interface PredictionFormProps extends BaseComponentProps {
  match: MatchDetail;
  initialPrediction?: Prediction;
  onSubmit: (prediction: PredictionSubmission) => void;
  onSaveDraft?: (draft: PredictionDraft) => void;
  isLoading?: boolean;
}

// レイアウトコンポーネント
export interface NavigationProps extends BaseComponentProps {
  user?: User;
  currentPath: string;
}

export interface SidebarProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}
```

### 5.2. Hook型

```typescript
// types/hooks.ts

// 認証Hook
export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
}

// 予想Hook
export interface UsePredictionReturn {
  prediction: Prediction | null;
  isLoading: boolean;
  error: string | null;
  submit: (data: PredictionSubmission) => Promise<void>;
  saveDraft: (draft: PredictionDraft) => void;
  loadDraft: (matchId: MatchId) => PredictionDraft | null;
}

// ランキングHook
export interface UseRankingReturn {
  ranking: Ranking | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  filters: RankingFilters;
  setFilters: (filters: Partial<RankingFilters>) => void;
}
```

### 5.3. 状態管理型

```typescript
// types/store.ts

// アプリケーション全体の状態
export interface AppState {
  auth: AuthState;
  ui: UIState;
  cache: CacheState;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  loading: {
    global: boolean;
    predictions: boolean;
    rankings: boolean;
  };
}

export interface CacheState {
  matches: Record<MatchId, Match>;
  predictions: Record<PredictionId, Prediction>;
  teams: Record<TeamId, Team>;
  players: Record<PlayerId, Player>;
  lastUpdated: Record<string, Timestamp>;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
}
```

## 6. 外部API型

### 6.1. API-Football型

```typescript
// types/external/api-football.ts

export interface ApiFootballFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
}

export interface ApiFootballTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFootballPlayer {
  id: number;
  name: string;
  age: number;
  number: number;
  position: string;
  photo: string;
}

export interface ApiFootballLineup {
  team: ApiFootballTeam;
  formation: string;
  startXI: Array<{
    player: ApiFootballPlayer;
  }>;
  substitutes: Array<{
    player: ApiFootballPlayer;
  }>;
}
```

## 7. 設定・環境型

### 7.1. 環境変数型

```typescript
// types/env.ts

export interface EnvironmentVariables {
  // Next.js
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // API-Football
  API_FOOTBALL_KEY: string;
  API_FOOTBALL_BASE_URL: string;
  
  // Analytics
  NEXT_PUBLIC_GA_ID?: string;
  
  // Monitoring
  SENTRY_DSN?: string;
}
```

### 7.2. 設定型

```typescript
// types/config.ts

export interface AppConfig {
  app: {
    name: string;
    version: string;
    description: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    enablePremium: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
  };
  limits: {
    freePredictionsPerWeek: number;
    maxPlayersPerPrediction: number;
    predictionDeadlineHours: number;
  };
}
```

## 8. 型ガード・バリデーション

### 8.1. 型ガード関数

```typescript
// types/guards.ts

export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.nickname === 'string' &&
    typeof obj.totalPoints === 'number';
}

export function isMatch(obj: any): obj is Match {
  return obj &&
    typeof obj.id === 'string' &&
    obj.homeTeam &&
    obj.awayTeam &&
    typeof obj.kickoffTime === 'string';
}

export function isPrediction(obj: any): obj is Prediction {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    obj.formation &&
    Array.isArray(obj.formation.players);
}

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj &&
    typeof obj.success === 'boolean' &&
    obj.meta &&
    typeof obj.meta.timestamp === 'string';
}
```

### 8.2. バリデーションスキーマ型

```typescript
// types/validation.ts
import { z } from 'zod';

// Zodスキーマ
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string().min(1).max(50),
  totalPoints: z.number().min(0),
});

export const PredictionSubmissionSchema = z.object({
  matchId: z.string().uuid(),
  formation: z.object({
    system: z.enum(['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2']),
    players: z.array(z.object({
      playerId: z.string().uuid(),
      position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
      positionX: z.number().min(0).max(100),
      positionY: z.number().min(0).max(100),
    })).length(11),
  }),
});

// 型推論
export type UserValidated = z.infer<typeof UserSchema>;
export type PredictionSubmissionValidated = z.infer<typeof PredictionSubmissionSchema>;
```

この型定義により、PROVEXIは型安全で保守性の高いTypeScriptアプリケーションを実現します。