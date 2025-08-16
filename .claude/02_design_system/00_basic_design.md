### **PROVE XI Design System**

このデザインシステムは、Webアプリ「PROVE XI」におけるユーザーインターフェースの一貫性、品質、開発効率を担保するための公式ガイドラインです。

### **哲学と基本原則**

- **コンセプト: The Pitch After Dark**
  夜のスタジアムの照明に照らされたピッチが持つ「静かな興奮」と、データ分析の「知的さ」を融合させます。ダークテーマを基盤に、ユーザーがフォーメーション予想に深く没入できる体験を目指します。
- **基本原則 (Apple HIG準拠)**
    1. **明瞭さ (Clarity):** テキストは読みやすく、アイコンは精密で、UIは直感的でなければなりません。装飾は控えめにし、機能性を最優先します。
    2. **奥行き (Depth):** 視覚的な階層とインタラクティブな要素を通じて、ユーザーがコンテンツとの関係性を自然に理解できるよう導きます。影やぼかしは、繊細かつ意図的に使用します。
    3. **一貫性 (Consistency):** システム全体で一貫したインターフェース要素や操作方法を用いることで、ユーザーの学習コストを下げ、アプリを容易に使いこなせるようにします。

---

### **1. カラーシステム (Color System)**

**「The Pitch After Dark」のカラーパレットを、役割ベースで再定義します。**

| カテゴリ | 用途 | カラー (Tailwind Class / shadcn/ui variable) | 説明 |
| --- | --- | --- | --- |
| **背景 (Background)** | 全体の背景、カードの背景 | `bg-background` (`slate-950`) <br> `bg-card` (`slate-900`) | 深く落ち着きのあるダークブルーグレー。高級感と集中できる環境を提供します。 |
| **テキスト (Foreground)** | メインテキスト、サブテキスト | `text-foreground` (`slate-50`) <br> `text-muted-foreground` (`slate-400`) | 背景に対して十分なコントラスト比を確保した、可読性の高いカラーです。 |
| **プライマリ (Primary)** | 主要なボタン、アクティブUI、フォーカスリング | `bg-primary` (`lime-400`) <br> `text-primary-foreground` (`lime-950`) <br> `ring-primary` | 最も重要なアクションを促すための、視認性が高いエネルギッシュなカラーです。 |
| **アクセント (Accent)** | 報酬、勝利、ランキング上位など特別なUI | `bg-accent` (`amber-400`) <br> `text-accent` | ユーザーの達成感を演出し、モチベーションを高めるための特別なカラーです。 |
| **境界線・入力欄 (Border/Input)** | カードの枠線、区切り線、入力欄の枠 | `border` (`slate-800`) <br> `input` (`slate-800`) | 要素を繊細に区切り、UIの構造を明確にします。 |
| **破壊的 (Destructive)** | 削除、警告などの危険なアクション | `bg-destructive` (`red-600`) | ユーザーに注意を促す、破壊的なアクションに使用します。 |

---

### **2. タイポグラフィ (Typography)**

**Apple風ルールに基づき、情報階層を明確にするためのルールを定義します。** `Inter` フォントファミリーの使用を推奨します。

| 用途 / クラス名 | フォントサイズ・ウェイト (Tailwind) | 行の高さ (leading) | 使用例 |
| --- | --- | --- | --- |
| **見出し 1 (`h1`)** | `text-4xl font-bold tracking-tight` | `1.1` | ページのメインタイトル |
| **見出し 2 (`h2`)** | `text-3xl font-semibold tracking-tight` | `1.2` | セクションタイトル |
| **見出し 3 (`h3`)** | `text-2xl font-semibold tracking-tight` | `1.25` | カードタイトル |
| **本文 (`p`)** | `text-base font-normal` | `1.75` (`leading-relaxed`) | 主要な説明文、本文 |
| **小テキスト (`small`)** | `text-sm font-medium` | `1.5` | メタ情報、キャプション |
| **補助テキスト (`muted`)** | `text-sm text-muted-foreground` | `1.5` | 日付、非アクティブな情報 |

---

### **3. 余白・間隔 (Spacing & Layout)**

**`8px`を基本単位とするスペーシングシステムを導入し、UI全体に一貫したリズムと呼吸感をもたらします。**

