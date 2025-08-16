## Supabaseテスト実践ガイド：認証・ストレージからDBテストまで
このドキュメントでは、公式ドキュメントを参考に、Supabaseプロジェクトにおけるテスト戦略を体系的に解説します。特に詰まりやすい環境設定、認証・ストレージのテスト、そしてデータベース自体のテストに焦点を当て、具体的な解決策とベストプラクティスを提示します。

### テスト戦略の概要：2つのアプローチ

Supabaseのテストは、大きく2つのアプローチに分けられます。 プロジェクトの要件に応じてこれらを組み合わせることが、堅牢なアプリケーションを構築する鍵となります。

1.  **アプリケーションレベルのテスト**:
    *   **内容**: アプリケーションコード（Next.js, Reactなど）からSupabaseクライアント（`supabase-js`）を使ってテストを実行します。
    *   **目的**: ユーザーの視点から、機能がエンドツーエンドで正しく動作すること（ログイン、データ表示、ファイルアップロードなど）を検証します。
    *   **種類**: ユニットテスト、インテグレーションテスト、E2Eテスト。

2.  **データベースレベルのテスト**:
    *   **内容**: SQL（pgTAP拡張）を使ってデータベース内部のロジックを直接テストします。
    *   **目的**: RLSポリシー、データベース関数、トリガーなどが意図通りに機能することを、アプリケーションを介さずに低レベルで検証します。
    *   **種類**: データベースのユニットテスト。

---

### 1. テスト環境の構築

安定したテストには、本番から隔離された一貫性のある環境が不可欠です。**Supabase CLIを使ったローカル環境**の利用が最も推奨されます。

#### **ローカル環境のセットアップと運用**

1.  **Supabaseプロジェクトの初期化と起動**:
    ```bash
    # プロジェクトを初期化
    supabase init

    # Dockerコンテナを起動
    supabase start
    ```

2.  **テスト前のデータベースリセット**:
    テストの独立性を保つため、各テストスイートの実行前にデータベースをクリーンな状態に戻します。
    ```bash
    # 全ての変更を破棄し、マイグレーションを再適用して初期状態に戻す
    supabase db reset
    ```

3.  **CI/CDでの利用**:
    GitHub ActionsなどのCI環境でもSupabase CLIをセットアップし、プルリクエストごとに `supabase db reset` とテストコマンドを実行することで、自動テストのパイプラインを構築できます。

#### **環境変数**
テストコードからローカルのSupabaseに接続するため、`.env.local` や `.env.test` に環境変数を設定します。特に、テストユーザーの管理には `SERVICE_ROLE_KEY` が必須です。

```: .env.local
# ローカルSupabaseのデフォルト値
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

---

### 2. アプリケーションレベルのテスト

Jest, Vitest, Playwright, Cypressなど、好みのフレームワークを使って実装します。

#### **2.1. ユニットテスト (ロジックの検証)**

ビジネスロジックに集中するため、`supabase-js`クライアントをモック（偽物）に置き換えます。

*   **`jest.mock` / `vi.mock`**:
    テストフレームワークの機能でクライアントを直接モック化します。ログイン状態やデータ取得の成功・失敗など、特定のシナリオを簡単にシミュレートできます。

*   **Mock Service Worker (MSW)**:
    ネットワークリクエストレベルでAPIをインターセプトします。Supabaseクライアントが内部的に発行するREST APIのエンドポイント（例: `/rest/v1/todos`）を捕捉し、偽のレスポンスを返すことで、より実際の通信に近い形でのテストが可能です。

#### **2.2. E2E / インテグレーションテスト (機能フローの検証)**

実際のローカルSupabase環境に接続し、ユーザー操作を模倣してアプリケーション全体のフローをテストします。

**重要なコンセプト：テストの分離 (Test Isolation)**
アプリケーションレベルのテストでは、安易にデータベースをリセットするとテストの並列化が難しくなり、実行速度が低下します。そのため、**各テストが他のテストに影響を与えないよう、データを分離する**戦略が重要です。

*   **戦略**: テストごとにユニークなID（ユーザーID、投稿IDなど）を生成し、そのIDに紐づくデータのみを操作します。テスト終了後、`afterEach` や `afterAll` フックで作成したデータをクリーンアップします。

**実装パターン：認証 (Auth)**

テストユーザーを動的に作成・削除するには、`service_role`キーを持つ管理者クライアントを使用します。

```typescript: tests/utils/auth.ts
import { createClient } from '@supabase/supabase-js';

// このクライアントはサーバーサイドでのみ使用する
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createTestUser() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // テストのためにメール認証を自動で完了させる
  });
  if (error) throw error;
  return { ...data.user, password };
}

