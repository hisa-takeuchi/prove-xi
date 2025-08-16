# PROVEXI エラーハンドリング設計書

## 1. 概要

### 1.1. エラーハンドリングの目的
- **ユーザー体験の向上**: 分かりやすいエラーメッセージでユーザーの混乱を防ぐ
- **システムの安定性**: 予期しないエラーでもアプリケーションが停止しない
- **デバッグ効率の向上**: 詳細なログでエラーの原因を迅速に特定
- **セキュリティの確保**: 機密情報を含むエラー情報の適切な処理

### 1.2. エラーハンドリング原則
- **ユーザーフレンドリー**: 技術的詳細を隠し、分かりやすい言葉で説明
- **一貫性**: 同じタイプのエラーは常に同じ方法で処理
- **ログの充実**: 開発者が問題を解決するための十分な情報を記録
- **グレースフルデグラデーション**: エラー時でも可能な限り機能を提供

## 2. エラー分類体系

### 2.1. エラーカテゴリ

#### 認証・認可エラー (AUTH)
```typescript
enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  TOKEN_INVALID = 'AUTH_003',
  USER_NOT_FOUND = 'AUTH_004',
  EMAIL_ALREADY_EXISTS = 'AUTH_005',
  INSUFFICIENT_PERMISSIONS = 'AUTH_006',
  ACCOUNT_SUSPENDED = 'AUTH_007',
}
```

#### 予想関連エラー (PRED)
```typescript
enum PredictionErrorCode {
  DEADLINE_PASSED = 'PRED_001',
  INVALID_FORMATION = 'PRED_002',
  PLAYER_NOT_IN_TEAM = 'PRED_003',
  PREDICTION_LIMIT_EXCEEDED = 'PRED_004',
  MATCH_NOT_FOUND = 'PRED_005',
  INVALID_PLAYER_COUNT = 'PRED_006',
  DUPLICATE_PLAYER = 'PRED_007',
}
```

#### バリデーションエラー (VAL)
```typescript
enum ValidationErrorCode {
  REQUIRED_FIELD_MISSING = 'VAL_001',
  INVALID_EMAIL_FORMAT = 'VAL_002',
  PASSWORD_TOO_WEAK = 'VAL_003',
  INVALID_DATE_FORMAT = 'VAL_004',
  VALUE_OUT_OF_RANGE = 'VAL_005',
  INVALID_FILE_TYPE = 'VAL_006',
  FILE_TOO_LARGE = 'VAL_007',
}
```

#### システムエラー (SYS)
```typescript
enum SystemErrorCode {
  INTERNAL_SERVER_ERROR = 'SYS_001',
  DATABASE_CONNECTION_ERROR = 'SYS_002',
  EXTERNAL_API_ERROR = 'SYS_003',
  RATE_LIMIT_EXCEEDED = 'SYS_004',
  SERVICE_UNAVAILABLE = 'SYS_005',
  TIMEOUT_ERROR = 'SYS_006',
}
```

#### ビジネスロジックエラー (BIZ)
```typescript
enum BusinessErrorCode {
  INSUFFICIENT_POINTS = 'BIZ_001',
  SUBSCRIPTION_REQUIRED = 'BIZ_002',
  FEATURE_NOT_AVAILABLE = 'BIZ_003',
  OPERATION_NOT_ALLOWED = 'BIZ_004',
  RESOURCE_CONFLICT = 'BIZ_005',
}
```

### 2.2. エラー重要度レベル

```typescript
enum ErrorSeverity {
  LOW = 'low',        // ユーザーの操作で回避可能
  MEDIUM = 'medium',  // 機能の一部が利用不可
  HIGH = 'high',      // 主要機能が利用不可
  CRITICAL = 'critical' // システム全体に影響
}
```

## 3. エラーオブジェクト設計

### 3.1. 基本エラークラス

```typescript
// lib/errors/base-error.ts
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly severity: ErrorSeverity;
  abstract readonly userMessage: string;
  
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    this.requestId = requestId;
    this.userId = userId;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      context: this.context,
      stack: this.stack,
    };
  }
}
```

### 3.2. 具体的エラークラス

#### 認証エラー
```typescript
// lib/errors/auth-errors.ts
export class InvalidCredentialsError extends BaseError {
  readonly code = AuthErrorCode.INVALID_CREDENTIALS;
  readonly severity = ErrorSeverity.LOW;
  readonly userMessage = 'メールアドレスまたはパスワードが正しくありません。';

  constructor(email: string, requestId?: string) {
    super(`Invalid credentials for email: ${email}`, { email }, requestId);
  }
}

export class TokenExpiredError extends BaseError {
  readonly code = AuthErrorCode.TOKEN_EXPIRED;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly userMessage = 'セッションが期限切れです。再度ログインしてください。';

  constructor(tokenType: string, userId?: string, requestId?: string) {
    super(`${tokenType} token expired`, { tokenType }, requestId, userId);
  }
}
```

