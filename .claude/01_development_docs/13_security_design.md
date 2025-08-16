# PROVEXI セキュリティ設計書

## 1. 概要

### 1.1. セキュリティ設計の目的
- **データ保護**: ユーザーの個人情報と予想データの安全な管理
- **認証・認可**: 適切なアクセス制御による不正利用の防止
- **脆弱性対策**: 一般的なWebアプリケーション脆弱性への対策
- **プライバシー保護**: GDPR等の規制への準拠

### 1.2. セキュリティ原則
- **最小権限の原則**: 必要最小限の権限のみを付与
- **多層防御**: 複数のセキュリティ層による保護
- **ゼロトラスト**: すべてのアクセスを検証
- **セキュリティバイデザイン**: 設計段階からのセキュリティ考慮

## 2. 認証・認可設計

### 2.1. Supabase Auth活用
```typescript
// lib/auth/auth-service.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authService = {
  // 安全な登録処理
  async signUp(email: string, password: string, metadata: any) {
    // パスワード強度チェック
    if (!isStrongPassword(password)) {
      throw new Error('パスワードが弱すぎます');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: metadata.nickname,
          favorite_club_id: metadata.favoriteClubId,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // セキュアなログイン
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // ブルートフォース攻撃対策
      await this.logFailedAttempt(email);
      throw error;
    }

    return data;
  },

  // セッション検証
  async validateSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('Invalid session');
    }

    // セッションの有効期限チェック
    if (session.expires_at && session.expires_at < Date.now() / 1000) {
      throw new Error('Session expired');
    }

    return session;
  },

  // 安全なログアウト
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

// パスワード強度チェック
function isStrongPassword(password: string): boolean {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
}
```

### 2.2. Row Level Security (RLS)
```sql
-- users テーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- predictions テーブルのRLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- 予想は作成者のみ編集可能
CREATE POLICY "Users can manage own predictions" ON predictions
  FOR ALL USING (auth.uid() = user_id);

-- 試合開始後は他ユーザーの予想も閲覧可能
CREATE POLICY "View predictions after match start" ON predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = predictions.match_id 
      AND matches.kickoff_time < NOW()
    )
  );

-- 管理者のみアクセス可能なテーブル
CREATE POLICY "Admin only access" ON admin_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### 2.3. JWT トークン管理
```typescript
// lib/auth/token-manager.ts
import jwt from 'jsonwebtoken';

export const tokenManager = {
  // トークン検証
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  // トークンのブラックリスト管理
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const { data } = await supabase
      .from('token_blacklist')
      .select('token')
      .eq('token', token)
      .single();
    
    return !!data;
  },

  // トークンをブラックリストに追加
  async blacklistToken(token: string): Promise<void> {
    await supabase
      .from('token_blacklist')
      .insert({ token, created_at: new Date() });
  },
};
```

## 3. 入力値検証・サニタイゼーション

### 3.1. Zod スキーマ検証
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

// ユーザー登録スキーマ
export const registerSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスが長すぎます'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .max(128, 'パスワードが長すぎます')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'パスワードは大文字、小文字、数字、特殊文字を含む必要があります'
    ),
  nickname: z
    .string()
    .min(1, 'ニックネームは必須です')
    .max(50, 'ニックネームが長すぎます')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ニックネームに無効な文字が含まれています'),
});

// 予想提出スキーマ
export const predictionSchema = z.object({
  matchId: z.string().uuid('無効な試合IDです'),
  formation: z.object({
    system: z.enum(['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2']),
    players: z
      .array(
        z.object({
          playerId: z.string().uuid('無効な選手IDです'),
          position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
          positionX: z.number().min(0).max(100),
          positionY: z.number().min(0).max(100),
        })
      )
      .length(11, 'フォーメーションには11人の選手が必要です'),
  }),
});

// API入力値検証ミドルウェア
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}
```

