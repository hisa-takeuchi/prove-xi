# 4. レイアウトシステム設計

## 4.1 レスポンシブ設計戦略

### モバイルファースト設計
```typescript
// config/breakpoints.ts
export const BREAKPOINTS = {
  xs: '320px',   // 最小スマートフォン
  sm: '640px',   // 小さいタブレット / 大きいスマートフォン
  md: '768px',   // タブレット
  lg: '1024px',  // 小さいデスクトップ
  xl: '1280px',  // デスクトップ
  '2xl': '1536px' // 大きいデスクトップ
} as const

// Tailwind CSS設定に対応
export const SCREEN_SIZES = {
  mobile: 'max-width: 767px',
  tablet: 'min-width: 768px and max-width: 1023px',
  desktop: 'min-width: 1024px'
} as const
```

### ビューポート対応
```css
/* globals.css */
/* 基本設定 */
html {
  font-size: 16px; /* 1rem = 16px */
  line-height: 1.5;
}

/* モバイル：14px base */
@media (max-width: 767px) {
  html {
    font-size: 14px;
  }
}

/* タブレット：15px base */
@media (min-width: 768px) and (max-width: 1023px) {
  html {
    font-size: 15px;
  }
}

/* デスクトップ：16px base */
@media (min-width: 1024px) {
  html {
    font-size: 16px;
  }
}
```

## 4.2 グリッドシステム

### Container設計
```typescript
// components/layouts/Container.tsx
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const containerSizes = {
  sm: 'max-w-2xl',     // 672px
  md: 'max-w-4xl',     // 896px  
  lg: 'max-w-6xl',     // 1152px
  xl: 'max-w-7xl',     // 1280px
  full: 'max-w-full'
}

const containerPadding = {
  none: 'px-0',
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12'
}

export const Container = ({ 
  size = 'xl', 
  padding = 'md', 
  children 
}: ContainerProps) => {
  return (
    <div className={cn(
      'mx-auto w-full',
      containerSizes[size],
      containerPadding[padding]
    )}>
      {children}
    </div>
  )
}
```

### Grid システム
```typescript
// components/layouts/Grid.tsx
interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 6 | 12
    md?: 1 | 2 | 3 | 4 | 6 | 12
    lg?: 1 | 2 | 3 | 4 | 6 | 12
    xl?: 1 | 2 | 3 | 4 | 6 | 12
  }
  children: React.ReactNode
}

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12'
}

const gridGaps = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12'
}

export const Grid = ({ cols = 1, gap = 'md', responsive, children }: GridProps) => {
  const getResponsiveClasses = () => {
    if (!responsive) return ''
    
    const classes = []
    if (responsive.sm) classes.push(`sm:grid-cols-${responsive.sm}`)
    if (responsive.md) classes.push(`md:grid-cols-${responsive.md}`)
    if (responsive.lg) classes.push(`lg:grid-cols-${responsive.lg}`)
    if (responsive.xl) classes.push(`xl:grid-cols-${responsive.xl}`)
    
    return classes.join(' ')
  }
  
  return (
    <div className={cn(
      'grid',
      gridCols[cols],
      gridGaps[gap],
      getResponsiveClasses()
    )}>
      {children}
    </div>
  )
}
```

## 4.3 コンポーネントレイアウト

### Stack (Vertical Layout)
```typescript
// components/layouts/Stack.tsx
interface StackProps {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  children: React.ReactNode
}

const stackSpacing = {
  none: 'space-y-0',
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8'
}

const stackAlign = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch'
}

export const Stack = ({ spacing = 'md', align = 'stretch', children }: StackProps) => {
  return (
    <div className={cn(
      'flex flex-col',
      stackSpacing[spacing],
      stackAlign[align]
    )}>
      {children}
    </div>
  )
}
```

