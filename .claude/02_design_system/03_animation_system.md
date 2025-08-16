# 3. アニメーションシステム設計

## 3.1 アニメーション戦略

### 基本方針
- **意味のあるアニメーション**: ユーザーの理解を助ける動きのみ実装
- **パフォーマンス重視**: 60fps での滑らかな動作を保証
- **アクセシビリティ配慮**: `prefers-reduced-motion` 対応
- **一貫性**: 統一されたタイミングとイージング関数

### アニメーション分類
1. **マイクロインタラクション**: ボタンホバー、フォーカス状態
2. **フィードバック**: 成功・エラー・ローディング状態
3. **ナビゲーション**: ページ遷移、モーダル表示
4. **データ可視化**: ランキング変動、ポイント増減
5. **ドラッグ&ドロップ**: フォーメーション編集の中核体験

## 3.2 アニメーション定数

### タイミング定義
```typescript
// styles/animations.ts
export const ANIMATION_DURATION = {
  fast: 150,      // クイックフィードバック
  normal: 300,    // 標準的なトランジション
  slow: 500,      // 大きな変化
  page: 800       // ページ遷移
} as const

export const ANIMATION_DELAY = {
  none: 0,
  short: 100,
  medium: 200,
  long: 300
} as const
```

### イージング関数
```typescript
export const EASING = {
  // 標準的なイージング
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  
  // カスタムイージング（ブランドの個性）
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // 弾むような動き
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',              // きびきびした動き
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',     // 滑らかな動き
} as const
```

## 3.3 Framer Motion 設定

### 基本設定
```typescript
// lib/motion.ts
import { Variants } from 'framer-motion'

// ページトランジション
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
      ease: EASING.easeOut
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: ANIMATION_DURATION.fast / 1000,
      ease: EASING.easeIn
    }
  }
}

// モーダル
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
      ease: EASING.bouncy
    }
  }
}

// リストアイテムのstagger animation
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
      ease: EASING.easeOut
    }
  }
}
```

### ユーティリティ関数
```typescript
// アクセシビリティを考慮したMotion設定
export const getMotionProps = (reducedMotion = false) => ({
  initial: reducedMotion ? false : 'initial',
  animate: reducedMotion ? false : 'animate',
  exit: reducedMotion ? false : 'exit',
  transition: reducedMotion ? { duration: 0 } : undefined
})

// カスタムフック
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return reducedMotion
}
```

## 3.4 コンポーネント別アニメーション

### Button アニメーション
```typescript
// components/ui/button.tsx
const buttonMotionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 25
  }
}

export const Button = ({ children, variant, ...props }: ButtonProps) => {
  const reducedMotion = useReducedMotion()
  
  return (
    <motion.button
      className={cn(buttonVariants({ variant }))}
      {...(reducedMotion ? {} : buttonMotionProps)}
      {...props}
    >
      {children}
    </motion.button>
  )
}
```

### Card アニメーション
```typescript
// components/ui/card.tsx
const cardVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: ANIMATION_DURATION.fast / 1000,
      ease: EASING.easeOut
    }
  }
}

export const Card = ({ children, hover = false, ...props }: CardProps) => {
  const reducedMotion = useReducedMotion()
  
  return (
    <motion.div
      className="card-base"
      variants={hover && !reducedMotion ? cardVariants : undefined}
      initial="rest"
      whileHover="hover"
      {...props}
    >
      {children}
    </motion.div>
  )
}
```

### FormationPitch アニメーション
```typescript
// components/features/prediction/FormationPitch.tsx
const playerVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
  },
  dragging: {
    scale: 1.1,
    rotate: 5,
    zIndex: 1000,
    transition: {
      duration: ANIMATION_DURATION.fast / 1000
    }
  },
  dropped: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  }
}

const positionSlotVariants: Variants = {
  empty: {
    scale: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dragOver: {
    scale: 1.1,
    borderColor: 'rgba(34, 197, 94, 0.8)',
    transition: {
      duration: ANIMATION_DURATION.fast / 1000
    }
  },
  filled: {
    scale: 1,
    borderColor: 'rgba(34, 197, 94, 1)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  }
}

const PlayerSlot = ({ player, position, onDrop }: PlayerSlotProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  
  return (
    <motion.div
      className="absolute rounded-full border-2 border-dashed"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      variants={positionSlotVariants}
      animate={player ? 'filled' : isDragOver ? 'dragOver' : 'empty'}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        onDrop(position)
      }}
    >
      {player && (
        <motion.div
          variants={playerVariants}
          initial="idle"
          whileDrag="dragging"
          className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
        >
          <img
            src={player.avatar}
            alt={player.name}
            className="w-12 h-12 rounded-full"
          />
        </motion.div>
      )}
    </motion.div>
  )
}
```

