# PROVEXI 開発環境セットアップガイド

## 1. 概要

### 1.1. 目的
このドキュメントは、PROVEXIプロジェクトの開発環境を構築するための完全なガイドです。新しい開発者が迅速に開発を開始できるよう、必要なツール、設定、手順を詳細に説明します。

### 1.2. 前提条件
- macOS、Windows、またはLinux環境
- インターネット接続
- 基本的なコマンドライン操作の知識
- Git、Node.js、TypeScriptの基本知識

## 2. 必要なツール・ソフトウェア

### 2.1. 必須ツール

#### Node.js (v22.x以上)
```bash
# Node.jsのバージョン確認
node --version

# npmのバージョン確認
npm --version

# 推奨: Node Version Manager (nvm) を使用
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### Git (v2.30.0以上)
```bash
# Gitのバージョン確認
git --version

# Gitの初期設定
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### pnpm (推奨パッケージマネージャー)
```bash
# pnpmのインストール
npm install -g pnpm

# バージョン確認
pnpm --version
```

### 2.2. 推奨ツール

#### Visual Studio Code
```bash
# VS Code拡張機能（推奨）
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension ms-vscode.vscode-json
code --install-extension ms-vscode.vscode-markdown
```

#### Docker (オプション)
```bash
# Dockerのインストール確認
docker --version
docker-compose --version
```

## 3. プロジェクトのセットアップ

### 3.1. リポジトリのクローン

```bash
# プロジェクトをクローン
git clone https://github.com/your-org/prove-xi.git
cd prove-xi

# ブランチの確認
git branch -a

# 開発ブランチに切り替え（存在する場合）
git checkout develop
```

### 3.2. 依存関係のインストール

```bash
# 依存関係をインストール
pnpm install

# インストール確認
pnpm list --depth=0
```

### 3.3. 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp .env.example .env.local

# 環境変数を編集
code .env.local
```

#### 必要な環境変数
```bash
# .env.local
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API-Football
API_FOOTBALL_KEY=your_api_football_key
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io

# Analytics (オプション)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Monitoring (オプション)
SENTRY_DSN=your_sentry_dsn
```

## 4. データベースセットアップ

### 4.1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. データベースパスワードを設定
4. プロジェクトURLとAPIキーを取得

### 4.2. データベーススキーマの適用

```bash
# Supabase CLIのインストール
npm install -g supabase

# Supabaseにログイン
supabase login

# プロジェクトとリンク
supabase link --project-ref your-project-ref

# マイグレーションの実行
supabase db push

# 初期データの投入（オプション）
supabase db seed
```

### 4.3. Row Level Security (RLS) の設定

```sql
-- RLSポリシーの確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 5. 外部サービスの設定

### 5.1. API-Football

1. [API-Football](https://www.api-football.com/)にアカウント作成
2. APIキーを取得
3. 環境変数に設定

```bash
# APIの動作確認
curl -X GET \
  'https://v3.football.api-sports.io/leagues' \
  -H 'X-RapidAPI-Key: your_api_key'
```

### 5.2. Google Analytics (オプション)

1. Google Analytics 4プロパティを作成
2. 測定IDを取得
3. 環境変数に設定

## 6. 開発サーバーの起動

### 6.1. 基本的な起動

```bash
# 開発サーバーを起動
pnpm dev

# ブラウザで確認
open http://localhost:3000
```

### 6.2. 各種開発ツールの起動

```bash
# TypeScriptの型チェック
pnpm type-check

# ESLintによるコード検証
pnpm lint

# Prettierによるコード整形
pnpm format

# テストの実行
pnpm test

# Storybookの起動（UIコンポーネント開発）
pnpm storybook
```

## 7. VS Code設定

### 7.1. ワークスペース設定

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### 7.2. 推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-markdown",
    "ms-playwright.playwright",
    "ms-vscode.vscode-jest"
  ]
}
```

## 8. Git設定とワークフロー

### 8.1. Git Hooks設定

```bash
# Huskyのセットアップ
pnpm prepare