### Cluster (Horizontal Layout)
```typescript
// components/layouts/Cluster.tsx
interface ClusterProps {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  wrap?: boolean
  children: React.ReactNode
}

const clusterSpacing = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
}

const clusterJustify = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
}

const clusterAlign = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch'
}

export const Cluster = ({ 
  spacing = 'md', 
  justify = 'start', 
  align = 'center',
  wrap = false,
  children 
}: ClusterProps) => {
  return (
    <div className={cn(
      'flex',
      wrap ? 'flex-wrap' : 'flex-nowrap',
      clusterSpacing[spacing],
      clusterJustify[justify],
      clusterAlign[align]
    )}>
      {children}
    </div>
  )
}
```

### Center (Centered Layout)
```typescript
// components/layouts/Center.tsx
interface CenterProps {
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  minHeight?: 'screen' | 'auto'
  axis?: 'horizontal' | 'vertical' | 'both'
  children: React.ReactNode
}

const centerMaxWidth = {
  none: '',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
}

export const Center = ({ 
  maxWidth = 'none',
  minHeight = 'auto',
  axis = 'both',
  children 
}: CenterProps) => {
  const getClasses = () => {
    const classes = ['mx-auto']
    
    if (minHeight === 'screen') {
      classes.push('min-h-screen')
    }
    
    if (axis === 'both' || axis === 'vertical') {
      classes.push('flex', 'items-center')
      if (axis === 'both') {
        classes.push('justify-center')
      }
    }
    
    if (maxWidth !== 'none') {
      classes.push(centerMaxWidth[maxWidth])
    }
    
    return classes.join(' ')
  }
  
  return (
    <div className={getClasses()}>
      {axis === 'both' || axis === 'vertical' ? (
        <div className={maxWidth !== 'none' ? centerMaxWidth[maxWidth] : ''}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
```

## 4.4 アプリケーション固有レイアウト

### MainLayout (アプリ全体)
```typescript
// components/layouts/MainLayout.tsx
interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  sidebarContent?: React.ReactNode
  headerActions?: React.ReactNode
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export const MainLayout = ({ 
  children, 
  showSidebar = false,
  sidebarContent,
  headerActions,
  containerSize = 'xl'
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header actions={headerActions} />
      
      <main className="pt-16"> {/* Header height offset */}
        <Container size={containerSize} padding="md">
          {showSidebar ? (
            <Grid cols={1} responsive={{ lg: 4 }} gap="lg">
              <div className="lg:col-span-3">
                {children}
              </div>
              <aside className="lg:col-span-1">
                {sidebarContent}
              </aside>
            </Grid>
          ) : (
            children
          )}
        </Container>
      </main>
      
      <Footer />
    </div>
  )
}
```

### DashboardLayout (ダッシュボード専用)
```typescript
// components/layouts/DashboardLayout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const DashboardLayout = ({ 
  children, 
  title, 
  subtitle, 
  actions 
}: DashboardLayoutProps) => {
  return (
    <div className="dashboard-layout">
      {/* ページヘッダー */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container size="xl" padding="md">
          <div className="py-6">
            <Cluster justify="between" align="center">
              <Stack spacing="xs">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-muted-foreground">{subtitle}</p>
                )}
              </Stack>
              {actions && (
                <div className="flex-shrink-0">
                  {actions}
                </div>
              )}
            </Cluster>
          </div>
        </Container>
      </div>
      
      {/* メインコンテンツ */}
      <Container size="xl" padding="md">
        <div className="py-8">
          {children}
        </div>
      </Container>
    </div>
  )
}
```

### PredictionLayout (予想ページ専用)
```typescript
// components/layouts/PredictionLayout.tsx
interface PredictionLayoutProps {
  children: React.ReactNode
  match: Match
  currentStep: 'select' | 'formation' | 'confirm'
  onStepChange: (step: 'select' | 'formation' | 'confirm') => void
}

export const PredictionLayout = ({ 
  children, 
  match, 
  currentStep, 
  onStepChange 
}: PredictionLayoutProps) => {
  return (
    <div className="prediction-layout min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* マッチ情報ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <Container size="xl" padding="md">
          <div className="py-4">
            <MatchHeader match={match} />
          </div>
        </Container>
      </div>
      
      {/* ステップナビゲーション */}
      <div className="bg-white border-b">
        <Container size="xl" padding="md">
          <PredictionSteps
            currentStep={currentStep}
            onStepChange={onStepChange}
          />
        </Container>
      </div>
      
      {/* メインコンテンツエリア */}
      <Container size="full" padding="md">
        <div className="py-8">
          {/* フォーメーションエリアは全幅を使用 */}
          {currentStep === 'formation' ? (
            <div className="max-w-none">
              {children}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
```

