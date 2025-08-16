# 2. コンポーネント設計

## 2.1 コンポーネント分類体系

### 基本分類
```
src/components/
├── ui/                          # 基本UIコンポーネント
│   ├── button.tsx               # ボタン系
│   ├── input.tsx                # 入力系
│   ├── card.tsx                 # カード系
│   └── ...
├── features/                    # 機能特化コンポーネント
│   ├── prediction/              # 予想機能
│   ├── ranking/                 # ランキング機能
│   ├── match/                   # 試合関連
│   └── auth/                    # 認証関連
└── layouts/                     # レイアウトコンポーネント
    ├── header.tsx
    ├── footer.tsx
    └── main-layout.tsx
```

## 2.2 UI コンポーネント詳細設計

### Button コンポーネント
```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
}

const buttonSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 py-2',
  lg: 'h-11 px-6 text-lg',
  xl: 'h-12 px-8 text-xl'
}
```

### Input コンポーネント
```typescript
// components/ui/input.tsx
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'search'
  placeholder?: string
  error?: string
  label?: string
  required?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  helpText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  error,
  label,
  required,
  disabled,
  icon,
  helpText,
  className,
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
})
```

### Card コンポーネント
```typescript
// components/ui/card.tsx
interface CardProps {
  variant?: 'default' | 'outline' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  children: React.ReactNode
}

const cardVariants = {
  default: 'bg-card text-card-foreground',
  outline: 'border border-border bg-card text-card-foreground',
  filled: 'bg-muted text-muted-foreground'
}

const cardPadding = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8'
}

const cardShadow = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
}
```

## 2.3 Features コンポーネント設計

### Prediction コンポーネント群
```typescript
// components/features/prediction/FormationPitch.tsx
interface FormationPitchProps {
  formation: Formation
  players: Player[]
  selectedPlayers: SelectedPlayer[]
  onPlayerSelect: (player: Player, position: Position) => void
  onPlayerRemove: (position: Position) => void
  readOnly?: boolean
}

// 3D サッカーピッチの表現
const FormationPitch = ({ formation, players, selectedPlayers, onPlayerSelect, readOnly }: FormationPitchProps) => {
  return (
    <div className="formation-pitch relative w-full h-[600px] bg-gradient-to-b from-green-400 to-green-600 rounded-lg overflow-hidden">
      {/* ピッチライン */}
      <div className="absolute inset-0">
        <PitchLines />
      </div>
      
      {/* ポジション */}
      {formation.positions.map((position) => (
        <PositionSlot
          key={position.id}
          position={position}
          player={selectedPlayers.find(p => p.positionId === position.id)?.player}
          onSelect={readOnly ? undefined : (player) => onPlayerSelect(player, position)}
          onRemove={readOnly ? undefined : () => onPlayerRemove(position)}
        />
      ))}
      
      {/* ドラッグ可能な選手一覧 */}
      {!readOnly && (
        <PlayerList
          players={players}
          selectedPlayerIds={selectedPlayers.map(sp => sp.player.id)}
          onPlayerDragStart={handlePlayerDragStart}
        />
      )}
    </div>
  )
}
```

### Match コンポーネント群
```typescript
// components/features/match/MatchCard.tsx
interface MatchCardProps {
  match: Match
  prediction?: Prediction
  variant?: 'upcoming' | 'live' | 'finished'
  showPrediction?: boolean
  showResult?: boolean
}

const MatchCard = ({ match, prediction, variant = 'upcoming', showPrediction, showResult }: MatchCardProps) => {
  return (
    <Card className="match-card" hover>
      <div className="flex items-center justify-between p-4">
        {/* チーム情報 */}
        <div className="flex items-center space-x-4">
          <TeamLogo team={match.homeTeam} size="md" />
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              {formatMatchDate(match.kickoffTime)}
            </div>
            <div className="font-semibold">
              {variant === 'finished' ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
            </div>
          </div>
          <TeamLogo team={match.awayTeam} size="md" />
        </div>
        
        {/* ステータス・アクション */}
        <div className="flex flex-col items-end space-y-2">
          <MatchStatus status={match.status} />
          {showPrediction && prediction && (
            <PredictionSummary prediction={prediction} />
          )}
          {variant === 'upcoming' && (
            <Button variant="primary" size="sm">
              予想する
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
```

### Ranking コンポーネント群
```typescript
// components/features/ranking/RankingTable.tsx
interface RankingTableProps {
  rankings: Ranking[]
  currentUserId?: string
  variant?: 'global' | 'league' | 'monthly'
  showDetails?: boolean
}

const RankingTable = ({ rankings, currentUserId, variant = 'global', showDetails }: RankingTableProps) => {
  return (
    <div className="ranking-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">順位</TableHead>
            <TableHead>ユーザー</TableHead>
            <TableHead className="text-right">ポイント</TableHead>
            <TableHead className="text-right">予想数</TableHead>
            <TableHead className="text-right">的中率</TableHead>
            {showDetails && (
              <>
                <TableHead className="text-right">今月</TableHead>
                <TableHead className="text-right">先月</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((ranking, index) => (
            <TableRow
              key={ranking.userId}
              className={cn(
                'ranking-row',
                ranking.userId === currentUserId && 'bg-accent/50 font-semibold'
              )}
            >
              <TableCell>
                <RankBadge rank={index + 1} />
              </TableCell>
              <TableCell>
                <UserProfile user={ranking.user} compact />
              </TableCell>
              <TableCell className="text-right font-mono">
                {ranking.totalPoints.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {ranking.predictionCount}
              </TableCell>
              <TableCell className="text-right">
                {(ranking.accuracy * 100).toFixed(1)}%
              </TableCell>
              {showDetails && (
                <>
                  <TableCell className="text-right">
                    {ranking.monthlyPoints?.toLocaleString() || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {ranking.lastMonthPoints?.toLocaleString() || '-'}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

## 2.4 Layout コンポーネント設計

### MainLayout
```typescript
// components/layouts/MainLayout.tsx
interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  sidebarContent?: React.ReactNode
  headerActions?: React.ReactNode
}

