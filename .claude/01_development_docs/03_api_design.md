# PROVEXI API設計書

## 1. 概要

### 1.1. API設計原則
- **RESTful設計**: HTTP動詞とリソース指向のURL設計
- **一貫性**: 統一されたレスポンス形式とエラーハンドリング
- **セキュリティ**: JWT認証とRate Limiting
- **バージョニング**: 将来的なAPI変更に対応

### 1.2. 技術仕様
- **フレームワーク**: Next.js 15 App Router API Routes
- **認証**: Supabase Auth (JWT)
- **データ形式**: JSON
- **文字エンコーディング**: UTF-8

## 2. 共通仕様

### 2.1. ベースURL
```
Production: https://provexi.com/api
Development: http://localhost:3000/api
```

### 2.2. 認証
```http
Authorization: Bearer <JWT_TOKEN>
```

### 2.3. 共通レスポンス形式

#### 成功レスポンス
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
  };
}
```

#### エラーレスポンス
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### 2.4. ページネーション
```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// クエリパラメータ
interface PaginationQuery {
  page?: number; // デフォルト: 1
  limit?: number; // デフォルト: 20, 最大: 100
}
```

## 3. 認証API

### 3.1. ユーザー登録
```http
POST /api/auth/register
```

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  favoriteClubId?: string;
}
```

**Response:**
```typescript
interface RegisterResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
    favoriteClub?: Club;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}
```

### 3.2. ログイン
```http
POST /api/auth/login
```

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface LoginResponse {
  user: User;
  session: Session;
}
```

### 3.3. ログアウト
```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface LogoutResponse {
  message: string;
}
```

## 4. ユーザーAPI

### 4.1. プロフィール取得
```http
GET /api/users/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface ProfileResponse {
  id: string;
  email: string;
  nickname: string;
  favoriteClub?: Club;
  totalPoints: number;
  subscriptionPlan: SubscriptionPlan;
  avatarUrl?: string;
  createdAt: string;
}
```

### 4.2. プロフィール更新
```http
PUT /api/users/profile
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdateProfileRequest {
  nickname?: string;
  favoriteClubId?: string;
  avatarUrl?: string;
}
```

### 4.3. ユーザー統計取得
```http
GET /api/users/stats
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface UserStatsResponse {
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  totalPoints: number;
  currentRank: number;
  weeklyStats: {
    predictions: number;
    points: number;
  };
  monthlyStats: {
    predictions: number;
    points: number;
  };
}
```

## 5. 試合API

### 5.1. 試合一覧取得
```http
GET /api/matches
```

**Query Parameters:**
```typescript
interface MatchesQuery extends PaginationQuery {
  leagueId?: string;
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  date?: string; // YYYY-MM-DD
  teamId?: string;
}
```

**Response:**
```typescript
interface MatchesResponse {
  matches: Match[];
  meta: {
    pagination: PaginationMeta;
    timestamp: string;
  };
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  kickoffTime: string;
  status: string;
  predictionDeadline: string;
  userPrediction?: Prediction;
}
```

### 5.2. 試合詳細取得
```http
GET /api/matches/{matchId}
```

**Headers:** `Authorization: Bearer <token>` (optional)

**Response:**
```typescript
interface MatchDetailResponse {
  match: Match;
  teams: {
    home: TeamDetail;
    away: TeamDetail;
  };
  userPrediction?: Prediction;
  result?: MatchResult;
}

interface TeamDetail extends Team {
  players: Player[];
  recentForm: string[]; // ['W', 'L', 'D', 'W', 'L']
}
```

## 6. 予想API

### 6.1. 予想提出
```http
POST /api/predictions
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface SubmitPredictionRequest {
  matchId: string;
  formation: {
    system: string; // "4-4-2", "4-3-3", etc.
    players: PredictionPlayer[];
  };
}

interface PredictionPlayer {
  playerId: string;
  position: string; // "GK", "DEF", "MID", "FWD"
  positionX: number; // 0-100
  positionY: number; // 0-100
}
```

**Response:**
```typescript
interface SubmitPredictionResponse {
  prediction: {
    id: string;
    matchId: string;
    formation: Formation;
    submittedAt: string;
  };
  message: string;
}
```

### 6.2. 予想更新
```http
PUT /api/predictions/{predictionId}
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as `SubmitPredictionRequest`

### 6.3. 予想取得
```http
GET /api/predictions/{predictionId}
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface PredictionResponse {
  prediction: {
    id: string;
    match: Match;
    formation: Formation;
    pointsEarned?: number;
    submittedAt: string;
  };
}
```

### 6.4. ユーザーの予想履歴
```http
GET /api/predictions
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface PredictionsQuery extends PaginationQuery {
  status?: 'PENDING' | 'COMPLETED';
  leagueId?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

## 7. ランキングAPI

### 7.1. グローバルランキング
```http
GET /api/rankings/global
```

**Query Parameters:**
```typescript
interface RankingQuery extends PaginationQuery {
  period?: 'OVERALL' | 'MONTHLY' | 'WEEKLY';
  leagueId?: string;
}
```

**Response:**
```typescript
interface GlobalRankingResponse {
  rankings: RankingEntry[];
  userRank?: {
    position: number;
    points: number;
  };
  meta: {
    pagination: PaginationMeta;
    period: string;
    timestamp: string;
  };
}