## 4.5 スペーシングシステム

### 一貫したスペーシング
```typescript
// config/spacing.ts
export const SPACING = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem'       // 384px
} as const
```

### セクション間スペーシング
```css
/* globals.css */
.section-spacing-sm {
  @apply py-8 md:py-12;
}

.section-spacing-md {
  @apply py-12 md:py-16 lg:py-20;
}

.section-spacing-lg {
  @apply py-16 md:py-20 lg:py-24;
}

.section-spacing-xl {
  @apply py-20 md:py-24 lg:py-32;
}
```

## 4.6 Z-Index管理

### Z-Index スケール
```typescript
// config/z-index.ts
export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,      // 固定要素
  dropdown: 1000,  // ドロップダウンメニュー
  sticky: 1020,    // スティッキー要素
  fixed: 1030,     // 固定ヘッダー/フッター
  modal: 1040,     // モーダル背景
  popover: 1050,   // ポップオーバー
  tooltip: 1060,   // ツールチップ
  toast: 1070,     // 通知
  loading: 1080    // ローディングオーバーレイ
} as const
```

## 4.7 レスポンシブ画像

### 画像レスポンシブ対応
```typescript
// components/ui/ResponsiveImage.tsx
interface ResponsiveImageProps {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2'
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
}

const aspectRatios = {
  square: 'aspect-square',
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]'
}

export const ResponsiveImage = ({
  src,
  alt,
  sizes = '(min-width: 768px) 50vw, 100vw',
  priority = false,
  aspectRatio = '16/9',
  objectFit = 'cover'
}: ResponsiveImageProps) => {
  return (
    <div className={cn('relative overflow-hidden', aspectRatios[aspectRatio])}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          'transition-transform duration-300 hover:scale-105',
          `object-${objectFit}`
        )}
      />
    </div>
  )
}
```

## 4.8 プリントスタイル

### 印刷用CSS
```css
/* globals.css */
@media print {
  * {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  .print-hidden {
    display: none !important;
  }
  
  .print-only {
    display: block !important;
  }
  
  /* ページブレーク */
  .print-break-before {
    page-break-before: always;
  }
  
  .print-break-after {
    page-break-after: always;
  }
  
  .print-break-inside-avoid {
    page-break-inside: avoid;
  }
  
  /* ランキングテーブルの印刷最適化 */
  .ranking-table {
    font-size: 12px;
  }
  
  /* フォーメーション図の印刷最適化 */
  .formation-pitch {
    max-width: 100%;
    max-height: 80vh;
  }
}
```

## 4.9 アクセシビリティ対応

### フォーカス管理
```css
/* globals.css */
/* フォーカスリング */
.focus-visible:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}

/* スキップリンク */
.skip-link {
  @apply sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50;
  @apply bg-background border border-border rounded-md px-4 py-2;
}

/* 高コントラストモード対応 */
@media (prefers-contrast: high) {
  :root {
    --border: 0 0% 20%;
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
  }
}

/* reduced-motion対応 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 4.10 パフォーマンス最適化

### レイアウトシフト対策
```typescript
// components/layouts/OptimizedLayout.tsx
export const OptimizedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="optimized-layout">
      {/* CLS (Cumulative Layout Shift) 対策 */}
      <div style={{ minHeight: '100vh' }}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  )
}
```

### Virtual Scrolling 対応
```typescript
// components/layouts/VirtualList.tsx
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
}

export const VirtualList = <T,>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem 
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )
  
  const visibleItems = items.slice(startIndex, endIndex + 1)
  
  return (
    <div
      className="virtual-list overflow-auto"
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  )
}
```