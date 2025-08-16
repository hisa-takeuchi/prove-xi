# PROVEXI テスト戦略設計書

## 1. 概要

### 1.1. テスト戦略の目的
- **品質保証**: バグの早期発見と修正によるソフトウェア品質の向上
- **リファクタリング支援**: 安全なコード変更を可能にする回帰テストの提供
- **ドキュメント化**: テストコードによる仕様の明文化
- **開発効率向上**: 自動化されたテストによる手動テスト工数の削減

### 1.2. テスト方針
- **テスト駆動開発 (TDD)**: 重要なビジネスロジックはTDDで開発
- **テストピラミッド**: 単体テスト > 統合テスト > E2Eテストの比率
- **継続的テスト**: CI/CDパイプラインでの自動テスト実行
- **実用的テスト**: 100%カバレッジより実用性を重視

## 2. テスト分類と責任範囲

### 2.1. 単体テスト (Unit Tests)
**目的**: 個別の関数・コンポーネントの動作検証

#### 対象範囲
- **ビジネスロジック関数**: ポイント計算、バリデーション
- **ユーティリティ関数**: 日付処理、フォーマット関数
- **Reactコンポーネント**: UIコンポーネントの描画・操作
- **カスタムフック**: 状態管理ロジック

#### 技術スタック
```json
{
  "testFramework": "Vitest",
  "reactTesting": "@testing-library/react",
  "mockLibrary": "vi (Vitest built-in)",
  "coverage": "c8"
}
```

#### テスト例
```typescript
// lib/domain/services/point-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePredictionPoints } from './point-calculator';

describe('calculatePredictionPoints', () => {
  it('正しい選手予想で基本ポイントを獲得', () => {
    const prediction = {
      players: [
        { id: 'p1', position: 'GK' },
        { id: 'p2', position: 'DEF' },
        // ... 11人の選手
      ]
    };
    
    const actualLineup = [
      { id: 'p1', position: 'GK' },
      { id: 'p2', position: 'DEF' },
      // ... 実際のラインナップ
    ];
    
    const points = calculatePredictionPoints(prediction, actualLineup);
    expect(points.playerPoints).toBe(20); // 2人正解 × 10pt
  });

  it('全員的中でボーナスポイントを獲得', () => {
    // 全員正解のテストケース
  });
});
```

### 2.2. 統合テスト (Integration Tests)
**目的**: 複数のモジュール間の連携動作検証

#### 対象範囲
- **API Routes**: Next.js API routesの動作
- **データベース操作**: Supabaseとの連携
- **外部API連携**: API-Footballとの通信
- **認証フロー**: Supabase Authとの統合

#### テスト例
```typescript
// __tests__/api/predictions.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/predictions/route';

describe('/api/predictions', () => {
  beforeEach(async () => {
    // テストデータベースのセットアップ
    await setupTestDatabase();
  });

  it('有効な予想データで予想を作成', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token'
      },
      body: {
        matchId: 'match-1',
        formation: {
          system: '4-4-2',
          players: [/* 11人の選手データ */]
        }
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });
});
```

### 2.3. E2Eテスト (End-to-End Tests)
**目的**: ユーザーシナリオ全体の動作検証

#### 対象範囲
- **クリティカルパス**: ユーザー登録〜予想提出〜結果確認
- **認証フロー**: ログイン・ログアウト・セッション管理
- **主要機能**: フォーメーション作成、ランキング表示
- **レスポンシブ対応**: モバイル・デスクトップでの動作

#### 技術スタック
```json
{
  "e2eFramework": "Playwright",
  "browsers": ["chromium", "firefox", "webkit"],
  "visualTesting": "Playwright screenshots",
  "mocking": "MSW (Mock Service Worker)"
}
```

#### テスト例
```typescript
// e2e/prediction-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('予想提出フロー', () => {
  test('ユーザーが予想を作成・提出できる', async ({ page }) => {
    // ログイン
    await page.goto('/auth/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    // 試合選択
    await page.goto('/matches');
    await page.click('[data-testid=match-card]:first-child');
    
    // 予想作成
    await page.click('[data-testid=predict-button]');
    
    // フォーメーション選択
    await page.selectOption('[data-testid=formation-select]', '4-4-2');
    
    // 選手配置（ドラッグ&ドロップ）
    const goalkeeper = page.locator('[data-testid=player-GK-1]');
    const gkPosition = page.locator('[data-testid=position-gk]');
    await goalkeeper.dragTo(gkPosition);
    
    // 予想提出
    await page.click('[data-testid=submit-prediction]');
    
    // 成功確認
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
  });
});
```