interface RankingEntry {
  rank: number;
  user: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    favoriteClub?: Club;
  };
  points: number;
  predictions: number;
  accuracyRate: number;
}
```

### 7.2. リーグ別ランキング
```http
GET /api/rankings/leagues/{leagueId}
```

**Query Parameters:** Same as Global Ranking

## 8. リーグ・チームAPI

### 8.1. リーグ一覧
```http
GET /api/leagues
```

**Response:**
```typescript
interface LeaguesResponse {
  leagues: League[];
}

interface League {
  id: string;
  name: string;
  country: string;
  logoUrl: string;
  isActive: boolean;
}
```

### 8.2. チーム一覧
```http
GET /api/teams
```

**Query Parameters:**
```typescript
interface TeamsQuery {
  leagueId?: string;
}
```

**Response:**
```typescript
interface TeamsResponse {
  teams: Team[];
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  league: League;
}
```

### 8.3. 選手一覧
```http
GET /api/players
```

**Query Parameters:**
```typescript
interface PlayersQuery {
  teamId?: string;
  position?: 'GK' | 'DEF' | 'MID' | 'FWD';
}
```

**Response:**
```typescript
interface PlayersResponse {
  players: Player[];
}

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number;
  nationality: string;
  team: Team;
}
```

## 9. サブスクリプションAPI

### 9.1. プラン一覧
```http
GET /api/subscriptions/plans
```

**Response:**
```typescript
interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  maxPredictionsPerWeek: number;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}
```

### 9.2. プラン変更
```http
POST /api/subscriptions/upgrade
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpgradeRequest {
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
}
```

## 10. エラーコード定義

### 10.1. 認証エラー
| コード | メッセージ | HTTPステータス |
|--------|------------|----------------|
| `AUTH_001` | Invalid credentials | 401 |
| `AUTH_002` | Token expired | 401 |
| `AUTH_003` | Token invalid | 401 |
| `AUTH_004` | User not found | 404 |
| `AUTH_005` | Email already exists | 409 |

### 10.2. 予想エラー
| コード | メッセージ | HTTPステータス |
|--------|------------|----------------|
| `PRED_001` | Prediction deadline passed | 400 |
| `PRED_002` | Invalid formation | 400 |
| `PRED_003` | Player not in team | 400 |
| `PRED_004` | Prediction limit exceeded | 403 |
| `PRED_005` | Match not found | 404 |

### 10.3. システムエラー
| コード | メッセージ | HTTPステータス |
|--------|------------|----------------|
| `SYS_001` | Internal server error | 500 |
| `SYS_002` | Database connection error | 503 |
| `SYS_003` | External API error | 502 |
| `SYS_004` | Rate limit exceeded | 429 |

## 11. Rate Limiting

### 11.1. 制限設定
```typescript
interface RateLimitConfig {
  '/api/auth/*': {
    windowMs: 15 * 60 * 1000; // 15分
    max: 5; // 最大5回
  };
  '/api/predictions': {
    windowMs: 60 * 1000; // 1分
    max: 10; // 最大10回
  };
  '/api/*': {
    windowMs: 60 * 1000; // 1分
    max: 100; // 最大100回
  };
}
```

### 11.2. Rate Limitヘッダー
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 12. Webhook API

### 12.1. 試合結果更新
```http
POST /api/webhooks/match-results
```

**Headers:**
```http
X-Webhook-Secret: <SECRET_KEY>
Content-Type: application/json
```

**Request Body:**
```typescript
interface MatchResultWebhook {
  matchId: string;
  status: string;
  homeFormation: string;
  awayFormation: string;
  lineups: {
    home: LineupPlayer[];
    away: LineupPlayer[];
  };
}

interface LineupPlayer {
  playerId: string;
  position: string;
  isStarter: boolean;
}
```

## 13. API使用例

### 13.1. 予想提出フロー
```typescript
// 1. 試合詳細取得
const matchResponse = await fetch('/api/matches/123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { match, teams } = await matchResponse.json();

// 2. 予想提出
const predictionResponse = await fetch('/api/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    matchId: '123',
    formation: {
      system: '4-4-2',
      players: [
        { playerId: 'p1', position: 'GK', positionX: 50, positionY: 5 },
        // ... 他の選手
      ]
    }
  })
});
```

### 13.2. ランキング取得
```typescript
const rankingResponse = await fetch('/api/rankings/global?period=MONTHLY&page=1&limit=50');
const { rankings, userRank } = await rankingResponse.json();
```

この設計により、PROVEXIは一貫性があり、拡張可能で、セキュアなAPI体験を提供します。