export async function deleteTestUser(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}
```

**実装パターン：ストレージ (Storage)**

1.  **テスト用バケットの準備**: ローカル環境に `test-avatars` のようなテスト専用バケットを作成します。
2.  **テストの実行**: PlaywrightなどでファイルアップロードのUIを操作し、実際にファイルがアップロードされることを確認します。
3.  **クリーンアップ**: テスト終了後、アップロードしたファイルを `supabase.storage.from('test-avatars').remove(['path/to/file.png'])` で削除します。

**E2Eテストの効率化: `Supawright`**
Playwrightを使ったE2Eテストでは、`Supawright` のようなヘルパーライブラリが非常に強力です。 テストに必要なユーザーや関連レコードを自動で作成し、テスト終了後にはそれらを自動でクリーンアップしてくれるため、テストコードの記述を大幅に簡略化できます。

---

### 3. データベースレベルのテスト (`pgTAP`)

RLSポリシーやデータベース関数など、セキュリティとデータの整合性に関わるロジックは、データベースレベルでテストすることが最も確実です。Supabaseは、PostgreSQLのテストフレームワーク `pgTAP` を `supabase test db` コマンドで簡単に実行できる仕組みを提供しています。

**特徴**:

*   **テストの分離**: 各テストファイルはトランザクション内で実行されます。テストの開始時に `begin()`、終了時に `rollback()` を呼ぶことで、データベースへの変更が自動的に破棄され、テスト間の完全な分離が保証されます。
*   **高速**: アプリケーションの起動やUI操作が不要なため、非常に高速に実行できます。
*   **RLSのテストに最適**: `set_session` などの関数を使い、特定のロール（`authenticated`, `anon`など）やJWTクレームを持つユーザーになりすまして、ポリシーを直接テストできます。

**実装パターン：RLSポリシーのテスト**

1.  **テストファイルの作成**: `supabase/tests/database/policies.test.sql` のようなファイルを作成します。
2.  **テストの記述**:
    ```sql: supabase/tests/database/rls_test.sql
    begin;

    -- テスト計画を宣言
    select plan(2);

    -- テスト用のデータを作成
    insert into public.profiles (id, username)
    values ('a85a8a48-2b1e-43a9-834c-128a3339b97a', 'testuser');

    -- 'authenticated' ロールになりすます
    select set_session_auth('a85a8a48-2b1e-43a9-834c-128a3339b97a', 'authenticated');

    -- RLSポリシーのテスト: 自分のプロフィールは閲覧できるはず
    select results_eq(
      'select count(*)::int from public.profiles',
      array[1],
      'Authenticated user can view their own profile.'
    );

    -- 'anon' (匿名) ロールになりすます
    select set_session_auth(null, 'anon');

    -- RLSポリシーのテスト: 匿名ユーザーはプロフィールを閲覧できないはず
    select results_eq(
      'select count(*)::int from public.profiles',
      array[0],
      'Anonymous user cannot view any profiles.'
    );

    -- 変更をロールバックしてテストを終了
    select * from finish();
    rollback;
    ```
3.  **テストの実行**:
    ```bash
    supabase test db
    ```

### 4. 高度なテストシナリオ

基本的なCRUD、認証、ストレージに加えて、Supabaseが提供するより高度な機能のテスト方法について解説します。

#### **4.1 Edge Functionsのテスト**

Edge FunctionsはDenoで実行されるため、Deno標準のテストツールキットが利用できます。

*   **ユニットテスト**:
    関数のビジネスロジックに特化したテストです。入力に対して期待される出力を返すか、エラー処理が正しく行われるかなどを検証します。`Deno.test` を使って、関数をインポートし、直接テストします。

    ```typescript: supabase/functions/my-function/index.test.ts
    import { assertEquals } from "https://deno.land/std/assert/mod.ts";
    import { handler } from "./index.ts"; // テスト対象のハンドラ関数

    Deno.test("Handler returns correct greeting", async () => {
      const request = new Request("http://example.com", {
        method: "POST",
        body: JSON.stringify({ name: "World" }),
      });

      const response = await handler(request);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.message, "Hello World!");
    });
    ```
    テストは `supabase functions test` コマンドで実行できます。

*   **インテグレーションテスト**:
    ローカルのSupabase環境と連携させ、実際にデータベースへのアクセスや他の関数呼び出しを含むテストを行います。

    1.  ローカルでEdge Functionsサーバーを起動します。このとき、テスト用の環境変数を読み込ませます。
        ```bash
        supabase functions serve --env-file ./supabase/.env.local
        ```
    2.  PlaywrightやJestなどのテストフレームワークから、ローカルで起動している関数エンドポイント（例: `http://localhost:54321/functions/v1/my-function`）にリクエストを送信し、データベースの状態変化やレスポンスを検証します。

#### **4.2 Realtime機能のテスト**

Realtime機能のテストは、状態の変更をリッスン（購読）する必要があるため、インテグレーションテストとして実装するのが最も効果的です。

**テストシナリオ例：チャットメッセージのリアルタイム受信**

1.  **準備 (Test Setup)**:
    *   テスト用のチャットルーム（`rooms`テーブルのレコード）を作成します。
    *   2人のテストユーザーを作成します（送信者と受信者）。