| 単位 | ピクセル | Tailwind クラス (例) | 用途 |
| --- | --- | --- | --- |
| **1x** | `8px` | `p-2`, `gap-2` | 最小単位の間隔 (例: アイコンとテキストの間) |
| **2x** | `16px` | `p-4`, `gap-4` | コンポーネント内部の要素間 |
| **3x** | `24px` | `p-6`, `gap-6` | **標準パディング。** カード内部の余白など |
| **4x** | `32px` | `p-8`, `gap-8` | セクション間の大きなマージン、ページの左右パディング |

---

### **4. 角丸と境界線 (Corner Radius & Borders)**

**要素の特性に応じて角丸を使い分け、境界線でUIの構造を繊細に表現します。**

- **角丸 (Border Radius):**
    - **`rounded-lg` (0.75rem):** **デフォルト。** カード、ダイアログ、画像コンテナ。
    - **`rounded-md` (0.5rem):** ボタン、入力欄。
    - **`rounded-full`:** アバター、円形UI。
- **境界線 (Borders):**
    - 全てのカードや入力要素には、`border border-slate-800` を適用し、ダークテーマ内で要素の輪郭を明確にします。

---

### **5. 影の効果と階層 (Shadows & Elevation)**

**ダークテーマにおける影の扱いを、Apple風の繊細さと「The Pitch After Dark」の表現力を統合して定義します。**

- **基本状態:** 影は使用せず、`border` (`border-slate-800`) のみで要素の境界を表現します。
- **インタラクション時 (ホバーなど):** ユーザーの操作に対するフィードバックとして、プライマリーカラーの微かな光彩を加えます。これにより、要素が浮かび上がるような感覚を与えます。
    - **Tailwindクラス:** `transition-all hover:border-lime-400/30 hover:shadow-2xl hover:shadow-lime-500/10`
- **浮遊要素 (ダイアログ、ポップオーバー):** 他のUIから明確に独立した階層にあることを示すため、よりはっきりとした影を適用します。
    - **Tailwindクラス:** `shadow-2xl shadow-black/40`

---

### **6. コンポーネント設計 (Component Design)**

**上記ルールを適用した、主要コンポーネントの具体的な設計例です。**

### **カード (`<Card />`)**

情報のコンテナとして最も重要なコンポーネント。スペーシング、タイポグラフィ、境界線のルールを厳格に適用します。

```html
<Card className="bg-card text-card-foreground border-slate-800 rounded-lg">
  <CardHeader className="p-6">
    <CardTitle className="h3">プレミアリーグ 第10節</CardTitle>
    <CardDescription className="pt-1 text-muted-foreground">
      2025/10/26 20:00 KICK OFF
    </CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    <p>ここに試合に関する詳細情報やフォーメーションが表示されます。</p>
  </CardContent>
</Card>

```

### **ボタン (`<Button />`)**

アクションの重要度に応じてバリアントを使い分けます。

| バリアント | クラス (例) | 用途 |
| --- | --- | --- |
| **Primary** | `bg-primary text-primary-foreground hover:bg-primary/90 rounded-md` | 「予想を投稿する」 |
| **Secondary** | `bg-slate-800 text-foreground hover:bg-slate-700 rounded-md` | 「マイページへ」 |
| **Outline** | `border-input bg-transparent hover:bg-slate-800 rounded-md` | 「リセットする」 |

---

### **7. アクセシビリティ (Accessibility)**

**すべてのユーザーが快適に利用できるプロダクトを目指し、以下の項目を必須とします。**

- **コントラスト:** テキストと背景のコントラスト比は、WCAG 2.1 の `AA` レベル (4.5:1) 以上を必ず確保します。特に `text-muted-foreground` の使用箇所は注意が必要です。
- **フォーカス表示:** キーボード操作時のフォーカスインジケーターは、`shadcn/ui` のデフォルト (`focus-visible:ring-2 focus-visible:ring-ring`) を必ず表示させます。
- **セマンティクス:** アイコンのみのボタンには `aria-label` で説明を加えるなど、適切なHTML構造と属性を使用します。

このデザインシステムに従うことで、「Formation Planner」は美しさ、使いやすさ、そして開発のしやすさを兼ね備えた、質の高いアプリケーションとして成長していくでしょう。