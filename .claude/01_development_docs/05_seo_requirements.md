# PROVEXI SEO要件定義書

## 1. 概要

### 1.1. SEO戦略の目的
- **オーガニック流入の最大化**: 検索エンジンからの自然流入を増やす
- **ブランド認知度向上**: サッカー予想関連キーワードでの上位表示
- **ユーザー獲得コスト削減**: 有料広告に依存しない持続可能な成長
- **競合優位性確立**: サッカー戦術予想分野でのSEO優位性

### 1.2. ターゲットキーワード戦略

#### プライマリキーワード
- `サッカー フォーメーション 予想`
- `プレミアリーグ スターティングメンバー 予想`
- `サッカー 戦術 予想 アプリ`
- `フォーメーション予想 ゲーム`

#### セカンダリキーワード
- `サッカー 予想 無料`
- `プレミアリーグ 予想`
- `サッカー戦術 分析`
- `フォーメーション 作成`

#### ロングテールキーワード
- `[チーム名] フォーメーション 予想`
- `[選手名] スターティングメンバー`
- `プレミアリーグ 第[節数]節 予想`

## 2. 技術的SEO実装

### 2.1. Next.js App Router SEO設定

#### メタデータAPI活用
```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | PROVEXI - サッカーフォーメーション予想',
    default: 'PROVEXI - あなたの戦術眼を証明せよ'
  },
  description: 'プロサッカーリーグのフォーメーション予想で戦術眼を競う。無料でプレミアリーグの予想に参加し、グローバルランキングで実力を証明しよう。',
  keywords: ['サッカー', 'フォーメーション', '予想', 'プレミアリーグ', '戦術', 'スターティングメンバー'],
  authors: [{ name: 'PROVEXI Team' }],
  creator: 'PROVEXI',
  publisher: 'PROVEXI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://provexi.com',
    siteName: 'PROVEXI',
    title: 'PROVEXI - サッカーフォーメーション予想',
    description: 'あなたの戦術眼を証明せよ。プロサッカーリーグのフォーメーション予想で世界中のファンと競い合おう。',
    images: [
      {
        url: 'https://provexi.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PROVEXI - サッカーフォーメーション予想',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@provexi_app',
    creator: '@provexi_app',
    title: 'PROVEXI - サッカーフォーメーション予想',
    description: 'あなたの戦術眼を証明せよ',
    images: ['https://provexi.com/twitter-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-site-verification-code',
  },
};
```

#### 動的メタデータ生成
```typescript
// app/matches/[matchId]/page.tsx
export async function generateMetadata(
  { params }: { params: { matchId: string } }
): Promise<Metadata> {
  const match = await getMatch(params.matchId);
  
  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} フォーメーション予想`,
    description: `${match.homeTeam.name}対${match.awayTeam.name}の試合でスターティングメンバーを予想しよう。キックオフ: ${formatDate(match.kickoffTime)}`,
    keywords: [
      match.homeTeam.name,
      match.awayTeam.name,
      'フォーメーション予想',
      match.league.name,
      'スターティングメンバー'
    ],
    openGraph: {
      title: `${match.homeTeam.name} vs ${match.awayTeam.name} | PROVEXI`,
      description: `${formatDate(match.kickoffTime)}キックオフの試合でフォーメーション予想に参加しよう`,
      images: [
        {
          url: `https://provexi.com/api/og/match/${match.id}`,
          width: 1200,
          height: 630,
          alt: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        },
      ],
    },
  };
}
```

### 2.2. 構造化データ実装

#### 組織情報
```typescript
// lib/structured-data/organization.ts
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PROVEXI",
  "url": "https://provexi.com",
  "logo": "https://provexi.com/logo.png",
  "description": "サッカーフォーメーション予想アプリケーション",
  "sameAs": [
    "https://twitter.com/provexi_app",
    "https://facebook.com/provexi",
    "https://instagram.com/provexi_app"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "support@provexi.com"
  }
};
```

#### 試合情報の構造化データ
```typescript
// lib/structured-data/match.ts
export function generateMatchSchema(match: Match) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    "startDate": match.kickoffTime,
    "location": {
      "@type": "Place",
      "name": match.venue?.name || "TBD"
    },
    "competitor": [
      {
        "@type": "SportsTeam",
        "name": match.homeTeam.name,
        "logo": match.homeTeam.logoUrl
      },
      {
        "@type": "SportsTeam", 
        "name": match.awayTeam.name,
        "logo": match.awayTeam.logoUrl
      }
    ],
    "sport": "Soccer",
    "organizer": {
      "@type": "Organization",
      "name": match.league.name
    }
  };
}
```

#### ランキング情報の構造化データ
```typescript
// lib/structured-data/ranking.ts
export function generateRankingSchema(rankings: RankingEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "PROVEXI グローバルランキング",
    "description": "サッカーフォーメーション予想の世界ランキング",
    "itemListElement": rankings.map((entry, index) => ({
      "@type": "ListItem",
      "position": entry.rank,
      "item": {
        "@type": "Person",
        "name": entry.user.nickname,
        "description": `${entry.points}ポイント獲得`
      }
    }))
  };
}
```

### 2.3. サイトマップ生成

#### 静的サイトマップ
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://provexi.com';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rankings/global`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];
}
```

#### 動的サイトマップ
```typescript
// app/matches/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const matches = await getAllMatches();
  
  return matches.map((match) => ({
    url: `https://provexi.com/matches/${match.id}`,
    lastModified: match.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));
}
```

### 2.4. robots.txt設定

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/profile/',
          '/auth/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/profile/',
          '/auth/',
          '/admin/',
        ],
      },
    ],
    sitemap: 'https://provexi.com/sitemap.xml',
  };
}
```

