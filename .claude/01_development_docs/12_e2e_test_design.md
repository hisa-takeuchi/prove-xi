# PROVEXI E2Eテスト設計書

## 1. 概要

### 1.1. E2Eテストの目的
- **ユーザーシナリオの検証**: 実際のユーザー操作フローの動作確認
- **統合テスト**: フロントエンド・バックエンド・データベースの連携確認
- **回帰テスト**: 新機能追加時の既存機能への影響確認
- **クロスブラウザ対応**: 複数ブラウザでの動作保証

### 1.2. 技術スタック
- **テストフレームワーク**: Playwright
- **言語**: TypeScript
- **CI/CD**: GitHub Actions
- **レポート**: HTML Report + Allure
- **Node.js**: v22
- **Next.js**: v15

## 2. テスト戦略

### 2.1. テストピラミッド
```
        E2E Tests (少数・重要)
           ↑
    Integration Tests (中程度)
           ↑
     Unit Tests (多数・高速)
```

### 2.2. E2Eテスト対象範囲
- **クリティカルパス**: ユーザー登録〜予想提出〜結果確認
- **主要機能**: 認証、予想作成、ランキング表示
- **エラーハンドリング**: ネットワークエラー、バリデーションエラー
- **レスポンシブ対応**: モバイル・デスクトップ

## 3. Playwright設定

### 3.1. 基本設定
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
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
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 3.2. テストヘルパー設定
```typescript
// e2e/helpers/test-helpers.ts
import { Page, expect } from '@playwright/test';

export const testHelpers = {
  // 認証ヘルパー
  async login(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.fill('[data-testid=email-input]', email);
    await page.fill('[data-testid=password-input]', password);
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  },

  // テストユーザー作成
  async createTestUser(page: Page, userData: {
    email: string;
    password: string;
    nickname: string;
  }) {
    await page.goto('/auth/register');
    await page.fill('[data-testid=email-input]', userData.email);
    await page.fill('[data-testid=password-input]', userData.password);
    await page.fill('[data-testid=nickname-input]', userData.nickname);
    await page.click('[data-testid=register-button]');
    await expect(page).toHaveURL('/dashboard');
  },

  // 予想作成ヘルパー
  async createPrediction(page: Page, matchId: string) {
    await page.goto(`/matches/${matchId}/predict`);
    
    // フォーメーション選択
    await page.selectOption('[data-testid=formation-select]', '4-4-2');
    
    // 選手配置（簡略化）
    const players = await page.locator('[data-testid^=player-]').all();
    const positions = await page.locator('[data-testid^=position-]').all();
    
    for (let i = 0; i < Math.min(11, players.length, positions.length); i++) {
      await players[i].dragTo(positions[i]);
    }
    
    // 予想提出
    await page.click('[data-testid=submit-prediction]');
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
  },

  // 待機ヘルパー
  async waitForLoadingToFinish(page: Page) {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid=loading-spinner]')).toHaveCount(0);
  },

  // スクリーンショット比較
  async compareScreenshot(page: Page, name: string) {
    await expect(page).toHaveScreenshot(`${name}.png`);
  },
};
```

## 4. テストケース設計

### 4.1. 認証フロー
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { testHelpers } from './helpers/test-helpers';

test.describe('認証フロー', () => {
  test('新規ユーザー登録ができる', async ({ page }) => {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nickname: 'TestUser',
    };

    await testHelpers.createTestUser(page, userData);
    
    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid=user-nickname]')).toHaveText(userData.nickname);
  });

  test('既存ユーザーがログインできる', async ({ page }) => {
    await testHelpers.login(page, 'existing@example.com', 'password123');
    
    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid=welcome-message]')).toBeVisible();
  });

  test('無効な認証情報でログインが失敗する', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid=email-input]', 'invalid@example.com');
    await page.fill('[data-testid=password-input]', 'wrongpassword');
    await page.click('[data-testid=login-button]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('認証に失敗しました');
  });

  test('ログアウトができる', async ({ page }) => {
    await testHelpers.login(page, 'existing@example.com', 'password123');
    
    // ユーザーメニューからログアウト
    await page.click('[data-testid=user-menu]');
    await page.click('[data-testid=logout-button]');
    
    // ランディングページに遷移することを確認
    await expect(page).toHaveURL('/');
  });
});
```

### 4.2. 予想作成フロー
```typescript
// e2e/prediction.spec.ts
import { test, expect } from '@playwright/test';
import { testHelpers } from './helpers/test-helpers';