2.  **テスト実行**:
    *   **受信者クライアント**: 受信者ユーザーとして`supabase-js`クライアントを初期化し、`subscribe()`メソッドを使ってチャットルームのメッセージ変更を購読します。
    *   **送信者クライアント**: 送信者ユーザーとして、`insert()`メソッドを使って新しいメッセージを`messages`テーブルに挿入します。
    *   **検証 (Assertion)**: 受信者クライアントが、購読コールバック経由で新しいメッセージを正しく受信したことを検証します。`Promise`と`setTimeout`を使い、非同期なイベント受信を待ち合わせる必要があります。

```typescript: tests/integration/realtime.test.ts
test('新しいメッセージをリアルタイムに受信できる', async () => {
  // ... テストユーザーとルームをセットアップ ...

  const receiverClient = createClient(url, receiverAnonKey);
  const senderClient = createClient(url, senderAnonKey);

  const receivedMessage = new Promise((resolve) => {
    receiverClient
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public' }, (payload) => {
        resolve(payload.new);
      })
      .subscribe();
  });

  // 送信者がメッセージを送信
  await senderClient.from('messages').insert({ content: 'Hello Realtime!', room_id: testRoom.id });

  // 受信者がメッセージを受け取るのを待つ
  const message = await receivedMessage;

  expect(message.content).toBe('Hello Realtime!');

  // テスト終了時に購読を解除
  await receiverClient.removeAllChannels();
});
```

---

### 5. CI/CDへの統合 (GitHub Actions)

ローカルで確立したテストは、CI/CDパイプラインに組み込むことで真価を発揮します。GitHub Actionsを使えば、プルリクエストごとに自動でテストを実行し、品質を維持できます。

以下は、Supabase CLIを使って一時的なテスト環境を構築し、アプリケーションテストとデータベーステストを実行するワークフローの例です。

```yaml: .github/workflows/test.yml
name: Run Tests

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start local Supabase instance
        run: supabase start

      - name: Wait for Supabase to be healthy
        run: supabase status --wait

      # アプリケーションの依存関係をインストール
      - name: Install dependencies
        run: npm install

      # ローカルSupabaseのURLとキーを環境変数に設定
      - name: Set up environment variables
        run: |
          supabase status -o json > supabase_status.json
          echo "NEXT_PUBLIC_SUPABASE_URL=$(jq -r .apiURL supabase_status.json)" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(jq -r .anonKey supabase_status.json)" >> $GITHUB_ENV
          echo "SUPABASE_SERVICE_ROLE_KEY=$(jq -r .serviceKey supabase_status.json)" >> $GITHUB_ENV
          # DB接続文字列も設定 (db testで必要)
          echo "SUPABASE_DB_URL=$(jq -r .dbURL supabase_status.json)" >> $GITHUB_ENV

      - name: Run application tests (Jest, Playwright, etc.)
        run: npm test

      - name: Run database tests (pgTAP)
        run: supabase test db

      - name: Stop local Supabase instance
        if: always() # テストが失敗しても必ず実行する
        run: supabase stop
```

---

### 6. まとめとテスト戦略の選択

これまで解説してきたテスト手法を、プロジェクトのどの部分に適用すべきかをまとめます。

| テスト対象 | 推奨されるテスト手法 | 主なツール・目的 |
| :--- | :--- | :--- |
| **RLSポリシー** | **データベーステスト (`pgTAP`)** | **最重要**。SQLで直接テストし、データの漏洩や不正アクセスを確実に防ぐ。高速かつ信頼性が高い。 |
| **データベース関数、トリガー** | **データベーステスト (`pgTAP`)** | データベース内部のロジックが期待通りに動作することを検証する。 |
| **認証フロー** (ログイン/サインアップ) | **E2Eテスト** | `Playwright`, `Cypress` を使用。ユーザーの操作を模倣し、全体の流れを検証する。テストユーザー管理が鍵。 |
| **複雑なビジネスロジック** | **ユニットテスト** | `Jest`, `Vitest` を使用。Supabaseクライアントをモック化し、ロジックの正しさに集中する。高速に実行できる。 |
| **ファイルアップロード/ダウンロード** | **E2Eテスト + ユニットテスト** | UI操作を含むフローはE2Eで、関連するヘルパー関数などはユニットテストで検証する。 |
| **Realtime機能** | **インテグレーションテスト** | 2つのクライアントを用意し、片方でデータを変更、もう片方でイベント受信を検証する。 |
| **Edge Functions** | **ユニットテスト + インテグレーションテスト** | Denoのテストランナーでロジックをテストし、ローカルサーバーでDBとの連携をテストする。 |

Supabaseを利用した開発において、テスト自動化はアプリケーションの品質とセキュリティを担保するための不可欠な投資です。特に、ローカル環境でのテストを容易にするSupabase CLIと、データベースの挙動を直接検証できる`pgTAP`は強力な武器となります。

本ガイドを参考に、ユニットテストからE2E、データベーステストまでをバランス良く組み合わせ、自信を持ってデプロイできる堅牢なアプリケーションを構築してください。