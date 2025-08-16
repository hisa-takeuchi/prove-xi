# PROVEXI フロントエンド設計書

## 1. 概要

### 1.1. フロントエンド設計の目的
- **ユーザー体験の最適化**: 直感的で使いやすいインターフェースの提供
- **保守性の向上**: 再利用可能で拡張しやすいコンポーネント設計
- **パフォーマンスの確保**: 高速で応答性の良いアプリケーション
- **一貫性の維持**: デザインシステムに基づいた統一感のあるUI

### 1.2. 技術スタック
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript (関数型アプローチ)
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: React Query + Zustand
- **アニメーション**: Framer Motion
- **フォーム**: React Hook Form + Zod

## 2. アーキテクチャ設計

### 2.1. コンポーネント階層
```
src/
├── app/                    # Next.js App Router
├── components/             # UIコンポーネント
│   ├── ui/                # shadcn/ui基本コンポーネント
│   ├── features/          # 機能別コンポーネント
│   └── layouts/           # レイアウトコンポーネント
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ・設定
└── stores/                # 状態管理
```

### 2.2. コンポーネント分類

#### UI Components (ui/)
**目的**: 再利用可能な基本UIコンポーネント

```typescript
// components/ui/button.tsx
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### Feature Components (features/)
**目的**: 機能特化型コンポーネント

```typescript
// components/features/prediction/prediction-form.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormationPitch } from './formation-pitch';
import { PlayerSelector } from './player-selector';

const predictionSchema = z.object({
  formation: z.enum(['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2']),
  players: z.array(z.object({
    playerId: z.string(),
    position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
    positionX: z.number().min(0).max(100),
    positionY: z.number().min(0).max(100),
  })).length(11),
});

type PredictionFormData = z.infer<typeof predictionSchema>;

