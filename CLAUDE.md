# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

PROVEXIは、プロサッカーリーグのフォーメーション予想Webアプリケーションです。世界中のサッカーファンが試合ごとのスターティングメンバー（XI）とフォーメーションを予想し、その的確さをポイントで競い合うプラットフォームです。コンセプトは「戦術眼を証明せよ」- ユーザーが自らのサッカー知識と戦術眼をポイントとランキングで証明できるサービスです。

## 実行ログについて
実行するごとに.claude/logsディレクトリ内に実行内容のファイルを都度作成してください。

## コミットについて
実行後、コミット規約に従って適切な分割単位でコミットしてください。

## 重要なリマインダー
### 開発完了時のチェックリスト
1. **実行ログの更新**: .claude/logsディレクトリの該当ファイルに実装内容・修正内容を記録
2. **Next.js App Routerベストプラクティス確認**: ページコンポーネントの不必要な'use client'化を避ける
3. **型チェック・リント実行**: `pnpm run type-check` および `pnpm run lint` の実行
4. **Storybook動作確認**: 新規UIコンポーネント作成時は `pnpm storybook` でStory作成・動作確認
5. **コミット**: 適切なコミットメッセージでの変更記録

## アーキテクチャ

このプロジェクトは**DDD（ドメイン駆動設計）とクリーンアーキテクチャ**に従います。

```
src/
├── app/                    # Next.js App Router（プレゼンテーション層）
│   ├── (auth)/            # 認証が必要なルート
│   ├── (public)/          # 公開ルート
│   └── api/               # APIルート
├── application/           # ユースケース
│   ├── usecases/
│   ├── dto/
│   └── ports/
├── domain/                # ビジネスロジック
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   └── repositories/      # リポジトリインターフェース
├── infrastructure/        # 外部実装
│   ├── repositories/      # Supabase実装
│   └── services/
├── components/            # UIコンポーネント
│   ├── ui/               # 基本コンポーネント（Shadcn UI）
│   ├── features/         # 機能別コンポーネント
│   └── layouts/
└── hooks/                # カスタムReactフック
```

### 主要な設計パターン

1. **リポジトリパターン**: インターフェースの背後でデータアクセスを抽象化
2. **ユースケースパターン**: 各ビジネス操作は個別のユースケース
3. **値オブジェクト**: バリデーションをカプセル化（例：UserId、MatchId、PredictionScore）
4. **Server/Client コンポーネント分離**: パフォーマンスの最適化
5. **複合コンポーネント**: 複雑なUI用（FormationPitch、PlayerCard等）

## 開発コマンド

```bash
# 開発
pnpm dev

# 品質チェック（コミット前に実行）
pnpm lint              # ESLint（自動修正付き）
pnpm build             # プロダションビルド

# 個別コマンド
pnpm type-check        # TypeScript型チェック
pnpm test              # テスト実行（Vitest - 追加予定）
pnpm storybook         # Storybook開発サーバー
pnpm build-storybook   # Storybookビルド
```

## テスト戦略

このプロジェクトは**TDD（テスト駆動開発）**と**ゼロ警告ポリシー**に従います。

```
__tests__/
├── unit/                 # 高速な単体テスト（ドメイン層90%カバレッジ目標）
├── integration/          # APIとリポジトリのテスト
└── fixtures/            # テストデータとモック
```

テストを先に書き、テスト実行中のコンソール警告/エラーをゼロにします。

## UI開発・デザインシステム

### Storybook
UIコンポーネントの開発・テスト・ドキュメント化にStorybookを使用します。

**設定内容:**
- **フレームワーク**: Next.js + Vite（高速ビルド）
- **アドオン**: Accessibility (a11y)、Docs、Vitest統合
- **対応機能**: レスポンシブ表示、アクセシビリティチェック、インタラクションテスト

**Story作成指針:**
1. **必須バリエーション**: 基本状態、エラー状態、ローディング状態
2. **エッジケース**: 長いテキスト、空データ、極端な値
3. **アクセシビリティ**: キーボード操作、スクリーンリーダー対応
4. **レスポンシブ**: モバイル・タブレット・デスクトップ表示

**ディレクトリ構造:**
```
src/components/
├── ui/                   # 基本UIコンポーネント（shadcn/ui）
├── features/            # 機能別コンポーネント
│   └── matches/
│       ├── MatchCard.tsx
│       ├── MatchCard.stories.ts
│       ├── MatchList.tsx
│       └── MatchList.stories.ts
└── layouts/             # レイアウトコンポーネント
```

## 環境セットアップ

