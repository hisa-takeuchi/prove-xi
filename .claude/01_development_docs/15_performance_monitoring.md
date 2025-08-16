# 15. パフォーマンス監視設計

## 15.1 監視戦略概要

### 監視の目的
1. **ユーザー体験の定量化**: Core Web Vitals を継続的に測定
2. **問題の早期発見**: パフォーマンス劣化の兆候を迅速に検知
3. **改善効果の測定**: 最適化施策の効果を数値で評価
4. **ビジネス影響の把握**: パフォーマンスと収益の相関関係を分析

### 監視対象
- **フロントエンド**: ページロード時間、ユーザーインタラクション
- **バックエンド**: API レスポンス時間、データベースクエリ性能
- **インフラ**: サーバーリソース、ネットワーク状況
- **ビジネスメトリクス**: コンバージョン率、離脱率

## 15.2 Real User Monitoring (RUM)

### Web Vitals の継続監視
```typescript
// lib/performance-monitoring.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface WebVitalMetric {
  name: string
  value: number
  id: string
  delta: number
  navigationType: string
  rating: 'good' | 'needs-improvement' | 'poor'
}

export class PerformanceMonitor {
  private analytics: Analytics
  
  constructor() {
    this.analytics = new Analytics()
    this.initWebVitals()
  }
  
  private initWebVitals() {
    getCLS(this.handleMetric)
    getFID(this.handleMetric)
    getFCP(this.handleMetric)
    getLCP(this.handleMetric)
    getTTFB(this.handleMetric)
  }
  
  private handleMetric = (metric: WebVitalMetric) => {
    // Google Analytics 4 へ送信
    gtag('event', metric.name, {
      custom_parameter_value: metric.value,
      custom_parameter_delta: metric.delta,
      custom_parameter_id: metric.id,
      custom_parameter_rating: metric.rating
    })
    
    // カスタム分析基盤への送信
    this.analytics.track('web_vital', {
      metric_name: metric.name,
      value: metric.value,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      connection_type: this.getConnectionType(),
      timestamp: Date.now()
    })
    
    // 基準値を超えた場合のアラート
    this.checkThresholds(metric)
  }
  
  private checkThresholds(metric: WebVitalMetric) {
    const thresholds = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      FCP: 1800,
      TTFB: 800
    }
    
    if (metric.value > thresholds[metric.name as keyof typeof thresholds]) {
      this.sendAlert(metric)
    }
  }
}
```

### ページ固有のパフォーマンス計測
```typescript
// hooks/usePagePerformance.ts
export const usePagePerformance = (pageName: string) => {
  useEffect(() => {
    const startTime = performance.now()
    
    // ページロード完了時の計測
    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      
      analytics.track('page_performance', {
        page: pageName,
        load_time: loadTime,
        dom_content_loaded: document.readyState,
        resource_count: performance.getEntriesByType('resource').length
      })
    }
    
    // ユーザーの最初のインタラクション計測
    const handleFirstInput = (event: Event) => {
      const interactionTime = performance.now() - startTime
      
      analytics.track('first_interaction', {
        page: pageName,
        time_to_interaction: interactionTime,
        interaction_type: event.type
      })
    }
    
    window.addEventListener('load', handleLoad)
    window.addEventListener('click', handleFirstInput, { once: true })
    window.addEventListener('keydown', handleFirstInput, { once: true })
    
    return () => {
      window.removeEventListener('load', handleLoad)
      window.removeEventListener('click', handleFirstInput)
      window.removeEventListener('keydown', handleFirstInput)
    }
  }, [pageName])
}
```

## 15.3 Synthetic Monitoring

### Lighthouse CI 統合
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build app
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/predictions',
        'http://localhost:3000/rankings',
        'http://localhost:3000/dashboard'
      ]
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}
```

### 定期パフォーマンステスト
```typescript
// scripts/performance-test.ts
import puppeteer from 'puppeteer'

interface PerformanceMetrics {
  lcp: number
  fid: number
  cls: number
  ttfb: number
}

export class SyntheticMonitoring {
  private browser: puppeteer.Browser | null = null
  
  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
  