const MainLayout = ({ children, showSidebar, sidebarContent, headerActions }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header actions={headerActions} />
      
      <main className="container mx-auto px-4 py-8">
        {showSidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {children}
            </div>
            <aside className="lg:col-span-1">
              {sidebarContent}
            </aside>
          </div>
        ) : (
          children
        )}
      </main>
      
      <Footer />
    </div>
  )
}
```

### Header
```typescript
// components/layouts/Header.tsx
const Header = ({ actions }: { actions?: React.ReactNode }) => {
  const { user, logout } = useAuth()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo size="sm" />
            <span className="text-xl font-bold">PROVEXI</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/predictions" className="hover:text-foreground/80">
              予想一覧
            </Link>
            <Link href="/rankings" className="hover:text-foreground/80">
              ランキング
            </Link>
            <Link href="/dashboard" className="hover:text-foreground/80">
              ダッシュボード
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {actions}
          
          {user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/register">新規登録</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
```

## 2.5 コンポーネント命名規則

### 命名パターン
```typescript
// 基本UI: 小文字 + ハイフン
button.tsx
input.tsx
card.tsx

// 機能特化: パスカルケース
FormationPitch.tsx
MatchCard.tsx
RankingTable.tsx

// レイアウト: パスカルケース + Layout suffix
MainLayout.tsx
AuthLayout.tsx
```

### Props インターフェース命名
```typescript
// コンポーネント名 + Props
interface ButtonProps {}
interface FormationPitchProps {}
interface MatchCardProps {}
```

## 2.6 状態管理パターン

### ローカル状態
```typescript
// useState for simple state
const [isLoading, setIsLoading] = useState(false)
const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

// useReducer for complex state
const [formationState, dispatch] = useReducer(formationReducer, initialState)
```

### グローバル状態 (Zustand)
```typescript
// stores/prediction-store.ts
interface PredictionStore {
  currentMatch: Match | null
  formation: Formation | null
  selectedPlayers: SelectedPlayer[]
  setMatch: (match: Match) => void
  setFormation: (formation: Formation) => void
  addPlayer: (player: Player, position: Position) => void
  removePlayer: (position: Position) => void
  clearPrediction: () => void
}

export const usePredictionStore = create<PredictionStore>((set) => ({
  currentMatch: null,
  formation: null,
  selectedPlayers: [],
  setMatch: (match) => set({ currentMatch: match }),
  setFormation: (formation) => set({ formation }),
  addPlayer: (player, position) => set((state) => ({
    selectedPlayers: [
      ...state.selectedPlayers.filter(sp => sp.position.id !== position.id),
      { player, position }
    ]
  })),
  removePlayer: (position) => set((state) => ({
    selectedPlayers: state.selectedPlayers.filter(sp => sp.position.id !== position.id)
  })),
  clearPrediction: () => set({
    currentMatch: null,
    formation: null,
    selectedPlayers: []
  })
}))
```

## 2.7 アクセシビリティ設計

### ARIA 属性の統一
```typescript
// フォーカス管理
const Button = ({ children, disabled, ...props }: ButtonProps) => {
  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(buttonVariants({ variant, size }))}
      {...props}
    >
      {children}
    </button>
  )
}

// スクリーンリーダー対応
const FormationPitch = ({ formation }: FormationPitchProps) => {
  return (
    <div
      role="application"
      aria-label="フォーメーション編集エリア"
      aria-describedby="formation-instructions"
    >
      <div id="formation-instructions" className="sr-only">
        選手をドラッグアンドドロップしてフォーメーションを組んでください
      </div>
      {/* ピッチコンテンツ */}
    </div>
  )
}
```

## 2.8 パフォーマンス最適化

### メモ化パターン
```typescript
// React.memo for pure components
const MatchCard = memo(({ match, prediction }: MatchCardProps) => {
  return (
    <Card>
      {/* コンポーネント内容 */}
    </Card>
  )
})

// useMemo for expensive calculations
const RankingTable = ({ rankings }: RankingTableProps) => {
  const sortedRankings = useMemo(() => {
    return rankings.sort((a, b) => b.totalPoints - a.totalPoints)
  }, [rankings])
  
  return (
    <Table>
      {/* テーブル内容 */}
    </Table>
  )
}

// useCallback for event handlers
const FormationPitch = ({ onPlayerSelect }: FormationPitchProps) => {
  const handlePlayerDrop = useCallback((player: Player, position: Position) => {
    onPlayerSelect(player, position)
  }, [onPlayerSelect])
  
  return (
    <div>
      {/* ピッチコンテンツ */}
    </div>
  )
}
```

## 2.9 テストパターン

### コンポーネントテスト
```typescript
// __tests__/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })
})