test.describe('予想作成フロー', () => {
  test.beforeEach(async ({ page }) => {
    await testHelpers.login(page, 'testuser@example.com', 'password123');
  });

  test('フォーメーション予想を作成・提出できる', async ({ page }) => {
    // 試合一覧から試合を選択
    await page.goto('/matches');
    await page.click('[data-testid=match-card]:first-child');
    
    // 予想作成ページに遷移
    await page.click('[data-testid=predict-button]');
    await expect(page).toHaveURL(/\/matches\/.*\/predict/);
    
    // フォーメーション選択
    await page.selectOption('[data-testid=formation-select]', '4-4-2');
    
    // 選手配置
    await testHelpers.createPrediction(page, 'match-1');
    
    // 成功メッセージの確認
    await expect(page.locator('[data-testid=success-message]')).toContainText('予想を提出しました');
  });

  test('予想の下書き保存ができる', async ({ page }) => {
    await page.goto('/matches/match-1/predict');
    
    // 部分的に予想を作成
    await page.selectOption('[data-testid=formation-select]', '4-3-3');
    
    // 下書き保存
    await page.click('[data-testid=save-draft-button]');
    await expect(page.locator('[data-testid=draft-saved-message]')).toBeVisible();
    
    // ページを再読み込みして下書きが復元されることを確認
    await page.reload();
    await expect(page.locator('[data-testid=formation-select]')).toHaveValue('4-3-3');
  });

  test('予想期限切れの試合では予想できない', async ({ page }) => {
    await page.goto('/matches/expired-match-1/predict');
    
    // 期限切れメッセージが表示されることを確認
    await expect(page.locator('[data-testid=deadline-expired-message]')).toBeVisible();
    await expect(page.locator('[data-testid=submit-prediction]')).toBeDisabled();
  });

  test('無効なフォーメーションでエラーが表示される', async ({ page }) => {
    await page.goto('/matches/match-1/predict');
    
    // 選手を11人未満で提出を試行
    await page.selectOption('[data-testid=formation-select]', '4-4-2');
    // 選手を5人だけ配置
    const players = await page.locator('[data-testid^=player-]').all();
    const positions = await page.locator('[data-testid^=position-]').all();
    
    for (let i = 0; i < 5; i++) {
      await players[i].dragTo(positions[i]);
    }
    
    await page.click('[data-testid=submit-prediction]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.locator('[data-testid=validation-error]')).toContainText('11人の選手を配置してください');
  });
});
```

### 4.3. ランキング表示
```typescript
// e2e/ranking.spec.ts
import { test, expect } from '@playwright/test';
import { testHelpers } from './helpers/test-helpers';

test.describe('ランキング機能', () => {
  test('グローバルランキングが表示される', async ({ page }) => {
    await page.goto('/rankings');
    
    // ランキングテーブルが表示されることを確認
    await expect(page.locator('[data-testid=ranking-table]')).toBeVisible();
    
    // 上位ユーザーが表示されることを確認
    const rankingEntries = page.locator('[data-testid=ranking-entry]');
    await expect(rankingEntries).toHaveCountGreaterThan(0);
    
    // 順位が正しく表示されることを確認
    const firstEntry = rankingEntries.first();
    await expect(firstEntry.locator('[data-testid=rank]')).toHaveText('1');
  });

  test('期間別ランキングの切り替えができる', async ({ page }) => {
    await page.goto('/rankings');
    
    // 月間ランキングに切り替え
    await page.click('[data-testid=period-monthly]');
    await testHelpers.waitForLoadingToFinish(page);
    
    // URLが更新されることを確認
    await expect(page).toHaveURL('/rankings?period=monthly');
    
    // 週間ランキングに切り替え
    await page.click('[data-testid=period-weekly]');
    await testHelpers.waitForLoadingToFinish(page);
    
    await expect(page).toHaveURL('/rankings?period=weekly');
  });

  test('ログインユーザーの順位がハイライトされる', async ({ page }) => {
    await testHelpers.login(page, 'testuser@example.com', 'password123');
    await page.goto('/rankings');
    
    // 自分の順位がハイライトされることを確認
    await expect(page.locator('[data-testid=user-rank-highlight]')).toBeVisible();
    
    // 自分の統計情報が表示されることを確認
    await expect(page.locator('[data-testid=user-stats]')).toBeVisible();
  });
});
```

### 4.4. レスポンシブテスト
```typescript
// e2e/responsive.spec.ts
import { test, expect } from '@playwright/test';
import { testHelpers } from './helpers/test-helpers';

test.describe('レスポンシブデザイン', () => {
  test('モバイルでナビゲーションが正しく動作する', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await testHelpers.login(page, 'testuser@example.com', 'password123');
    
    // ハンバーガーメニューが表示されることを確認
    await expect(page.locator('[data-testid=mobile-menu-button]')).toBeVisible();
    
    // メニューを開く
    await page.click('[data-testid=mobile-menu-button]');
    await expect(page.locator('[data-testid=mobile-menu]')).toBeVisible();
    
    // ナビゲーション項目をクリック
    await page.click('[data-testid=nav-matches]');
    await expect(page).toHaveURL('/matches');
  });

  test('タブレットで予想フォームが適切に表示される', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await testHelpers.login(page, 'testuser@example.com', 'password123');
    
    await page.goto('/matches/match-1/predict');
    
    // フォーメーションピッチが適切なサイズで表示されることを確認
    const pitch = page.locator('[data-testid=formation-pitch]');
    await expect(pitch).toBeVisible();
    
    const pitchBox = await pitch.boundingBox();
    expect(pitchBox?.width).toBeGreaterThan(400);
    expect(pitchBox?.height).toBeGreaterThan(200);
  });

  test('デスクトップでサイドバーが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await testHelpers.login(page, 'testuser@example.com', 'password123');
    
    // サイドバーが表示されることを確認
    await expect(page.locator('[data-testid=sidebar]')).toBeVisible();
    
    // サイドバーのナビゲーション項目が機能することを確認
    await page.click('[data-testid=sidebar-predictions]');
    await expect(page).toHaveURL('/predictions');
  });
});
```

## 5. パフォーマンステスト

### 5.1. ページ読み込み速度
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('パフォーマンステスト', () => {
  test('ランディングページの読み込み速度', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // 3秒以内に読み込まれることを確認
    expect(loadTime).toBeLessThan(3000);
  });

  test('Core Web Vitals測定', async ({ page }) => {
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
    
    // CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(clsValue), 5000);
      });
    });
    
    expect(cls).toBeLessThan(0.1); // 0.1以下
  });
});
```