interface PredictionFormProps {
  match: Match;
  initialData?: Partial<PredictionFormData>;
  onSubmit: (data: PredictionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PredictionForm({ 
  match, 
  initialData, 
  onSubmit, 
  isLoading = false 
}: PredictionFormProps) {
  const [selectedFormation, setSelectedFormation] = useState<string>('4-4-2');
  
  const form = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      formation: '4-4-2',
      players: [],
      ...initialData,
    },
  });

  const handleSubmit = async (data: PredictionFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Prediction submission failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {match.homeTeam.name} vs {match.awayTeam.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormationSelector
            value={selectedFormation}
            onChange={setSelectedFormation}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormationPitch
              formation={selectedFormation}
              players={form.watch('players')}
              onPlayerMove={(playerId, x, y) => {
                // プレイヤー位置更新ロジック
              }}
            />
            
            <PlayerSelector
              team={match.homeTeam}
              selectedPlayers={form.watch('players')}
              onPlayerSelect={(player) => {
                // プレイヤー選択ロジック
              }}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              下書き保存
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '提出中...' : '予想を提出'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### Layout Components (layouts/)
**目的**: ページレイアウトの構造化

```typescript
// components/layouts/main-layout.tsx
import { ReactNode } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {showSidebar && (
          <aside className="hidden lg:block w-64 border-r border-border">
            <Sidebar />
          </aside>
        )}
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
```

## 3. 状態管理設計

### 3.1. React Query (サーバー状態)
```typescript
// hooks/use-matches.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService } from '@/lib/services/match-service';

export function useMatches(filters?: MatchFilters) {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: () => matchService.getMatches(filters),
    staleTime: 5 * 60 * 1000, // 5分
    refetchInterval: 30 * 1000, // 30秒ごと
  });
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => matchService.getMatch(matchId),
    enabled: !!matchId,
  });
}

export function useSubmitPrediction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: predictionService.submitPrediction,
    onSuccess: (data) => {
      // キャッシュの更新
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.setQueryData(['prediction', data.id], data);
    },
  });
}
```

### 3.2. Zustand (クライアント状態)
```typescript
// stores/ui-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  loading: {
    global: boolean;
    predictions: boolean;
  };
}

interface UIActions {
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (key: keyof UIState['loading'], value: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set, get) => ({
      // State
      sidebarOpen: false,
      theme: 'dark',
      notifications: [],
      loading: {
        global: false,
        predictions: false,
      },
      
      // Actions
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          { ...notification, id: crypto.randomUUID() }
        ]
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      setLoading: (key, value) => set((state) => ({
        loading: { ...state.loading, [key]: value }
      })),
    }),
    { name: 'ui-store' }
  )
);
```

## 4. カスタムフック設計

### 4.1. ビジネスロジックフック
```typescript
// hooks/use-prediction.ts
import { useState, useCallback } from 'react';
import { useSubmitPrediction } from './use-matches';
import { useUIStore } from '@/stores/ui-store';

export function usePrediction(matchId: string) {
  const [draft, setDraft] = useState<PredictionDraft | null>(null);
  const submitMutation = useSubmitPrediction();
  const { addNotification, setLoading } = useUIStore();

  const saveDraft = useCallback((data: PredictionDraft) => {
    setDraft(data);
    localStorage.setItem(`prediction-draft-${matchId}`, JSON.stringify(data));
  }, [matchId]);

  const loadDraft = useCallback(() => {
    const saved = localStorage.getItem(`prediction-draft-${matchId}`);
    if (saved) {
      const draft = JSON.parse(saved);
      setDraft(draft);
      return draft;
    }
    return null;
  }, [matchId]);

  const submitPrediction = useCallback(async (data: PredictionFormData) => {
    setLoading('predictions', true);
    
    try {
      await submitMutation.mutateAsync({
        matchId,
        ...data,
      });
      
      // 下書きを削除
      localStorage.removeItem(`prediction-draft-${matchId}`);
      setDraft(null);
      
      addNotification({
        type: 'success',
        title: '予想を提出しました',
        message: '試合結果をお楽しみに！',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '予想の提出に失敗しました',
        message: 'しばらく後にもう一度お試しください。',
      });
      throw error;
    } finally {
      setLoading('predictions', false);
    }
  }, [matchId, submitMutation, addNotification, setLoading]);

  return {
    draft,
    saveDraft,
    loadDraft,
    submitPrediction,
    isSubmitting: submitMutation.isPending,
  };
}
```

### 4.2. UIインタラクションフック
```typescript
// hooks/use-drag-and-drop.ts
import { useState, useCallback, useRef } from 'react';

interface DragState {
  isDragging: boolean;
  draggedItem: any | null;
  dragOffset: { x: number; y: number };
}

export function useDragAndDrop<T>() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOffset: { x: 0, y: 0 },
  });
  
  const dragRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((item: T, event: React.DragEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOffset: offset,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  const handleDrop = useCallback((
    event: React.DragEvent,
    onDrop: (item: T, position: { x: number; y: number }) => void
  ) => {
    event.preventDefault();
    
    if (dragState.draggedItem) {
      const rect = event.currentTarget.getBoundingClientRect();
      const position = {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      };
      
      onDrop(dragState.draggedItem, position);
    }
    
    handleDragEnd();
  }, [dragState.draggedItem, handleDragEnd]);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    dragRef,
  };
}
```

## 5. フォーム設計

### 5.1. React Hook Form + Zod
```typescript
// components/features/auth/login-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || isSubmitting}
      >
        {isLoading || isSubmitting ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  );
}
```

## 6. アニメーション設計

### 6.1. Framer Motion設定
```typescript
// lib/animations.ts
import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const slideInFromRight: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

### 6.2. アニメーションコンポーネント
```typescript
// components/ui/animated-card.tsx
import { motion } from 'framer-motion';
import { Card, CardProps } from './card';
import { fadeInUp } from '@/lib/animations';

interface AnimatedCardProps extends CardProps {
  delay?: number;
}

export function AnimatedCard({ 
  children, 
  delay = 0, 
  className,
  ...props 
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
    >
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}
```

## 7. レスポンシブデザイン

### 7.1. ブレークポイント戦略
```typescript
// lib/responsive.ts
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('sm');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};
```

### 7.2. レスポンシブコンポーネント
```typescript
// components/features/match/match-grid.tsx
import { useBreakpoint } from '@/lib/responsive';
import { MatchCard } from './match-card';

interface MatchGridProps {
  matches: Match[];
}

export function MatchGrid({ matches }: MatchGridProps) {
  const breakpoint = useBreakpoint();
  
  const getGridCols = () => {
    switch (breakpoint) {
      case '2xl': return 'grid-cols-4';
      case 'xl': return 'grid-cols-3';
      case 'lg': return 'grid-cols-2';
      default: return 'grid-cols-1';
    }
  };

  return (
    <div className={`grid gap-6 ${getGridCols()}`}>
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

## 8. パフォーマンス最適化

### 8.1. コンポーネント最適化
```typescript
// components/features/prediction/formation-pitch.tsx
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface FormationPitchProps {
  formation: string;
  players: FormationPlayer[];
  onPlayerMove: (playerId: string, x: number, y: number) => void;
}

export const FormationPitch = memo(function FormationPitch({
  formation,
  players,
  onPlayerMove,
}: FormationPitchProps) {
  const formationPositions = useMemo(() => {
    return getFormationPositions(formation);
  }, [formation]);

  const playerElements = useMemo(() => {
    return players.map((player) => (
      <motion.div
        key={player.id}
        className="absolute w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold cursor-pointer"
        style={{
          left: `${player.positionX}%`,
          top: `${player.positionY}%`,
          transform: 'translate(-50%, -50%)',
        }}
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const rect = info.point;
          // 位置計算とコールバック実行
          onPlayerMove(player.id, rect.x, rect.y);
        }}
        whileDrag={{ scale: 1.1, zIndex: 10 }}
      >
        {player.jerseyNumber}
      </motion.div>
    ));
  }, [players, onPlayerMove]);

  return (
    <div className="relative w-full aspect-[3/2] bg-green-600 rounded-lg overflow-hidden">
      {/* ピッチの描画 */}
      <svg className="absolute inset-0 w-full h-full">
        {/* フィールドライン */}
      </svg>
      
      {/* 選手の配置 */}
      {playerElements}
    </div>
  );
});
```

### 8.2. 遅延読み込み
```typescript
// components/features/prediction/prediction-form-lazy.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const PredictionForm = lazy(() => import('./prediction-form'));

export function PredictionFormLazy(props: any) {
  return (
    <Suspense fallback={<PredictionFormSkeleton />}>
      <PredictionForm {...props} />
    </Suspense>
  );
}

function PredictionFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="aspect-[3/2] w-full" />
        <div className="space-y-4">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 9. エラーハンドリング

### 9.1. エラーバウンダリ
```typescript
// components/error-boundary.tsx
import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">エラーが発生しました</h2>
            <p className="text-muted-foreground">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            ページを再読み込み
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

この設計により、PROVEXIは保守性が高く、パフォーマンスに優れた、ユーザーフレンドリーなフロントエンドアプリケーションを実現します。