## 3.5 データビジュアライゼーション

### ランキング変動アニメーション
```typescript
// components/features/ranking/RankingTable.tsx
const rankingRowVariants: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: (index: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: index * 0.05,
      duration: ANIMATION_DURATION.normal / 1000,
      ease: EASING.easeOut
    }
  }),
  exit: { x: 100, opacity: 0 }
}

const RankingRow = ({ ranking, index }: RankingRowProps) => {
  return (
    <motion.tr
      variants={rankingRowVariants}
      custom={index}
      layout
      layoutId={`rank-${ranking.userId}`}
    >
      <td>
        <motion.div
          key={ranking.rank}
          initial={{ scale: 1.2, color: '#22c55e' }}
          animate={{ scale: 1, color: 'inherit' }}
          transition={{ duration: 0.5 }}
        >
          {ranking.rank}
        </motion.div>
      </td>
      {/* 他のセル */}
    </motion.tr>
  )
}
```

### ポイント増減アニメーション
```typescript
// components/features/score/PointsDisplay.tsx
const pointsVariants: Variants = {
  initial: { scale: 1 },
  increase: {
    scale: [1, 1.2, 1],
    color: ['#000', '#22c55e', '#000'],
    transition: {
      duration: 0.6,
      times: [0, 0.5, 1]
    }
  },
  decrease: {
    scale: [1, 0.8, 1],
    color: ['#000', '#ef4444', '#000'],
    transition: {
      duration: 0.6,
      times: [0, 0.5, 1]
    }
  }
}

export const PointsDisplay = ({ points, previousPoints }: PointsDisplayProps) => {
  const [animationState, setAnimationState] = useState<'initial' | 'increase' | 'decrease'>('initial')
  
  useEffect(() => {
    if (previousPoints !== undefined) {
      if (points > previousPoints) {
        setAnimationState('increase')
      } else if (points < previousPoints) {
        setAnimationState('decrease')
      }
      
      const timer = setTimeout(() => setAnimationState('initial'), 600)
      return () => clearTimeout(timer)
    }
  }, [points, previousPoints])
  
  return (
    <motion.div
      variants={pointsVariants}
      animate={animationState}
      className="text-2xl font-bold"
    >
      {points.toLocaleString()}
      {animationState !== 'initial' && (
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            'ml-2 text-sm',
            animationState === 'increase' ? 'text-green-500' : 'text-red-500'
          )}
        >
          {animationState === 'increase' ? '+' : ''}{points - (previousPoints || 0)}
        </motion.span>
      )}
    </motion.div>
  )
}
```

## 3.6 ローディング・状態アニメーション

### スケルトンローダー
```typescript
// components/ui/skeleton.tsx
const skeletonVariants: Variants = {
  loading: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <motion.div
      variants={skeletonVariants}
      animate="loading"
      className={cn('bg-muted rounded-md', className)}
      {...props}
    />
  )
}
```

### ローディングスピナー
```typescript
// components/ui/loading-spinner.tsx
const spinnerVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

export const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps) => {
  return (
    <motion.div
      variants={spinnerVariants}
      animate="spin"
      className={cn('border-2 border-gray-200 border-t-blue-600 rounded-full', {
        'w-4 h-4': size === 'sm',
        'w-8 h-8': size === 'md',
        'w-12 h-12': size === 'lg'
      })}
    />
  )
}
```

## 3.7 ページ遷移アニメーション

### Next.js App Router対応
```typescript
// components/providers/motion-provider.tsx
const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.page / 1000,
      ease: EASING.easeOut
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: ANIMATION_DURATION.fast / 1000,
      ease: EASING.easeIn
    }
  }
}

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageTransitionVariants}
        {...getMotionProps(reducedMotion)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

## 3.8 パフォーマンス最適化

### GPU加速の活用
```css
/* globals.css */
.will-change-transform {
  will-change: transform;
}

.will-change-opacity {
  will-change: opacity;
}

/* 3D変換でGPU加速 */
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}
```

### アニメーション最適化
```typescript
// hooks/useOptimizedAnimation.ts
export const useOptimizedAnimation = () => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return { ref, isVisible }
}

// 使用例
const AnimatedComponent = () => {
  const { ref, isVisible } = useOptimizedAnimation()
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
    >
      {/* コンテンツ */}
    </motion.div>
  )
}
```

## 3.9 テスト戦略

### アニメーションテスト
```typescript
// __tests__/animations/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

// モーションコンポーネントのモック
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  }
}))

describe('Button animations', () => {
  it('applies hover state correctly', async () => {
    render(<Button>Test Button</Button>)
    const button = screen.getByRole('button')
    
    fireEvent.mouseEnter(button)
    // アニメーション状態のテスト
    expect(button).toHaveStyle('transform: scale(1.02)')
  })
})