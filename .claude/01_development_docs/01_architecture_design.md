# PROVEXI アーキテクチャ設計書

## 1. 概要

### 1.1. 設計思想
PROVEXIは、**Domain Driven Design (DDD)** と **Clean Architecture** の原則に基づいて設計されています。これにより、ビジネスロジックの独立性、テスタビリティ、保守性を確保し、将来的な機能拡張や技術変更に柔軟に対応できるアーキテクチャを実現します。

### 1.2. アーキテクチャの選択理由
- **DDD**: フォーメーション予想という複雑なドメインロジックを適切にモデリング
- **Clean Architecture**: 外部依存（API、DB）からビジネスロジックを分離
- **Next.js App Router**: モダンなフルスタック開発とSEO最適化
- **Supabase**: 認証・データベース・リアルタイム機能の統合

## 2. システム全体構成

### 2.1. 高レベルアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Next.js Pages │  │   API Routes    │  │ Components  │ │
│  │   (App Router)  │  │                 │  │  (shadcn)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Use Cases     │  │   Services      │  │   DTOs      │ │
│  │                 │  │                 │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │    Entities     │  │ Value Objects   │  │ Domain      │ │
│  │                 │  │                 │  │ Services    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Repositories  │  │  External APIs  │  │  Database   │ │
│  │   (Supabase)    │  │ (API-Football)  │  │ (Supabase)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. ディレクトリ構造

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ページ
│   ├── dashboard/                # ダッシュボード
│   ├── matches/                  # 試合関連ページ
│   ├── predictions/              # 予想関連ページ
│   ├── rankings/                 # ランキングページ
│   ├── api/                      # API Routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                         # 共通ライブラリ
├── application/              # Application Layer
│   ├── use-cases/
│   ├── services/
│   └── dtos/
├── domain/                   # Domain Layer
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   └── repositories/
├── infrastructure/           # Infrastructure Layer
│   ├── repositories/
│   ├── external-apis/
│   └── database/
├── presentation/             # Presentation Layer
│   ├── components/
│   ├── hooks/
│   └── utils/
├── shared/                   # 共通ユーティリティ
├── components/                   # UIコンポーネント
│   ├── ui/                       # shadcn/ui components
│   ├── features/                 # 機能別コンポーネント
│   └── layouts/                  # レイアウトコンポーネント
└── types/                        # TypeScript型定義
```

## 3. レイヤー別詳細設計

### 3.1. Domain Layer（ドメイン層）

**責任**: ビジネスルールとドメインロジックの実装

#### 主要エンティティ
```typescript
// User Entity
interface User {
  readonly id: UserId;
  readonly email: Email;
  readonly nickname: Nickname;
  readonly favoriteClub: ClubId;
  readonly totalPoints: Points;
  readonly subscriptionPlan: SubscriptionPlan;
}

const createUser = (
  id: UserId,
  email: Email,
  nickname: Nickname,
  favoriteClub: ClubId,
  totalPoints: Points,
  subscriptionPlan: SubscriptionPlan
): User => ({
  id,
  email,
  nickname,
  favoriteClub,
  totalPoints,
  subscriptionPlan,
});

// ビジネスルール: 予想可能回数の制限
const canMakePrediction = (user: User, currentPredictions: number): boolean => {
  return canMakePredictionForPlan(user.subscriptionPlan, currentPredictions);
};

// Match Entity
interface Match {
  readonly id: MatchId;
  readonly homeTeam: Team;
  readonly awayTeam: Team;
  readonly kickoffTime: DateTime;
  readonly status: MatchStatus;
}

const createMatch = (
  id: MatchId,
  homeTeam: Team,
  awayTeam: Team,
  kickoffTime: DateTime,
  status: MatchStatus
): Match => ({
  id,
  homeTeam,
  awayTeam,
  kickoffTime,
  status,
});

// ビジネスルール: 予想受付期限
const isPredictionAcceptable = (match: Match): boolean => {
  return match.status === MatchStatus.SCHEDULED && 
         match.kickoffTime.isAfter(DateTime.now().plus({ hours: 1 }));
};

// Prediction Entity
interface Prediction {
  readonly id: PredictionId;
  readonly userId: UserId;
  readonly matchId: MatchId;
  readonly formation: Formation;
  readonly startingEleven: StartingEleven;
}