## 3. コンテンツSEO戦略

### 3.1. ページ別SEO最適化

#### ランディングページ (/)
```typescript
export const metadata: Metadata = {
  title: 'PROVEXI - あなたの戦術眼を証明せよ | サッカーフォーメーション予想',
  description: 'プロサッカーリーグのフォーメーション予想で戦術眼を競う無料アプリ。プレミアリーグのスターティングメンバーを予想し、世界中のファンとランキングで競い合おう。',
  keywords: [
    'サッカー フォーメーション 予想',
    'プレミアリーグ 予想',
    'スターティングメンバー 予想',
    'サッカー戦術 ゲーム',
    '無料 サッカー予想'
  ],
};
```

#### 試合一覧ページ (/matches)
```typescript
export const metadata: Metadata = {
  title: 'サッカー試合一覧 - フォーメーション予想 | PROVEXI',
  description: '今週のプレミアリーグ試合でフォーメーション予想に参加しよう。各試合のスターティングメンバーを予想してポイントを獲得。',
  keywords: [
    'プレミアリーグ 試合一覧',
    'サッカー 今週の試合',
    'フォーメーション予想 試合',
    'スターティングメンバー予想'
  ],
};
```

#### ランキングページ (/rankings)
```typescript
export const metadata: Metadata = {
  title: 'サッカー予想ランキング - 世界の戦術眼ランキング | PROVEXI',
  description: 'サッカーフォーメーション予想の世界ランキング。あなたの戦術眼は世界で何位？トップ予想家の成績をチェックしよう。',
  keywords: [
    'サッカー予想 ランキング',
    'フォーメーション予想 ランキング',
    '戦術眼 ランキング',
    'サッカー予想 世界ランキング'
  ],
};
```

### 3.2. コンテンツ最適化

#### 見出し構造の最適化
```html
<!-- 適切なH1-H6の階層構造 -->
<h1>プレミアリーグ フォーメーション予想</h1>
  <h2>今週の注目試合</h2>
    <h3>マンチェスター・シティ vs リヴァプール</h3>
      <h4>予想のポイント</h4>
      <h4>両チームの最新情報</h4>
  <h2>予想の参加方法</h2>
    <h3>ステップ1: 試合を選択</h3>
    <h3>ステップ2: フォーメーションを作成</h3>
```

#### 内部リンク戦略
```typescript
// 関連コンテンツへの内部リンク
const internalLinkStrategy = {
  matchPages: [
    'related matches in same league',
    'team historical performance',
    'player statistics pages'
  ],
  rankingPages: [
    'user profile pages',
    'league-specific rankings',
    'historical ranking data'
  ],
  landingPage: [
    'featured matches',
    'top performers',
    'how-to guides'
  ]
};
```