#### 予想エラー
```typescript
// lib/errors/prediction-errors.ts
export class PredictionDeadlinePassedError extends BaseError {
  readonly code = PredictionErrorCode.DEADLINE_PASSED;
  readonly severity = ErrorSeverity.LOW;
  readonly userMessage = '予想の受付期限が過ぎています。';

  constructor(matchId: string, deadline: Date, userId?: string, requestId?: string) {
    super(`Prediction deadline passed for match ${matchId}`, 
          { matchId, deadline }, requestId, userId);
  }
}

export class InvalidFormationError extends BaseError {
  readonly code = PredictionErrorCode.INVALID_FORMATION;
  readonly severity = ErrorSeverity.LOW;
  readonly userMessage = 'フォーメーションが正しくありません。11人の選手を配置してください。';

  constructor(playerCount: number, userId?: string, requestId?: string) {
    super(`Invalid formation: ${playerCount} players`, 
          { playerCount }, requestId, userId);
  }
}
```

#### システムエラー
```typescript
// lib/errors/system-errors.ts
export class DatabaseConnectionError extends BaseError {
  readonly code = SystemErrorCode.DATABASE_CONNECTION_ERROR;
  readonly severity = ErrorSeverity.CRITICAL;
  readonly userMessage = 'システムに一時的な問題が発生しています。しばらく後にお試しください。';

  constructor(operation: string, requestId?: string) {
    super(`Database connection failed during ${operation}`, 
          { operation }, requestId);
  }
}

export class ExternalApiError extends BaseError {
  readonly code = SystemErrorCode.EXTERNAL_API_ERROR;
  readonly severity = ErrorSeverity.HIGH;
  readonly userMessage = '外部サービスとの通信に問題が発生しています。';

  constructor(service: string, statusCode: number, requestId?: string) {
    super(`External API error: ${service} returned ${statusCode}`, 
          { service, statusCode }, requestId);
  }
}
```

## 4. エラーハンドリング実装

### 4.1. API Routes エラーハンドリング

```typescript
// lib/api/error-handler.ts
export function handleApiError(error: unknown, request: Request): Response {
  const requestId = generateRequestId();
  
  // BaseErrorの場合
  if (error instanceof BaseError) {
    logError(error, request);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.userMessage,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        meta: {
          timestamp: error.timestamp.toISOString(),
          requestId,
        },
      },
      { status: getHttpStatusFromErrorCode(error.code) }
    );
  }
  
  // 予期しないエラーの場合
  const systemError = new InternalServerError('Unexpected error occurred', requestId);
  logError(systemError, request, error);
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code: systemError.code,
        message: systemError.userMessage,
      },
      meta: {
        timestamp: systemError.timestamp.toISOString(),
        requestId,
      },
    },
    { status: 500 }
  );
}

// HTTPステータスコードマッピング
function getHttpStatusFromErrorCode(code: string): number {
  const statusMap: Record<string, number> = {
    // 認証エラー
    [AuthErrorCode.INVALID_CREDENTIALS]: 401,
    [AuthErrorCode.TOKEN_EXPIRED]: 401,
    [AuthErrorCode.TOKEN_INVALID]: 401,
    [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
    
    // 予想エラー
    [PredictionErrorCode.DEADLINE_PASSED]: 400,
    [PredictionErrorCode.INVALID_FORMATION]: 400,
    [PredictionErrorCode.PREDICTION_LIMIT_EXCEEDED]: 403,
    
    // システムエラー
    [SystemErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [SystemErrorCode.DATABASE_CONNECTION_ERROR]: 503,
    [SystemErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  };
  
  return statusMap[code] || 500;
}
```

### 4.2. React Error Boundary

```typescript
// components/error-boundary.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = generateErrorId();
    
    // エラーをログに記録
    logClientError(error, errorId);
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 p-8">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">予期しないエラーが発生しました</h1>
              <p className="text-muted-foreground">
                申し訳ございません。システムに問題が発生しています。
              </p>
              {this.state.errorId && (
                <p className="text-sm text-muted-foreground">
                  エラーID: {this.state.errorId}
                </p>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                ページを再読み込み
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                ホームに戻る
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4.3. React Query エラーハンドリング

```typescript
// lib/react-query/error-handler.ts
import { toast } from 'sonner';