## 3. テスト環境設定

### 3.1. Vitest設定
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3.2. テストセットアップ
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Supabaseクライアントのモック
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

// Next.js routerのモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

### 3.3. Playwright設定
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 4. テストデータ管理

### 4.1. テストデータ戦略
```typescript
// src/test/fixtures/index.ts
export const testUsers = {
  validUser: {
    id: 'user-1',
    email: 'test@example.com',
    nickname: 'TestUser',
    totalPoints: 100,
  },
  premiumUser: {
    id: 'user-2',
    email: 'premium@example.com',
    nickname: 'PremiumUser',
    totalPoints: 500,
    subscriptionPlan: 'PREMIUM',
  },
};

export const testMatches = {
  upcomingMatch: {
    id: 'match-1',
    homeTeam: { id: 'team-1', name: 'Arsenal' },
    awayTeam: { id: 'team-2', name: 'Chelsea' },
    kickoffTime: '2024-12-01T15:00:00Z',
    status: 'SCHEDULED',
  },
  finishedMatch: {
    id: 'match-2',
    homeTeam: { id: 'team-3', name: 'Liverpool' },
    awayTeam: { id: 'team-4', name: 'Manchester City' },
    kickoffTime: '2024-11-24T17:30:00Z',
    status: 'FINISHED',
  },
};
```

### 4.2. データベースモック
```typescript
// src/test/mocks/database.ts
import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: testUsers.validUser }, 
      error: null 
    }),
  },
};
```

## 5. テストカバレッジ戦略

### 5.1. カバレッジ目標
```typescript
// カバレッジ目標設定
const coverageTargets = {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80,
  // 重要なビジネスロジックは90%以上
  criticalPaths: 90,
};
```

### 5.2. 優先度別テスト戦略

#### 高優先度（必須テスト）
- **ポイント計算ロジック**: 100%カバレッジ
- **認証・認可**: セキュリティ関連の全パス
- **予想提出フロー**: クリティカルパス
- **決済処理**: エラーハンドリング含む

#### 中優先度（推奨テスト）
- **UIコンポーネント**: 主要な操作パターン
- **API Routes**: 正常系・異常系
- **データ変換**: マッピング関数

#### 低優先度（補完テスト）
- **ユーティリティ関数**: 基本的な動作確認
- **スタイリング**: ビジュアルリグレッション
- **パフォーマンス**: 負荷テスト

## 6. CI/CDでのテスト実行

### 6.1. GitHub Actions設定
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 6.2. テスト実行スクリプト
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm test:unit && pnpm test:e2e"
  }
}
```

## 7. テスト品質管理

### 7.1. テストコード品質基準
- **可読性**: テスト名は仕様を明確に表現
- **独立性**: テスト間の依存関係を排除
- **再現性**: 同じ条件で同じ結果を保証
- **保守性**: プロダクションコード変更時の影響を最小化

### 7.2. テストレビューチェックリスト
- [ ] テスト名が仕様を適切に表現している
- [ ] 正常系・異常系の両方をカバーしている
- [ ] モックが適切に設定されている
- [ ] テストデータが現実的である
- [ ] アサーションが具体的で意味がある
- [ ] テストの実行時間が適切である

## 8. パフォーマンステスト

### 8.1. 負荷テスト
```typescript
// performance/load-test.js
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // 100ユーザーまで増加
    { duration: '5m', target: 100 }, // 100ユーザーで維持
    { duration: '2m', target: 0 },   // 0まで減少
  ],
};

export default function () {
  const response = http.get('http://localhost:3000/api/matches');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### 8.2. Core Web Vitals テスト
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test('Core Web Vitals', async ({ page }) => {
  await page.goto('/');
  
  // LCP (Largest Contentful Paint)
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });
  
  expect(lcp).toBeLessThan(2500); // 2.5秒以下
});
```

この包括的なテスト戦略により、PROVEXIは高品質で信頼性の高いアプリケーションとして開発・運用されます。