## 4. 画像SEO最適化

### 4.1. 画像最適化設定
```typescript
// next.config.js
const nextConfig = {
  images: {
    domains: ['provexi.com', 'api-football.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### 4.2. 動的OG画像生成
```typescript
// app/api/og/match/[matchId]/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const match = await getMatch(params.matchId);
  
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
          color: 'white',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <img src={match.homeTeam.logoUrl} width="120" height="120" />
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>VS</div>
          <img src={match.awayTeam.logoUrl} width="120" height="120" />
        </div>
        <div style={{ position: 'absolute', bottom: '40px', fontSize: '24px' }}>
          {formatDate(match.kickoffTime)} | PROVEXI
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

## 5. パフォーマンスSEO

### 5.1. Core Web Vitals最適化

#### LCP (Largest Contentful Paint) 改善
```typescript
// 重要コンテンツの優先読み込み
export default function MatchCard({ match }: { match: Match }) {
  return (
    <div>
      <Image
        src={match.homeTeam.logoUrl}
        alt={`${match.homeTeam.name} logo`}
        width={64}
        height={64}
        priority // 重要な画像は優先読み込み
      />
      {/* その他のコンテンツ */}
    </div>
  );
}
```

#### CLS (Cumulative Layout Shift) 改善
```css
/* レイアウトシフト防止 */
.match-card {
  aspect-ratio: 16 / 9;
  min-height: 200px;
}

.team-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
```

#### FID (First Input Delay) 改善
```typescript
// 重いコンポーネントの遅延読み込み
const PredictionForm = dynamic(() => import('./PredictionForm'), {
  loading: () => <PredictionFormSkeleton />,
  ssr: false
});
```

### 5.2. ページ速度最適化

#### 静的生成の活用
```typescript
// app/matches/page.tsx
export const revalidate = 3600; // 1時間ごとに再生成

export default async function MatchesPage() {
  const matches = await getUpcomingMatches();
  
  return (
    <div>
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

#### 部分的事前レンダリング
```typescript
// app/matches/[matchId]/page.tsx
export async function generateStaticParams() {
  const matches = await getUpcomingMatches();
  
  return matches.map((match) => ({
    matchId: match.id,
  }));
}
```

## 6. 国際化SEO (将来対応)

### 6.1. 多言語対応準備
```typescript
// next.config.js
const nextConfig = {
  i18n: {
    locales: ['ja', 'en', 'es', 'pt'],
    defaultLocale: 'ja',
    localeDetection: false,
  },
};
```

### 6.2. hreflang設定
```typescript
// 多言語ページのメタデータ
export const metadata: Metadata = {
  alternates: {
    languages: {
      'ja': 'https://provexi.com/ja',
      'en': 'https://provexi.com/en',
      'es': 'https://provexi.com/es',
      'pt': 'https://provexi.com/pt',
    },
  },
};
```

## 7. SEO監視・分析

### 7.1. 分析ツール設定
```typescript
// Google Analytics 4
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Google Search Console
// サイトマップ登録: https://provexi.com/sitemap.xml

// 重要指標の監視
const seoMetrics = {
  organicTraffic: 'Google Analytics',
  searchRankings: 'Google Search Console',
  coreWebVitals: 'PageSpeed Insights',
  indexedPages: 'Google Search Console',
};
```

### 7.2. SEO改善のKPI
```typescript
interface SEOKPIs {
  organicTraffic: {
    target: '+50% MoM';
    current: 'track via GA4';
  };
  keywordRankings: {
    target: 'Top 10 for primary keywords';
    tracking: 'weekly monitoring';
  };
  coreWebVitals: {
    lcp: '< 2.5s';
    fid: '< 100ms';
    cls: '< 0.1';
  };
  indexedPages: {
    target: '95% of published pages';
    monitoring: 'Google Search Console';
  };
}
```

この設計により、PROVEXIは検索エンジンでの可視性を最大化し、オーガニック流入による持続可能な成長を実現します。