const createPrediction = (
  id: PredictionId,
  userId: UserId,
  matchId: MatchId,
  formation: Formation,
  startingEleven: StartingEleven
): Prediction => ({
  id,
  userId,
  matchId,
  formation,
  startingEleven,
});

// ビジネスルール: ポイント計算
const calculatePoints = (prediction: Prediction, actualLineup: StartingEleven): Points => {
  // ポイント計算ロジック
  return calculatePredictionPoints(prediction.startingEleven, actualLineup);
};
```

#### Value Objects
```typescript
interface Formation {
  readonly system: FormationSystem;
}

const createFormation = (system: FormationSystem): Formation => {
  validateFormation(system);
  return { system };
};

const validateFormation = (system: FormationSystem): void => {
  // 4-4-2, 4-3-3 などの妥当性検証
  if (!isValidFormationSystem(system)) {
    throw new Error('Invalid formation system');
  }
};

interface StartingEleven {
  readonly players: readonly Player[];
}

const createStartingEleven = (players: Player[]): StartingEleven => {
  if (players.length !== 11) {
    throw new Error('Starting eleven must have exactly 11 players');
  }
  return { players: Object.freeze([...players]) };
};
```

### 3.2. Application Layer（アプリケーション層）

**責任**: ユースケースの実装とドメインオブジェクトの協調

#### Use Cases
```typescript
interface SubmitPredictionDependencies {
  readonly userRepository: UserRepository;
  readonly matchRepository: MatchRepository;
  readonly predictionRepository: PredictionRepository;
}

const createSubmitPredictionUseCase = (dependencies: SubmitPredictionDependencies) => {
  return async (command: SubmitPredictionCommand): Promise<void> => {
    const { userRepository, matchRepository, predictionRepository } = dependencies;

    // 1. ユーザーの予想権限確認
    const user = await userRepository.findById(command.userId);
    const currentPredictions = await predictionRepository.countByUserAndWeek(command.userId);

    if (!canMakePrediction(user, currentPredictions)) {
      throw new InsufficientPredictionRightsError();
    }

    // 2. 試合の予想受付状況確認
    const match = await matchRepository.findById(command.matchId);
    if (!isPredictionAcceptable(match)) {
      throw new PredictionDeadlinePassedError();
    }

    // 3. 予想の保存
    const prediction = createPrediction(
      generatePredictionId(),
      command.userId,
      command.matchId,
      command.formation,
      command.startingEleven
    );

    await predictionRepository.save(prediction);
  };
};

// 使用例
const submitPredictionUseCase = createSubmitPredictionUseCase({
  userRepository,
  matchRepository,
  predictionRepository,
});
```

### 3.3. Infrastructure Layer（インフラストラクチャ層）

**責任**: 外部システムとの連携

#### Repository実装
```typescript
const createSupabasePredictionRepository = (supabase: SupabaseClient): PredictionRepository => ({
  async save(prediction: Prediction): Promise<void> {
    const data = PredictionMapper.toDatabase(prediction);
    await supabase.from('predictions').upsert(data);
  },

  async findByUserAndMatch(userId: UserId, matchId: MatchId): Promise<Prediction | null> {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId.value)
      .eq('match_id', matchId.value)
      .single();

    return data ? PredictionMapper.toDomain(data) : null;
  },

  async countByUserAndWeek(userId: UserId): Promise<number> {
    const { count } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId.value);

    return count || 0;
  }
});
```

#### External API
```typescript
interface ApiFootballConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
}