  async measurePagePerformance(url: string): Promise<PerformanceMetrics> {
    if (!this.browser) await this.initialize()
    
    const page = await this.browser!.newPage()
    
    // ネットワーク状況をシミュレート
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms
    })
    
    await page.goto(url, { waitUntil: 'networkidle0' })
    
    // Web Vitals の取得
    const metrics = await page.evaluate(() => {
      return new Promise<PerformanceMetrics>((resolve) => {
        import('web-vitals').then(({ getCLS, getFID, getLCP, getTTFB }) => {
          const results: Partial<PerformanceMetrics> = {}
          let count = 0
          
          const checkComplete = () => {
            count++
            if (count === 4) {
              resolve(results as PerformanceMetrics)
            }
          }
          
          getCLS((metric) => {
            results.cls = metric.value
            checkComplete()
          })
          
          getFID((metric) => {
            results.fid = metric.value
            checkComplete()
          })
          
          getLCP((metric) => {
            results.lcp = metric.value
            checkComplete()
          })
          
          getTTFB((metric) => {
            results.ttfb = metric.value
            checkComplete()
          })
        })
      })
    })
    
    await page.close()
    return metrics
  }
  
  async runScheduledTests() {
    const urls = [
      'https://provexi.com',
      'https://provexi.com/predictions',
      'https://provexi.com/rankings'
    ]
    
    for (const url of urls) {
      const metrics = await this.measurePagePerformance(url)
      
      // 結果をモニタリングシステムに送信
      await this.sendMetrics(url, metrics)
    }
  }
  
  private async sendMetrics(url: string, metrics: PerformanceMetrics) {
    await fetch('/api/monitoring/synthetic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        metrics,
        timestamp: Date.now(),
        test_type: 'synthetic'
      })
    })
  }
}
```

## 15.4 Application Performance Monitoring (APM)

### API レスポンス時間監視
```typescript
// middleware/performance-middleware.ts
export function createPerformanceMiddleware() {
  return async (req: NextRequest) => {
    const start = Date.now()
    const startMemory = process.memoryUsage()
    
    const response = await NextResponse.next()
    
    const duration = Date.now() - start
    const endMemory = process.memoryUsage()
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed
    
    // メトリクス収集
    const metrics = {
      method: req.method,
      url: req.url,
      status: response.status,
      duration,
      memory_delta: memoryDelta,
      timestamp: Date.now()
    }
    
    // 非同期でメトリクス送信
    setImmediate(() => {
      sendAPMMetrics(metrics)
    })
    
    // レスポンスヘッダーに追加
    response.headers.set('X-Response-Time', `${duration}ms`)
    response.headers.set('X-Memory-Delta', `${memoryDelta}`)
    
    return response
  }
}

async function sendAPMMetrics(metrics: any) {
  try {
    await fetch(process.env.APM_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    })
  } catch (error) {
    console.error('Failed to send APM metrics:', error)
  }
}
```

### データベースパフォーマンス監視
```typescript
// lib/database-monitoring.ts
import { createClient } from '@supabase/supabase-js'

export class DatabaseMonitor {
  private supabase: any
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  async monitorQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - start
      
      // 成功時のメトリクス
      this.sendQueryMetrics({
        operation,
        duration,
        status: 'success',
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      // エラー時のメトリクス
      this.sendQueryMetrics({
        operation,
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      })
      
      throw error
    }
  }
  
  private async sendQueryMetrics(metrics: any) {
    // ローカルログ
    console.log('DB Query Metrics:', metrics)
    
    // 外部監視サービスへの送信
    try {
      await fetch('/api/monitoring/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      })
    } catch (error) {
      console.error('Failed to send DB metrics:', error)
    }
  }
}

// 使用例
const dbMonitor = new DatabaseMonitor()

export const getMatchesWithMonitoring = async (leagueId: string) => {
  return dbMonitor.monitorQuery('get_matches', async () => {
    return supabase
      .from('matches')
      .select('*')
      .eq('league_id', leagueId)
  })
}
```

## 15.5 アラート設定

### 閾値ベースアラート
```typescript
// lib/alert-system.ts
interface AlertThreshold {
  metric: string
  operator: 'gt' | 'lt' | 'eq'
  value: number
  severity: 'info' | 'warning' | 'critical'
  duration: number // 継続時間（秒）
}

export class AlertSystem {
  private thresholds: AlertThreshold[] = [
    {
      metric: 'lcp',
      operator: 'gt',
      value: 4000, // 4秒
      severity: 'critical',
      duration: 300 // 5分間継続
    },
    {
      metric: 'api_response_time',
      operator: 'gt',
      value: 1000, // 1秒
      severity: 'warning',
      duration: 120 // 2分間継続
    },
    {
      metric: 'error_rate',
      operator: 'gt',
      value: 0.05, // 5%
      severity: 'critical',
      duration: 60 // 1分間継続
    }
  ]
  
