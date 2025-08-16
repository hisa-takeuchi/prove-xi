## Next.js App Router 実装パターン集

Next.jsのApp Routerは、React Server Componentsをベースにした新しいアーキテクチャを採用し、これまでのPages Routerとは異なる開発スタイルが求められます。ここでは、App Router特有の実装パターンを、具体的なユースケースと共に解説します。

### 1. Server ComponentsとClient Componentsの使い分け

App Routerでは、すべてのコンポーネントがデフォルトで**Server Components**として扱われます。 インタラクティブな機能が必要な場合にのみ、`"use client"`ディレクティブをファイルの先頭に記述して**Client Components**にオプトインします。

**基本的な戦略**は、「**まずはServer Componentsで構築し、必要な部分だけをClient Componentsに切り出す**」ことです。 これにより、クライアントに送信されるJavaScriptの量を最小限に抑え、パフォーマンスを最大化できます。

| コンポーネント種別 | 主な用途 | 特徴 |
| :--- | :--- | :--- |
| **Server Components** | ・データフェッチ<br>・バックエンドリソースへの直接アクセス（DB、ファイルシステム）<br>・機密情報（APIキーなど）の保持<br>・大規模な依存関係を持つライブラリのサーバー上での利用 | ・サーバーでのみレンダリング<br>・クライアントへのJSバンドルを削減し、初期表示が高速<br>・`useState`, `useEffect`などのフックは使用不可<br>・イベントリスナー（`onClick`など）は使用不可 |
| **Client Components** | ・インタラクティブなUI（クリック、フォーム入力など）<br>・状態管理（`useState`, `useReducer`）<br>・ライフサイクルエフェクト（`useEffect`）<br>・ブラウザ専用API（`window`, `localStorage`など）の利用 | ・`"use client"` をファイルの先頭に記述<br>・従来のReactコンポーネントと同様の振る舞い<br>・サーバーで事前レンダリング後、クライアントでハイドレーションされる |

---

#### **実装パターン1：静的・動的コンテンツの表示 (Server Components)**
ブログ記事や商品詳細ページなど、サーバーから取得したデータを表示するだけの非インタラクティブなUIは、Server Componentsの最も基本的な使い方です。`async/await`を直接利用してデータを取得できます。

```tsx:app/posts/[slug]/page.tsx
// DBやAPIからデータを取得する関数
async function getPost(slug) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  return res.json();
}

// ページコンポーネントはデフォルトでServer Component
export default async function PostPage({ params }) {
  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}
```

---

#### **実装パターン2：インタラクティブなUI (Client Components)**
カウンターやトグルボタンなど、ユーザーの操作によって状態が変化するUIにはClient Componentsを使用します。

```tsx:app/components/Counter.tsx
'use client'; // Client Componentとしてマーク

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

---

#### **実装パターン3：Server ComponentsとClient Componentsの連携 (Composition)**
Server ComponentsからClient Componentsをインポートして利用することは可能です。しかし、Client Componentsの中からServer Componentsを直接インポートすることはできません。

この制約を回避し、Client Componentsの子要素としてServer Componentsを渡す「Composition Pattern」が有効です。これにより、状態を持つラッパーコンポーネント（クライアント）と、静的なコンテンツ（サーバー）を組み合わせることができます。

```tsx:app/dashboard/page.tsx
import ClientWrapper from './ClientWrapper';
import ServerInfo from './ServerInfo';

// Server Component (page.tsx)
export default function DashboardPage() {
  return (
    // Client ComponentにServer Componentをchildrenとして渡す
    <ClientWrapper>
      <ServerInfo />
    </ClientWrapper>
  );
}
```

```tsx:app/dashboard/ClientWrapper.tsx
'use client';

import { useState } from 'react';

