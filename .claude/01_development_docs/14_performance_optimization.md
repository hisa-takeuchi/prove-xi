# 14. パフォーマンス最適化設計

## 14.1 パフォーマンス目標

### Core Web Vitals 目標値
- **LCP (Largest Contentful Paint)**: 2.5秒以下
- **FID (First Input Delay)**: 100ms以下
- **CLS (Cumulative Layout Shift)**: 0.1以下
- **TTFB (Time to First Byte)**: 800ms以下

### ページ別パフォーマンス目標
- **ランディングページ**: 3秒以内でコンテンツ表示完了
- **試合一覧**: 2秒以内でファーストビュー表示
- **フォーメーション予想**: ドラッグ&ドロップ操作のスムーズな動作（60fps）
- **ランキングページ**: 無限スクロール時の遅延を50ms以下

## 14.2 フロントエンド最適化

### バンドル最適化
```typescript
// next.config.js
const nextConfig = {
  // 静的最適化
  output: 'export',
  
  // バンドル分析
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },
  
  // 圧縮最適化
  compress: true,
  
  // 実験的機能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['shadcn-ui', 'lucide-react'],
  },
  
  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1年
  },
}
```

### コンポーネント最適化
```typescript
// 動的インポート
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// メモ化によるレンダリング最適化
const PredictionCard = memo(({ match, prediction }: Props) => {
  return (
    <div className="prediction-card">
      {/* コンポーネント内容 */}
    </div>
  )
})

// useMemo によるComputedバリューのキャッシュ
const expensiveValue = useMemo(() => {
  return calculateComplexStats(matches)
}, [matches])
```

### 仮想スクロール実装
```typescript
// 大量データの効率的描画
import { FixedSizeList as List } from 'react-window'

const RankingList = ({ rankings }: Props) => {
  return (
    <List
      height={600}
      itemCount={rankings.length}
      itemSize={80}
      itemData={rankings}
    >
      {RankingItem}
    </List>
  )
}
```

## 14.3 画像・アセット最適化

### Next.js Image 最適化
```typescript
import Image from 'next/image'

// 選手画像の最適化
<Image
  src={player.imageUrl}
  alt={player.name}
  width={150}
  height={150}
  priority={isAboveTheFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// チームロゴの最適化
<Image
  src={`/teams/${team.slug}.webp`}
  alt={team.name}
  width={60}
  height={60}
  loading="lazy"
/>
```

### アセット圧縮設定
```javascript
// 画像圧縮設定
const imageOptimization = {
  jpeg: { quality: 85 },
  webp: { quality: 85 },
  png: { compressionLevel: 8 },
  avif: { quality: 80 }
}
```

## 14.4 データベース最適化

### インデックス戦略
```sql
-- よく使用されるクエリのインデックス
CREATE INDEX idx_matches_date_league ON matches(match_date, league_id);
CREATE INDEX idx_predictions_user_match ON predictions(user_id, match_id);
CREATE INDEX idx_rankings_points_league ON rankings(total_points DESC, league_id);

-- 複合インデックス
CREATE INDEX idx_user_predictions_date ON predictions(user_id, created_at DESC);
```

### クエリ最適化
```typescript
// N+1問題の回避
const matchesWithPredictions = await supabase
  .from('matches')
  .select(`
    *,
    predictions!inner(*)
  `)
  .eq('league_id', leagueId)

// バッチ処理によるデータ取得
const batchedData = await Promise.all([
  getMatches(leagueId),
  getStandings(leagueId),
  getUserRankings(leagueId)
])
```

### Connection Pooling
```typescript
// Supabase接続プールの設定
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
})
```

## 14.5 キャッシュ戦略

### Next.js キャッシュ最適化
```typescript
// 静的生成 + ISR
export async function generateStaticParams() {
  const matches = await getUpcomingMatches()
  return matches.map(match => ({ id: match.id }))
}

export const revalidate = 300 // 5分間キャッシュ

// データキャッシュ
const cachedMatches = cache(async (leagueId: string) => {
  return await getMatchesByLeague(leagueId)
})
```

### ブラウザキャッシュ
```typescript
// Service Worker でのキャッシュ制御
const CACHE_NAME = 'provexi-v1'
const urlsToCache = [
  '/static/css/',
  '/static/js/',
  '/images/teams/',
  '/api/matches'
]

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  )
})
```

### Redis キャッシュ（将来実装）
```typescript
// ランキングデータのキャッシュ
const rankingCache = {
  key: `rankings:${leagueId}:${period}`,
  ttl: 300, // 5分
  
  async get() {
    return await redis.get(this.key)
  },
  
  async set(data: Ranking[]) {
    return await redis.setex(this.key, this.ttl, JSON.stringify(data))
  }
}
```

## 14.6 API パフォーマンス

### レスポンス時間最適化
```typescript
// API Route の最適化
export async function GET(request: Request) {
  const start = Date.now()
  
  try {
    // データ取得の並列化
    const [matches, predictions, standings] = await Promise.all([
      getMatches(),
      getPredictions(),
      getStandings()
    ])
    
    const response = { matches, predictions, standings }
    
    // パフォーマンス計測
    const duration = Date.now() - start
    console.log(`API response time: ${duration}ms`)
    
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${duration}ms`,
        'Cache-Control': 'public, s-maxage=300'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### GraphQL 最適化（将来実装）
```typescript
// DataLoader パターンでN+1問題解決
const userLoader = new DataLoader(async (userIds: string[]) => {
  const users = await getUsersByIds(userIds)
  return userIds.map(id => users.find(user => user.id === id))
})
```

## 14.7 モニタリング設定

### Web Vitals 計測
```typescript
// _app.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function reportWebVitals(metric: any) {
  // Google Analytics へ送信
  gtag('event', metric.name, {
    custom_parameter_1: metric.value,
    custom_parameter_2: metric.id,
    custom_parameter_3: metric.name
  })
  
  // 独自解析サービスへ送信
  analytics.track('Web Vitals', {
    metric: metric.name,
    value: metric.value,
    page: window.location.pathname
  })
}
```

### パフォーマンス計測ミドルウェア
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const start = Date.now()
  
  return NextResponse.next({
    headers: {
      'X-Timestamp': start.toString()
    }
  }).then(response => {
    const duration = Date.now() - start
    response.headers.set('X-Response-Time', `${duration}ms`)
    return response
  })
}
```

## 14.8 パフォーマンス予算

### バンドルサイズ制限
- **初期バンドル**: 200KB以下
- **ページごとのチャンク**: 100KB以下
- **画像サイズ**: 200KB以下/枚
- **フォントファイル**: 50KB以下

### ネットワーク制限
- **API レスポンス**: 500ms以下
- **画像ロード**: 1秒以下
- **フォント表示**: 100ms以下（swap使用）

### メモリ使用量
- **JavaScript ヒープ**: 50MB以下
- **DOM ノード数**: 1500個以下/ページ