### 3.2. SQLインジェクション対策
```typescript
// lib/database/safe-queries.ts
import { supabase } from '@/lib/supabase/client';

export const safeQueries = {
  // パラメータ化クエリの使用
  async getUserPredictions(userId: string, limit: number = 20) {
    // 直接的なSQL文字列結合を避ける
    const { data, error } = await supabase
      .from('predictions')
      .select(`
        id,
        match_id,
        formation_system,
        points_earned,
        submitted_at,
        matches (
          home_team:teams!matches_home_team_id_fkey (name),
          away_team:teams!matches_away_team_id_fkey (name),
          kickoff_time
        )
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // 動的クエリの安全な構築
  async searchMatches(filters: {
    leagueId?: string;
    teamId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = supabase
      .from('matches')
      .select(`
        id,
        kickoff_time,
        status,
        home_team:teams!matches_home_team_id_fkey (id, name, logo_url),
        away_team:teams!matches_away_team_id_fkey (id, name, logo_url),
        league:leagues (id, name)
      `);

    // 条件の安全な追加
    if (filters.leagueId) {
      query = query.eq('league_id', filters.leagueId);
    }
    
    if (filters.teamId) {
      query = query.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`);
    }
    
    if (filters.dateFrom) {
      query = query.gte('kickoff_time', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('kickoff_time', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
```

## 4. XSS対策

### 4.1. Content Security Policy
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://api-football-v1.p.rapidapi.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

### 4.2. 出力エスケープ
```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitize = {
  // HTMLサニタイゼーション
  html(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  },

  // テキストエスケープ
  text(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // URLサニタイゼーション
  url(input: string): string {
    try {
      const url = new URL(input);
      // 許可されたプロトコルのみ
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  },
};

// React コンポーネントでの安全な表示
export function SafeText({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: sanitize.html(children) }} />;
}
```

## 5. CSRF対策

### 5.1. CSRFトークン実装
```typescript
// lib/security/csrf.ts
import { randomBytes } from 'crypto';

export const csrfProtection = {
  // CSRFトークン生成
  generateToken(): string {
    return randomBytes(32).toString('hex');
  },

  // トークン検証
  verifyToken(sessionToken: string, requestToken: string): boolean {
    if (!sessionToken || !requestToken) {
      return false;
    }
    
    // タイミング攻撃対策
    return this.safeCompare(sessionToken, requestToken);
  },

  // 安全な文字列比較
  safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  },
};

// API ルートでのCSRF保護
export function withCSRFProtection(handler: any) {
  return async (req: any, res: any) => {
    if (req.method !== 'GET') {
      const sessionToken = req.session?.csrfToken;
      const requestToken = req.headers['x-csrf-token'] || req.body._csrf;
      
      if (!csrfProtection.verifyToken(sessionToken, requestToken)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token',
          },
        });
      }
    }
    
    return handler(req, res);
  };
}
```

## 6. レート制限

### 6.1. API レート制限
```typescript
// lib/security/rate-limit.ts
import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: any) => string;
}

export function createRateLimit(options: RateLimitOptions) {
  const cache = new LRUCache<string, number[]>({
    max: 1000,
    ttl: options.windowMs,
  });

  return (req: any, res: any, next: any) => {
    const key = options.keyGenerator 
      ? options.keyGenerator(req)
      : req.ip || 'anonymous';
    
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // 現在のリクエスト履歴を取得
    let requests = cache.get(key) || [];
    
    // 古いリクエストを除外
    requests = requests.filter(time => time > windowStart);
    
    if (requests.length >= options.max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
        },
      });
    }
    
    // 新しいリクエストを記録
    requests.push(now);
    cache.set(key, requests);
    
    // レスポンスヘッダーを設定
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', options.max - requests.length);
    res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + options.windowMs) / 1000));
    
    next();
  };
}

// 使用例
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回の認証試行
  keyGenerator: (req) => `auth:${req.ip}:${req.body.email}`,
});

export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分
  max: 100, // 最大100リクエスト
});
```

### 6.2. ブルートフォース攻撃対策
```typescript
// lib/security/brute-force-protection.ts
export const bruteForceProtection = {
  // 失敗試行の記録
  async recordFailedAttempt(identifier: string) {
    const key = `failed_attempts:${identifier}`;
    const attempts = await this.getFailedAttempts(identifier);
    
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'failed_login',
        identifier,
        attempts: attempts + 1,
        created_at: new Date(),
      });
  },

  // 失敗試行数の取得
  async getFailedAttempts(identifier: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('security_logs')
      .select('attempts')
      .eq('identifier', identifier)
      .eq('event_type', 'failed_login')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    return data?.[0]?.attempts || 0;
  },

  // アカウントロック状態の確認
  async isAccountLocked(identifier: string): Promise<boolean> {
    const attempts = await this.getFailedAttempts(identifier);
    return attempts >= 5; // 5回失敗でロック
  },

  // ロック解除
  async unlockAccount(identifier: string) {
    await supabase
      .from('security_logs')
      .delete()
      .eq('identifier', identifier)
      .eq('event_type', 'failed_login');
  },
};
```

## 7. データ暗号化

### 7.1. 機密データの暗号化
```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export const encryption = {
  // データ暗号化
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('PROVEXI', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  },

  // データ復号化
  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('PROVEXI', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },

  // ハッシュ化（一方向）
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + process.env.HASH_SALT!)
      .digest('hex');
  },
};
```

## 8. セキュリティ監視・ログ

### 8.1. セキュリティイベントログ
```typescript
// lib/security/security-logger.ts
export const securityLogger = {
  // セキュリティイベントの記録
  async logSecurityEvent(event: {
    type: 'login' | 'logout' | 'failed_login' | 'suspicious_activity' | 'data_access';
    userId?: string;
    ip: string;
    userAgent: string;
    details?: any;
  }) {
    await supabase
      .from('security_logs')
      .insert({
        event_type: event.type,
        user_id: event.userId,
        ip_address: event.ip,
        user_agent: event.userAgent,
        details: event.details,
        created_at: new Date(),
      });
  },

  // 不審なアクティビティの検出
  async detectSuspiciousActivity(userId: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // 短時間での大量アクセス
    const { data: recentActivity } = await supabase
      .from('security_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString());
    
    if (recentActivity && recentActivity.length > 100) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        userId,
        ip: 'system',
        userAgent: 'system',
        details: { reason: 'high_frequency_access', count: recentActivity.length },
      });
      return true;
    }
    
    return false;
  },

  // セキュリティアラートの送信
  async sendSecurityAlert(alert: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details: any;
  }) {
    // Slack通知やメール送信の実装
    console.error('SECURITY ALERT:', alert);
    
    // 重要度が高い場合は即座に通知
    if (alert.severity === 'critical') {
      // 緊急通知の実装
    }
  },
};
```

### 8.2. セキュリティダッシュボード
```typescript
// lib/security/security-dashboard.ts
export const securityDashboard = {
  // セキュリティメトリクスの取得
  async getSecurityMetrics(timeRange: '24h' | '7d' | '30d' = '24h') {
    const startTime = this.getStartTime(timeRange);
    
    const [
      failedLogins,
      suspiciousActivities,
      blockedRequests,
      activeUsers,
    ] = await Promise.all([
      this.getFailedLoginCount(startTime),
      this.getSuspiciousActivityCount(startTime),
      this.getBlockedRequestCount(startTime),
      this.getActiveUserCount(startTime),
    ]);
    
    return {
      failedLogins,
      suspiciousActivities,
      blockedRequests,
      activeUsers,
      securityScore: this.calculateSecurityScore({
        failedLogins,
        suspiciousActivities,
        blockedRequests,
      }),
    };
  },

  // セキュリティスコアの計算
  calculateSecurityScore(metrics: any): number {
    let score = 100;
    
    // 失敗ログイン数に基づく減点
    score -= Math.min(metrics.failedLogins * 2, 30);
    
    // 不審なアクティビティに基づく減点
    score -= Math.min(metrics.suspiciousActivities * 5, 40);
    
    // ブロックされたリクエストに基づく減点
    score -= Math.min(metrics.blockedRequests * 1, 20);
    
    return Math.max(score, 0);
  },
};
```

## 9. プライバシー保護

### 9.1. GDPR準拠
```typescript
// lib/privacy/gdpr-compliance.ts
export const gdprCompliance = {
  // データ削除権（忘れられる権利）
  async deleteUserData(userId: string) {
    const tables = [
      'predictions',
      'user_rankings',
      'security_logs',
      'users', // 最後に削除
    ];
    
    for (const table of tables) {
      await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);
    }
    
    // 削除ログの記録
    await this.logDataDeletion(userId);
  },

  // データポータビリティ権
  async exportUserData(userId: string) {
    const [user, predictions, rankings] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('predictions').select('*').eq('user_id', userId),
      supabase.from('user_rankings').select('*').eq('user_id', userId),
    ]);
    
    return {
      user: user.data,
      predictions: predictions.data,
      rankings: rankings.data,
      exportedAt: new Date().toISOString(),
    };
  },

  // 同意管理
  async updateConsent(userId: string, consents: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  }) {
    await supabase
      .from('user_consents')
      .upsert({
        user_id: userId,
        analytics_consent: consents.analytics,
        marketing_consent: consents.marketing,
        functional_consent: consents.functional,
        updated_at: new Date(),
      });
  },
};
```

## 10. セキュリティテスト

### 10.1. 自動セキュリティテスト
```typescript
// __tests__/security/security.test.ts
import { describe, it, expect } from 'vitest';
import { authService } from '@/lib/auth/auth-service';
import { sanitize } from '@/lib/utils/sanitize';

describe('セキュリティテスト', () => {
  describe('認証', () => {
    it('弱いパスワードを拒否する', async () => {
      await expect(
        authService.signUp('test@example.com', '123456', {})
      ).rejects.toThrow('パスワードが弱すぎます');
    });

    it('無効なメールアドレスを拒否する', async () => {
      await expect(
        authService.signUp('invalid-email', 'StrongPass123!', {})
      ).rejects.toThrow();
    });
  });

  describe('入力値サニタイゼーション', () => {
    it('XSSペイロードを無害化する', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = sanitize.html(maliciousInput);
      expect(sanitized).not.toContain('<script>');
    });

    it('SQLインジェクションを防ぐ', () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const sanitized = sanitize.text(maliciousInput);
      expect(sanitized).not.toContain("DROP TABLE");
    });
  });
});
```

この包括的なセキュリティ設計により、PROVEXIは堅牢なセキュリティ体制を構築し、ユーザーデータと システムを様々な脅威から保護します。