  async checkThresholds(metrics: any[]) {
    for (const threshold of this.thresholds) {
      const violations = this.findViolations(metrics, threshold)
      
      if (violations.length > 0) {
        await this.sendAlert(threshold, violations)
      }
    }
  }
  
  private findViolations(metrics: any[], threshold: AlertThreshold) {
    return metrics.filter(metric => {
      if (metric.name !== threshold.metric) return false
      
      switch (threshold.operator) {
        case 'gt': return metric.value > threshold.value
        case 'lt': return metric.value < threshold.value
        case 'eq': return metric.value === threshold.value
        default: return false
      }
    })
  }
  
  private async sendAlert(threshold: AlertThreshold, violations: any[]) {
    const alert = {
      metric: threshold.metric,
      severity: threshold.severity,
      message: `${threshold.metric} exceeded threshold of ${threshold.value}`,
      violations: violations.length,
      timestamp: Date.now()
    }
    
    // Slack 通知
    await this.sendSlackAlert(alert)
    
    // メール通知（critical の場合）
    if (threshold.severity === 'critical') {
      await this.sendEmailAlert(alert)
    }
  }
  
  private async sendSlackAlert(alert: any) {
    const webhook = process.env.SLACK_WEBHOOK_URL
    if (!webhook) return
    
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Performance Alert: ${alert.message}`,
        attachments: [{
          color: alert.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Violations', value: alert.violations, short: true }
          ]
        }]
      })
    })
  }
}
```

## 15.6 ダッシュボード設計

### メトリクス可視化
```typescript
// components/PerformanceDashboard.tsx
export const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [timeRange, setTimeRange] = useState('24h')
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch(`/api/monitoring/metrics?range=${timeRange}`)
      const data = await response.json()
      setMetrics(data)
    }
    
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // 30秒ごと更新
    
    return () => clearInterval(interval)
  }, [timeRange])
  
  return (
    <div className="performance-dashboard">
      <div className="metrics-grid">
        <MetricCard
          title="Largest Contentful Paint"
          value={metrics.lcp}
          threshold={2500}
          unit="ms"
        />
        <MetricCard
          title="First Input Delay"
          value={metrics.fid}
          threshold={100}
          unit="ms"
        />
        <MetricCard
          title="Cumulative Layout Shift"
          value={metrics.cls}
          threshold={0.1}
          unit=""
        />
        <MetricCard
          title="API Response Time"
          value={metrics.apiResponseTime}
          threshold={500}
          unit="ms"
        />
      </div>
      
      <div className="charts-section">
        <PerformanceChart data={metrics} />
        <ErrorRateChart data={metrics} />
      </div>
    </div>
  )
}
```

## 15.7 継続的改善プロセス

### 週次パフォーマンスレポート
```typescript
// scripts/weekly-report.ts
export class WeeklyPerformanceReport {
  async generateReport() {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const metrics = await this.fetchMetrics(startDate, endDate)
    const report = await this.analyzeMetrics(metrics)
    
    await this.sendReport(report)
  }
  
  private async analyzeMetrics(metrics: any[]) {
    return {
      summary: {
        avgLCP: this.calculateAverage(metrics, 'lcp'),
        avgFID: this.calculateAverage(metrics, 'fid'),
        avgCLS: this.calculateAverage(metrics, 'cls'),
        errorRate: this.calculateErrorRate(metrics)
      },
      trends: {
        lcp: this.calculateTrend(metrics, 'lcp'),
        performance: this.getPerformanceGrade(metrics)
      },
      recommendations: this.generateRecommendations(metrics)
    }
  }
  
  private generateRecommendations(metrics: any[]) {
    const recommendations = []
    
    if (this.calculateAverage(metrics, 'lcp') > 2500) {
      recommendations.push('LCP が目標値を超過しています。画像最適化を検討してください。')
    }
    
    if (this.calculateErrorRate(metrics) > 0.01) {
      recommendations.push('エラー率が高いです。API の安定性を確認してください。')
    }
    
    return recommendations
  }
}
```