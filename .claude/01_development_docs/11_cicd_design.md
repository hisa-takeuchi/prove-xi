# PROVEXI CI/CD設計書

## 1. 概要

### 1.1. CI/CD戦略の目的
- **品質保証**: 自動化されたテスト・検証による品質の維持
- **デプロイメント効率化**: 手動作業の削減と迅速なリリース
- **リスク軽減**: 段階的デプロイメントによる障害リスクの最小化
- **開発効率向上**: 継続的インテグレーションによる開発サイクルの高速化

### 1.2. 技術スタック
- **CI/CDプラットフォーム**: GitHub Actions
- **ホスティング**: Vercel (本番・プレビュー環境)
- **データベース**: Supabase (本番・ステージング)
- **監視**: Vercel Analytics + Sentry
- **Node.js**: v22
- **Next.js**: v15

## 2. 環境構成

### 2.1. 環境分離戦略
```
Production (main)     ← 本番環境
    ↑
Staging (develop)     ← ステージング環境
    ↑
Feature Branches      ← プレビュー環境
```

### 2.2. 環境別設定
```typescript
// 環境変数管理
interface EnvironmentConfig {
  production: {
    database: 'supabase-prod';
    domain: 'provexi.com';
    analytics: 'enabled';
    logLevel: 'error';
  };
  staging: {
    database: 'supabase-staging';
    domain: 'staging.provexi.com';
    analytics: 'disabled';
    logLevel: 'warn';
  };
  preview: {
    database: 'supabase-staging';
    domain: 'preview-*.vercel.app';
    analytics: 'disabled';
    logLevel: 'debug';
  };
}
```

## 3. GitHub Actions ワークフロー

### 3.1. メインワークフロー
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '22'
  PNPM_VERSION: '8'

jobs:
  # 品質チェック
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  # 単体テスト
  unit-tests:
    runs-on: ubuntu-latest
    needs: quality-checks
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  # E2Eテスト
  e2e-tests:
    runs-on: ubuntu-latest
    needs: quality-checks
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # セキュリティスキャン
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # デプロイメント
  deploy:
    runs-on: ubuntu-latest
    needs: [quality-checks, unit-tests, e2e-tests]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

### 3.2. プレビューデプロイメント
```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy Preview to Vercel
        uses: amondnet/vercel-action@v25
        id: vercel-deploy
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: ${{ steps.vercel-deploy.outputs.preview-url }}
          configPath: './.lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true

      - name: Comment PR with Lighthouse results
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('./lhci_reports/manifest.json'));
            const summary = results[0].summary;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Lighthouse Results
              
              **Performance**: ${summary.performance}
              **Accessibility**: ${summary.accessibility}
              **Best Practices**: ${summary['best-practices']}
              **SEO**: ${summary.seo}
              
              [View full report](${summary.reportUrl})`
            });
```

### 3.3. リリースワークフロー
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate changelog
        id: changelog
        uses: conventional-changelog/conventional-changelog-action@v3
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false

      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'New release ${{ github.ref }} has been deployed to production!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 4. Vercel設定

### 4.1. プロジェクト設定
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["nrt1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

### 4.2. 環境変数管理
```bash
# 本番環境
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
API_FOOTBALL_KEY=xxx
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxx@sentry.io/xxx

# ステージング環境
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
API_FOOTBALL_KEY=xxx
# GA_IDとSENTRY_DSNは設定しない（ステージング用）
```

## 5. データベースマイグレーション

### 5.1. Supabaseマイグレーション戦略
```yaml
# .github/workflows/db-migration.yml
name: Database Migration

on:
  push:
    branches: [main, develop]
    paths: ['supabase/migrations/**']

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Run migrations (staging)
        if: github.ref == 'refs/heads/develop'
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_STAGING_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run migrations (production)
        if: github.ref == 'refs/heads/main'
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROD_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Generate types
        run: |
          supabase gen types typescript --local > types/supabase.ts
          
      - name: Commit updated types
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'chore: update database types'
          file_pattern: 'types/supabase.ts'
```

## 6. 品質ゲート

### 6.1. プルリクエストチェック
```yaml
# .github/workflows/pr-checks.yml
name: PR Quality Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
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

      - name: Check bundle size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Check performance budget
        run: pnpm lighthouse:budget

      - name: Security audit
        run: pnpm audit --audit-level moderate

      - name: Check dependencies
        run: pnpm outdated --long || true

      - name: Validate commit messages
        uses: wagoid/commitlint-github-action@v5
```

### 6.2. 品質メトリクス
```typescript
// scripts/quality-metrics.ts
interface QualityMetrics {
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  performance: {
    bundleSize: number;
    lighthouse: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
  };
  security: {
    vulnerabilities: number;
    outdatedDependencies: number;
  };
}

const qualityThresholds = {
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  performance: {
    bundleSize: 500 * 1024, // 500KB
    lighthouse: {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 95,
    },
  },
  security: {
    vulnerabilities: 0,
    outdatedDependencies: 5,
  },
};
```

## 7. 監視・アラート

### 7.1. Vercel Analytics設定
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 7.2. Sentry設定
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // 本番環境以外では個人情報をフィルタリング
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },
});
```

### 7.3. ヘルスチェック
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // データベース接続チェック
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    // 外部API接続チェック
    const apiResponse = await fetch(process.env.API_FOOTBALL_BASE_URL + '/status', {
      headers: {
        'X-RapidAPI-Key': process.env.API_FOOTBALL_KEY!,
      },
    });

    if (!apiResponse.ok) {
      throw new Error('External API connection failed');
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      checks: {
        database: 'ok',
        externalApi: 'ok',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

## 8. ロールバック戦略

### 8.1. 自動ロールバック
```yaml
# .github/workflows/rollback.yml
name: Automatic Rollback

on:
  workflow_run:
    workflows: ["CI/CD Pipeline"]
    types: [completed]
    branches: [main]

jobs:
  health-check:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: Wait for deployment
        run: sleep 60

      - name: Health check
        id: health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://provexi.com/api/health)
          if [ $response -ne 200 ]; then
            echo "Health check failed with status $response"
            exit 1
          fi

      - name: Rollback on failure
        if: failure()
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod --rollback'

      - name: Notify on rollback
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'Production deployment has been rolled back due to health check failure!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 8.2. 手動ロールバック手順
```bash
# Vercel CLIを使用した手動ロールバック
vercel --prod --rollback

# 特定のデプロイメントにロールバック
vercel rollback [deployment-url] --prod

# データベースロールバック（必要に応じて）
supabase db reset --linked
```

## 9. パフォーマンス監視

### 9.1. Lighthouse CI設定
```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "startServerCommand": "pnpm start",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.95}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 9.2. Bundle Analyzer設定
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js設定
});
```

この包括的なCI/CD設計により、PROVEXIは高品質で信頼性の高いデプロイメントプロセスを実現し、継続的な改善とスケーラブルな開発体制を構築します。