# pre-commitフックの確認
cat .husky/pre-commit
```

### 8.2. コミット規約

```bash
# Conventional Commitsに従ったコミットメッセージ
git commit -m "feat: add user authentication"
git commit -m "fix: resolve prediction submission bug"
git commit -m "docs: update API documentation"
git commit -m "style: format code with prettier"
git commit -m "refactor: improve error handling"
git commit -m "test: add unit tests for prediction logic"
```

### 8.3. ブランチ戦略

```bash
# 機能開発ブランチの作成
git checkout -b feature/user-profile-page

# バグ修正ブランチの作成
git checkout -b fix/prediction-validation

# 開発完了後のマージ
git checkout develop
git merge feature/user-profile-page
git branch -d feature/user-profile-page
```

## 9. デバッグ設定

### 9.1. VS Code デバッグ設定

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### 9.2. ブラウザ開発者ツール

```javascript
// デバッグ用のグローバル変数（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  window.__PROVEXI_DEBUG__ = {
    user: () => console.log('Current user:', getCurrentUser()),
    predictions: () => console.log('User predictions:', getUserPredictions()),
    clearCache: () => queryClient.clear(),
  };
}
```

## 10. トラブルシューティング

### 10.1. よくある問題と解決方法

#### Node.jsバージョンの問題
```bash
# 現在のバージョン確認
node --version

# 推奨バージョンに切り替え
nvm use 18.17.0

# .nvmrcファイルがある場合
nvm use
```

#### 依存関係の問題
```bash
# node_modulesとlock fileを削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install

# キャッシュをクリア
pnpm store prune
```

#### 環境変数の問題
```bash
# 環境変数の確認
echo $NEXT_PUBLIC_SUPABASE_URL

# .env.localファイルの確認
cat .env.local

# Next.jsの環境変数デバッグ
pnpm dev --debug
```

#### データベース接続の問題
```bash
# Supabaseの接続確認
supabase status

# データベースのリセット
supabase db reset
```

### 10.2. パフォーマンス問題

#### 開発サーバーが遅い場合
```bash
# Next.jsの高速リフレッシュを確認
echo "Fast Refresh enabled: $(grep -o 'fastRefresh.*true' next.config.js)"

# TypeScriptの型チェックを別プロセスで実行
pnpm dev --turbo
```

#### ビルドが遅い場合
```bash
# ビルド分析
pnpm build --analyze

# 依存関係の分析
pnpm why package-name
```

## 11. 開発ツールとコマンド

### 11.1. 利用可能なスクリプト

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "db:generate": "supabase gen types typescript --local > types/supabase.ts",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db seed"
  }
}
```

### 11.2. 開発用ユーティリティ

```bash
# コンポーネントの自動生成
pnpm generate:component ComponentName

# APIルートの自動生成
pnpm generate:api endpoint-name

# 型定義の自動生成
pnpm generate:types

# データベーススキーマの更新
pnpm db:generate
```

## 12. チーム開発のベストプラクティス

### 12.1. コードレビューチェックリスト

- [ ] TypeScriptエラーがないか
- [ ] ESLintルールに準拠しているか
- [ ] テストが追加・更新されているか
- [ ] パフォーマンスに影響がないか
- [ ] セキュリティ上の問題がないか
- [ ] アクセシビリティが考慮されているか

### 12.2. 開発効率化のTips

```bash
# エイリアスの設定（.bashrc or .zshrc）
alias pd="pnpm dev"
alias pt="pnpm test"
alias pl="pnpm lint"
alias pf="pnpm format"

# よく使うGitコマンドのエイリアス
alias gs="git status"
alias ga="git add"
alias gc="git commit"
alias gp="git push"
alias gl="git pull"
```

このセットアップガイドに従うことで、PROVEXIの開発環境を迅速かつ確実に構築できます。問題が発生した場合は、トラブルシューティングセクションを参照するか、チームメンバーに相談してください。