1. `.env.example`を`.env.local`にコピー
2. Supabase認証情報を設定：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```
3. API-Football認証情報を設定：
   ```env
   API_FOOTBALL_KEY=your_api_key
   ```

## コアビジネスエンティティ

- **User**: フォーメーション予想を行うユーザー
- **Match**: 予想対象となるサッカーの試合
- **Team**: サッカークラブチーム
- **Player**: 選手情報
- **Prediction**: ユーザーのフォーメーション予想
- **Formation**: フォーメーションシステム（4-4-2等）
- **PredictionResult**: 予想結果とポイント

## API設計

一貫したレスポンス形式のRESTfulエンドポイント：
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "..." }
}
```

エラーレスポンス：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザーフレンドリーなメッセージ"
  }
}
```

## 重要な設計上の決定

1. **SEOファースト**: すべての試合詳細ページは適切なメタタグでサーバーレンダリング必須
2. **リアルタイム性**: 試合状況とランキングの即座な更新（Supabase Realtime使用）
3. **型安全性**: `any`型を使用しない厳密なTypeScript
4. **エラーハンドリング**: `AppError`基底クラスを拡張した構造化エラークラス
5. **パフォーマンス**: 人気ページにはISR、その他には動的レンダリングを使用

## データベーススキーマ

Supabase（PostgreSQL）を使用し、以下の主要テーブルを持つ：

- `users`: ユーザーアカウント
- `teams`: サッカークラブチーム
- `players`: 選手情報
- `matches`: 試合データ
- `predictions`: フォーメーション予想
- `prediction_results`: 予想結果とポイント
- `formations`: フォーメーションシステム

すべてのテーブルはUUID主キーを使用し、`created_at`、`updated_at`、および`deleted_at`によるソフトデリートを含みます。

## フロントエンドガイドライン

- デフォルトでServer Componentsを優先
- 必要な場合のみ`'use client'`を使用（フォーム、インタラクティブ性）
- 再利用性のためにジェネリックコンポーネント + アダプターパターンに従う
- スタイリングにはTailwind CSSとCVAを使用
- 適切なローディングとエラー状態を実装
- モバイルファーストのレスポンシブデザインを確保

## 避けるべき一般的な落とし穴

1. ServerとClient Components間でクラスインスタンスを渡さない（プレーンオブジェクトにシリアライズ）
2. `grep`や`find`コマンドを使わない - 代わりにGrep/Globツールを使用
3. ファイルを書く前に必ず存在を確認（WriteよりEditを優先）
4. コードをコミットする前に`pnpm lint`を実行
5. コンポーネントは小さく、単一責任に集中させる
6. Supabase Authテストでは、常に`jsdom`環境を使用（`node`ではない）
7. セッション汚染を防ぐためにサービスロールとユーザークライアントを分離
8. ライブラリ固有の問題は`.claude/03_library_docs/`を確認

## プロジェクトドキュメントガイド

プロジェクトには`.claude/`ディレクトリに包括的なドキュメントがあります。各ドキュメントをいつ参照すべきかを示します。

### 📋 プロジェクトコンセプトと要件
- **`.claude/00_project/01_appcadia_concept_requirements.md`** - ビジネス要件と機能仕様
- **`.claude/00_project/02_inception_deck.md`** - プロジェクトビジョンと目標
- **使用する場面**: ビジネスロジック、機能要件、またはプロジェクト目標の理解時

### 🏗️ 技術設計ドキュメント

#### システムアーキテクチャ
- **`.claude/01_development_docs/01_architecture_design.md`** - DDDとクリーンアーキテクチャの実装詳細
- **使用する場面**: レイヤーの責任の理解、新機能の追加、リファクタリング時

#### データベース設計
- **`.claude/01_development_docs/02_database_design.md`** - 完全なER図とテーブル定義
- **使用する場面**: データベースクエリの作業、新しいテーブル/カラムの追加、関係の理解時

#### API設計
- **`.claude/01_development_docs/03_api_design.md`** - RESTful APIエンドポイントと契約
- **使用する場面**: 新しいエンドポイントの実装、リクエスト/レスポンス形式の理解時

#### フロントエンド設計
- **`.claude/01_development_docs/04_screen_transition_design.md`** - 画面フローとUI構造
- **`.claude/01_development_docs/10_frontend_design.md`** - コンポーネントパターンとフロントエンドアーキテクチャ
- **使用する場面**: 新しいページの作成、UIコンポーネントの実装、ナビゲーションの理解時

#### SEO要件
- **`.claude/01_development_docs/05_seo_requirements.md`** - SEO最適化戦略
- **使用する場面**: SEOを考慮したページの実装、メタタグの作業時

#### エラーハンドリング
- **`.claude/01_development_docs/06_error_handling_design.md`** - エラーハンドリングパターンと戦略
- **使用する場面**: エラーハンドリングの実装、カスタムエラークラスの作成時

#### 型定義
- **`.claude/01_development_docs/07_type_definitions.md`** - TypeScript型システム設計
- **使用する場面**: 新しい型の作成、ドメインモデルの理解時

#### 開発セットアップ
- **`.claude/01_development_docs/08_development_setup.md`** - 環境セットアップと開発ワークフロー
- **使用する場面**: ローカル環境のセットアップ、開発コマンドの理解時

#### テスト戦略
- **`.claude/01_development_docs/09_test_strategy.md`** - TDDアプローチとテストパターン
- **使用する場面**: テストの作成、テスト構造の理解、TDDの実装時

#### CI/CD
- **`.claude/01_development_docs/11_cicd_design.md`** - GitHub Actionsとデプロイパイプライン
- **使用する場面**: CI/CDワークフローの変更、デプロイプロセスの理解時

#### E2Eテスト
- **`.claude/01_development_docs/12_e2e_test_design.md`** - E2Eテスト設計（Playwright、エラー監視、クリティカルパス）
- **使用する場面**: E2Eテスト実装、ブラウザテスト作成、エラー監視の設定時

#### セキュリティ
- **`.claude/01_development_docs/13_security_design.md`** - セキュリティ設計（認証、入力検証、ファイルアップロード）
- **使用する場面**: セキュリティ実装、認証・認可、ファイルアップロード機能の実装時

#### パフォーマンス
- **`.claude/01_development_docs/14_performance_optimization.md`** - パフォーマンス最適化（Core Web Vitals、画像最適化、キャッシュ戦略）
- **`.claude/01_development_docs/15_performance_monitoring.md`** - パフォーマンス計測・監視（Lighthouse、Web Vitals、プロセス管理）
- **使用する場面**: パフォーマンス改善、SEO対策、画像処理の実装時、継続的な監視体制の構築時

### 🎨 デザインシステム
- **`.claude/02_design_system/00_basic_design.md`** - デザインシステム概要とクイックスタート
- **`.claude/02_design_system/01_design_principles.md`** - デザイン原則、カラーシステム、タイポグラフィ
- **`.claude/02_design_system/02_component_design.md`** - Shadcn UIベースのコンポーネント設計
- **`.claude/02_design_system/04_layout_system.md`** - レイアウトシステムとグリッド設計
- **`.claude/02_design_system/03_animation_system.md`** - アニメーションパターンと実装
- **使用する場面**: UI実装、コンポーネント作成、スタイリング、アニメーション実装時

### 📚 ライブラリドキュメント
- **`.claude/03_library_docs/01_shadcn_doc.md`** - Shadcn UI全コンポーネントの完全ガイド
- **`.claude/03_library_docs/02_api_football_doc.md`** - API-Football APIの使用方法とデータ構造
- **`.claude/03_library_docs/03_supabase_auth_storage_vitest.md`** - Supabase認証・ストレージのテスト方法
- **`.claude/03_library_docs/04_nextjs_app_router_patterns.md`** - Next.js App Routerパターン集
- **使用する場面**:
    - Shadcn UIコンポーネントの実装時
    - API-Footballとの連携実装時
    - Supabase機能のテスト作成時
    - Next.js App Router実装時、ルーティング設計時

### クイックリファレンスマップ

| タスク | 主要ドキュメント |
|------|------------------|
| 新機能の追加 | アーキテクチャ → データベース → API → フロントエンド設計 |
| 新しいAPIエンドポイントの作成 | API設計 → エラーハンドリング → 型定義 |
| データベース変更 | データベース設計 → 型定義 |
| UI実装 | フロントエンド設計 → デザインシステム → コンポーネント設計 |
| スタイリング・アニメーション | デザイン原則 → コンポーネント設計 → アニメーションシステム |
| Shadcn UIコンポーネント実装 | Shadcnドキュメント → コンポーネント設計 |
| テストの作成 | テスト戦略 → アーキテクチャ（レイヤー別） |
| 認証機能のテスト | テスト戦略 → Supabase Auth Storage Vitest |
| ストレージ機能のテスト | テスト戦略 → Supabase Auth Storage Vitest |
| E2Eテスト実装 | E2Eテスト設計 → テスト戦略 |
| セキュリティ実装 | セキュリティ設計 → Supabase Auth Storage Vitest |
| パフォーマンス改善 | パフォーマンス最適化 → SEO要件 |
| パフォーマンス監視 | パフォーマンス監視 → パフォーマンス最適化 |
| App Router実装 | Next.js App Routerパターン → フロントエンド設計 |
| デプロイ/CI | CI/CD設計 → 開発セットアップ |
| エラーハンドリング | エラーハンドリング → 型定義 |
| SEO実装 | SEO要件 → パフォーマンス最適化 |
| API-Football連携 | API-Footballドキュメント → API設計 |