## 6. エラーハンドリングテスト

### 6.1. ネットワークエラー
```typescript
// e2e/error-handling.spec.ts
import { test, expect } from '@playwright/test';
import { testHelpers } from './helpers/test-helpers';

test.describe('エラーハンドリング', () => {
  test('ネットワークエラー時の適切な表示', async ({ page }) => {
    await testHelpers.login(page, 'testuser@example.com', 'password123');
    
    // ネットワークをオフラインに設定
    await page.context().setOffline(true);
    
    // 試合一覧ページに遷移を試行
    await page.goto('/matches');
    
    // オフラインメッセージが表示されることを確認
    await expect(page.locator('[data-testid=offline-message]')).toBeVisible();
    
    // リトライボタンが表示されることを確認
    await expect(page.locator('[data-testid=retry-button]')).toBeVisible();
    
    // ネットワークを復旧
    await page.context().setOffline(false);
    
    // リトライボタンをクリック
    await page.click('[data-testid=retry-button]');
    
    // 正常にデータが読み込まれることを確認
    await expect(page.locator('[data-testid=match-list]')).toBeVisible();
  });

  test('APIエラー時のエラーメッセージ表示', async ({ page }) => {
    await testHelpers.login(page, 'testuser@example.com', 'password123');
    
    // APIレスポンスを500エラーに設定
    await page.route('/api/matches', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/matches');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid=api-error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=api-error-message]')).toContainText('データの取得に失敗しました');
  });
});
```

## 7. CI/CD統合

### 7.1. GitHub Actions設定
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps ${{ matrix.browser }}

      - name: Start test database
        run: |
          docker run -d \
            --name test-db \
            -e POSTGRES_PASSWORD=test \
            -e POSTGRES_DB=provexi_test \
            -p 5432:5432 \
            postgres:15

      - name: Run database migrations
        run: pnpm db:migrate:test

      - name: Seed test data
        run: pnpm db:seed:test

      - name: Run E2E tests
        run: pnpm playwright test --project=${{ matrix.browser }}
        env:
          BASE_URL: http://localhost:3000
          DATABASE_URL: postgresql://postgres:test@localhost:5432/provexi_test

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-videos-${{ matrix.browser }}
          path: test-results/
          retention-days: 30
```

### 7.2. テストデータ管理
```typescript
// e2e/fixtures/test-data.ts
export const testData = {
  users: {
    testUser: {
      email: 'testuser@example.com',
      password: 'TestPassword123!',
      nickname: 'TestUser',
    },
    premiumUser: {
      email: 'premium@example.com',
      password: 'PremiumPassword123!',
      nickname: 'PremiumUser',
      subscriptionPlan: 'PREMIUM',
    },
  },
  matches: {
    upcomingMatch: {
      id: 'match-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      kickoffTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    expiredMatch: {
      id: 'expired-match-1',
      homeTeam: 'Liverpool',
      awayTeam: 'Manchester City',
      kickoffTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  },
};
```

## 8. レポート・監視

### 8.1. テスト結果レポート
```typescript
// e2e/reporters/custom-reporter.ts
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

export default class CustomReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      console.log(`❌ ${test.title} - ${result.error?.message}`);
      
      // Slackに通知（本番環境のみ）
      if (process.env.NODE_ENV === 'production') {
        this.notifySlack({
          test: test.title,
          error: result.error?.message,
          duration: result.duration,
        });
      }
    }
  }

  private async notifySlack(data: any) {
    // Slack通知の実装
  }
}
```

### 8.2. メトリクス収集
```typescript
// e2e/utils/metrics.ts
export const collectMetrics = {
  async pageLoadTime(page: any, url: string) {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  },

  async interactionTime(page: any, selector: string) {
    const startTime = Date.now();
    await page.click(selector);
    await page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  },

  async memoryUsage(page: any) {
    return await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
  },
};
```

この包括的なE2Eテスト設計により、PROVEXIは実際のユーザー体験を保証し、高品質なアプリケーションとして継続的に改善されます。