export function handleQueryError(error: unknown) {
  if (error instanceof BaseError) {
    // ユーザーに表示するエラー
    if (error.severity === ErrorSeverity.LOW || error.severity === ErrorSeverity.MEDIUM) {
      toast.error(error.userMessage);
    }
    
    // 認証エラーの場合はログイン画面にリダイレクト
    if (error.code.startsWith('AUTH_')) {
      window.location.href = '/auth/login';
    }
  } else {
    // 予期しないエラー
    toast.error('予期しないエラーが発生しました。しばらく後にお試しください。');
  }
}

// React Query設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: handleQueryError,
      retry: (failureCount, error) => {
        // システムエラーの場合は3回まで再試行
        if (error instanceof BaseError && error.severity === ErrorSeverity.CRITICAL) {
          return failureCount < 3;
        }
        // その他のエラーは再試行しない
        return false;
      },
    },
    mutations: {
      onError: handleQueryError,
    },
  },
});
```

## 5. ログ設計

### 5.1. ログレベル定義

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}
```

### 5.2. ログ出力実装

```typescript
// lib/logger/index.ts
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  error?: BaseError;
  context?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.INFO 
      : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    });
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatLog({
        level: LogLevel.DEBUG,
        message,
        timestamp: new Date(),
        context,
      }));
    }
  }

  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatLog({
        level: LogLevel.INFO,
        message,
        timestamp: new Date(),
        context,
      }));
    }
  }

  error(message: string, error?: BaseError | Error, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatLog({
        level: LogLevel.ERROR,
        message,
        timestamp: new Date(),
        error: error instanceof BaseError ? error : undefined,
        context: {
          ...context,
          stack: error?.stack,
        },
      }));
    }
  }
}

export const logger = new Logger();

// エラーログ専用関数
export function logError(
  error: BaseError,
  request?: Request,
  originalError?: unknown
) {
  const context: Record<string, any> = {
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent'),
    originalError: originalError instanceof Error ? {
      name: originalError.name,
      message: originalError.message,
      stack: originalError.stack,
    } : originalError,
  };

  logger.error(`${error.name}: ${error.message}`, error, context);
}
```

## 6. ユーザー向けエラー表示

### 6.1. Toast通知

```typescript
// components/error-toast.tsx
import { toast } from 'sonner';
import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

export function showErrorToast(error: BaseError) {
  const icon = getErrorIcon(error.severity);
  
  toast.error(error.userMessage, {
    icon,
    duration: getToastDuration(error.severity),
    action: error.code === AuthErrorCode.TOKEN_EXPIRED ? {
      label: 'ログイン',
      onClick: () => window.location.href = '/auth/login',
    } : undefined,
  });
}

function getErrorIcon(severity: ErrorSeverity) {
  switch (severity) {
    case ErrorSeverity.LOW:
      return <AlertCircle className="h-4 w-4" />;
    case ErrorSeverity.MEDIUM:
      return <AlertTriangle className="h-4 w-4" />;
    case ErrorSeverity.HIGH:
    case ErrorSeverity.CRITICAL:
      return <XCircle className="h-4 w-4" />;
  }
}

function getToastDuration(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 3000;
    case ErrorSeverity.MEDIUM:
      return 5000;
    case ErrorSeverity.HIGH:
    case ErrorSeverity.CRITICAL:
      return 8000;
  }
}
```

### 6.2. エラーページ

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">問題が発生しました</h2>
        <p className="text-muted-foreground">
          ページの読み込み中にエラーが発生しました。
        </p>
        <Button onClick={reset}>
          もう一度試す
        </Button>
      </div>
    </div>
  );
}
```

## 7. 監視・アラート

### 7.1. エラー監視設定

```typescript
// lib/monitoring/error-tracking.ts
interface ErrorMetrics {
  errorCount: number;
  errorRate: number;
  criticalErrors: number;
  userAffectedCount: number;
}

export function trackError(error: BaseError) {
  // エラーメトリクスの更新
  updateErrorMetrics(error);
  
  // 重要度が高い場合はアラート送信
  if (error.severity === ErrorSeverity.CRITICAL) {
    sendCriticalErrorAlert(error);
  }
}

function sendCriticalErrorAlert(error: BaseError) {
  // Slack通知、メール通知など
  console.error('CRITICAL ERROR ALERT:', error.toJSON());
}
```

### 7.2. エラー分析ダッシュボード

```typescript
// 管理者向けエラー分析データ
interface ErrorAnalytics {
  topErrors: Array<{
    code: string;
    count: number;
    affectedUsers: number;
  }>;
  errorTrends: Array<{
    date: string;
    errorCount: number;
    errorRate: number;
  }>;
  severityDistribution: Record<ErrorSeverity, number>;
}
```

この設計により、PROVEXIは堅牢なエラーハンドリングシステムを実現し、ユーザー体験の向上とシステムの安定性を両立します。