// Client Component
export default function ClientWrapper({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide' : 'Show'}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}
```

```tsx:app/dashboard/ServerInfo.tsx
import { cookies } from 'next/headers';

// Server Component
export default async function ServerInfo() {
  const lastLogin = cookies().get('lastLogin')?.value;
  // サーバーサイドでのみ実行される処理
  const serverTime = new Date().toLocaleTimeString();

  return (
    <div>
      <p>Server Time: {serverTime}</p>
      <p>Last Login: {lastLogin || 'N/A'}</p>
    </div>
  );
}
```

### 2. データフェッチングのパターン

App Routerでは、データフェッチは主にServer Componentsで行うことが推奨されます。 これにより、データソースに近い場所で処理が実行され、パフォーマンスが向上します。

#### **実装パターン1：キャッシュと再検証 (Data Cache)**
Next.jsは`fetch`APIを拡張し、自動的にデータをキャッシュします。 キャッシュの挙動はオプションで細かく制御できます。

*   **時間ベースの再検証 (`revalidate`)**: 指定した秒数が経過した後、次にリクエストがあったタイミングでデータを再検証（再取得）します。

    ```tsx
    // 60秒ごとにデータを再検証
    const res = await fetch('https://api.example.com/posts', {
      next: { revalidate: 60 },
    });
    ```

*   **オンデマンド再検証 (`tags`)**: `revalidateTag`や`revalidatePath`をServer ActionやAPI Route内で呼び出すことで、任意のタイミングで特定のキャッシュを破棄できます。

    ```tsx
    // データ取得時にタグを付与
    const res = await fetch('https://api.example.com/posts', {
      next: { tags: ['posts'] },
    });

    // Server Action内でキャッシュを再検証
    'use server';
    import { revalidateTag } from 'next/cache';

    export async function createPost(formData) {
      // DBに投稿を作成する処理...
      revalidateTag('posts'); // 'posts'タグを持つキャッシュを破棄
    }
    ```

---

#### **実装パターン2：UIのストリーミング (`loading.js` と `Suspense`)**
データ取得のような時間のかかる処理がある場合、その部分をストリーミングすることで、ユーザーの体感速度を向上させることができます。

*   **`loading.js`**: ルートセグメントに`loading.js`ファイルを追加するだけで、そのページの読み込み中に表示されるローディングUIを簡単に実装できます。 Next.jsが自動的に`Suspense`でページをラップします。

    ```tsx:app/dashboard/loading.tsx
    export default function Loading() {
      // スケルトンコンポーネントなどを表示
      return <p>Loading dashboard...</p>;
    }
    ```

*   **`Suspense`**: ページの一部だけをストリーミングしたい場合、Reactの`Suspense`コンポーネントを手動で配置します。

    ```tsx:app/dashboard/page.tsx
    import { Suspense } from 'react';
    import UserProfile from './UserProfile'; // データフェッチを行うコンポーネント
    import UserPosts from './UserPosts';   // データフェッチを行うコンポーネント

    export default function DashboardPage() {
      return (
        <section>
          <h1>Dashboard</h1>
          <Suspense fallback={<p>Loading profile...</p>}>
            <UserProfile />
          </Suspense>
          <Suspense fallback={<p>Loading posts...</p>}>
            <UserPosts />
          </Suspense>
        </section>
      );
    }
    ```

---

#### **実装パターン3：データの更新 (Server Actions)**
Server Actionsは、フォーム送信などのデータ更新処理をサーバーサイドで安全に実行するための仕組みです。 `"use server"`ディレクティブを使って定義し、クライアント側のフォームから直接呼び出すことができます。

```tsx:app/components/AddPostForm.tsx
'use client';

import { createPost } from '@/app/actions';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

export default function AddPostForm() {
  return (
    <form action={createPost}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <SubmitButton />
    </form>
  );
}
```

```tsx:app/actions.ts
'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title');
  const content = formData.get('content');

  // データベースにデータを保存する処理...
  // await db.post.create({ data: { title, content } });

  revalidateTag('posts'); // 投稿一覧のキャッシュを再検証
  redirect('/posts');   // 投稿一覧ページにリダイレクト
}
```

### 3. エラーハンドリング

#### **実装パターン1：予期せぬエラーのハンドリング (`error.js`)**
ルートセグメントに`error.js`ファイルを作成すると、そのセグメントとその子コンポーネントで発生した予期せぬエラーをキャッチし、フォールバックUIを表示できます。 このコンポーネントには、エラーからの復旧を試みる`reset`関数がpropsとして渡されます。

**注意**: `error.js`はClient Componentである必要があります。

```tsx:app/dashboard/error.tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

#### **実装パターン2：Not Foundページのハンドリング (`not-found.js`)**
`not-found.js`ファイルを使うと、そのルートセグメントでデータが見つからなかった場合に表示されるUIを定義できます。 サーバーコンポーネント内で`notFound()`関数を呼び出すと、このファイルがレンダリングされます。

```tsx:app/posts/[slug]/page.tsx
import { notFound } from 'next/navigation';

async function getPost(slug) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  if (!res.ok) {
    return undefined;
  }
  return res.json();
}

export default async function PostPage({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound(); // not-found.js をレンダリング
  }

  return <article>{/* ... */}</article>;
}
```

```tsx:app/posts/[slug]/not-found.tsx
export default function NotFound() {
  return <h1>Post not found</h1>;
}
```

### 4. SEO対策：Metadata API

App Routerには、ページの`<head>`タグを管理するための強力なMetadata APIが用意されています。

#### **実装パターン1：静的なメタデータ**
`layout.js`または`page.js`で`metadata`オブジェクトをエクスポートすることで、静的なメタデータを設定できます。

```tsx:app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Awesome App',
  description: 'Generated by create next app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

#### **実装パターン2：動的なメタデータ**
ページのコンテンツに応じてメタデータを動的に生成するには、`generateMetadata`関数をエクスポートします。

```tsx:app/posts/[slug]/page.tsx
import type { Metadata } from 'next';

async function getPost(slug) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  return res.json();
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function Page({ params }) {
  // ... ページコンポーネントのロジック
  return <div>...</div>;
}```