const createApiFootballService = (config: ApiFootballConfig): MatchDataService => ({
  async fetchUpcomingMatches(league: LeagueId): Promise<Match[]> {
    const response = await fetch(`${config.baseUrl}/fixtures`, {
      headers: { 'X-RapidAPI-Key': config.apiKey }
    });

    const data = await response.json();
    return data.response.map(MatchMapper.fromApiFootball);
  },

  async fetchMatchResult(matchId: MatchId): Promise<MatchResult> {
    const response = await fetch(`${config.baseUrl}/fixtures/${matchId.value}`, {
      headers: { 'X-RapidAPI-Key': config.apiKey }
    });

    const data = await response.json();
    return MatchResultMapper.fromApiFootball(data.response[0]);
  }
});
```

### 3.4. Presentation Layer（プレゼンテーション層）

**責任**: ユーザーインターフェースとHTTPリクエスト処理

#### API Routes
```typescript
// app/api/predictions/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const command = SubmitPredictionCommand.fromRequest(body);

    await dependencies.submitPredictionUseCase(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### React Components
```typescript
// components/features/prediction/PredictionForm.tsx
export function PredictionForm({ match }: { match: Match }) {
  const { mutate: submitPrediction } = useMutation({
    mutationFn: (data: PredictionFormData) => 
      predictionService.submit(data),
    onSuccess: () => {
      toast.success('予想を提出しました');
      router.push('/dashboard');
    }
  });

  return (
    <form onSubmit={handleSubmit(submitPrediction)}>
      {/* フォーメーション選択UI */}
    </form>
  );
}
```

## 4. 依存性の管理

### 4.1. 依存性注入
```typescript
// lib/di/container.ts
interface Dependencies {
  readonly userRepository: UserRepository;
  readonly matchRepository: MatchRepository;
  readonly predictionRepository: PredictionRepository;
  readonly matchDataService: MatchDataService;
  readonly submitPredictionUseCase: (command: SubmitPredictionCommand) => Promise<void>;
}

const createDependencies = (supabaseClient: SupabaseClient): Dependencies => {
  // Repositories
  const userRepository = createSupabaseUserRepository(supabaseClient);
  const matchRepository = createSupabaseMatchRepository(supabaseClient);
  const predictionRepository = createSupabasePredictionRepository(supabaseClient);

  // External Services
  const matchDataService = createApiFootballService({
    baseUrl: process.env.API_FOOTBALL_BASE_URL!,
    apiKey: process.env.API_FOOTBALL_KEY!
  });

  // Use Cases
  const submitPredictionUseCase = createSubmitPredictionUseCase({
    userRepository,
    matchRepository,
    predictionRepository
  });

  return {
    userRepository,
    matchRepository,
    predictionRepository,
    matchDataService,
    submitPredictionUseCase
  };
};

// 使用例
export const dependencies = createDependencies(supabaseClient);
```

### 4.2. インターフェース定義
```typescript
// lib/domain/repositories/UserRepository.ts
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  findByEmail(email: Email): Promise<User | null>;
}

// lib/domain/services/MatchDataService.ts
export interface MatchDataService {
  fetchUpcomingMatches(league: LeagueId): Promise<Match[]>;
  fetchMatchResult(matchId: MatchId): Promise<MatchResult>;
}
```

## 5. データフロー

### 5.1. 予想提出フロー
```
User Input (UI) 
  → Form Validation (Presentation)
  → API Route (Presentation)
  → Use Case (Application)
  → Domain Validation (Domain)
  → Repository (Infrastructure)
  → Database (Supabase)
```

### 5.2. 試合データ同期フロー
```
Scheduled Job
  → External API Service (Infrastructure)
  → Match Data Mapping (Infrastructure)
  → Match Repository (Infrastructure)
  → Database Update (Supabase)
  → Real-time Notification (Supabase)
```

## 6. 技術的制約と考慮事項

### 6.1. パフォーマンス考慮
- **キャッシュ戦略**: React Query + Supabase Real-time
- **画像最適化**: Next.js Image Optimization
- **バンドルサイズ**: Dynamic Imports for heavy components

### 6.2. スケーラビリティ
- **データベース**: Supabase の自動スケーリング活用
- **CDN**: Vercel Edge Network
- **API制限**: API-Football のレート制限対応

### 6.3. セキュリティ
- **認証**: Supabase Auth (JWT)
- **認可**: Row Level Security (RLS)
- **入力検証**: Zod schema validation

## 7. 今後の拡張性

### 7.1. 新機能追加時の指針
1. **Domain First**: ビジネスルールをDomainレイヤーで定義
2. **Use Case Driven**: 機能をUse Caseとして実装
3. **Interface Segregation**: 必要最小限のインターフェース定義

### 7.2. 技術変更への対応
- **Database変更**: Repository interfaceにより影響を局所化
- **外部API変更**: Service interfaceにより影響を局所化
- **UI Framework変更**: Presentation層の独立性により対応

この設計により、PROVEXIは保守性・拡張性・テスタビリティを兼ね備えた堅牢なアーキテクチャを実現します。
