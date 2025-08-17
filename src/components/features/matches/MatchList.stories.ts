import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { http, HttpResponse } from 'msw';
import { MatchList } from './MatchList';
import { handlers } from '@/mocks/handlers';
import { ApiResponse, MatchListResponse } from '@/types';

const meta = {
  title: 'Features/Matches/MatchList',
  component: MatchList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '試合一覧を表示するコンポーネント。リーグ別・ステータス別のフィルタリング機能を持ち、APIからデータを取得します。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onPredictClick: { action: 'predict clicked' },
  },
} satisfies Meta<typeof MatchList>;

export default meta;
type Story = StoryObj<typeof meta>;

// MSWハンドラーを使用するため、手動のモック生成関数は不要

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'デフォルトの試合一覧表示。MSWハンドラーを使用してAPIから試合データを取得します。',
      },
    },
    msw: {
      handlers: handlers,
    },
  },
};

// フィルタリング機能はMSWハンドラー側で実装済み

export const EmptyState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: '試合が存在しない場合の空状態表示',
      },
    },
    msw: {
      handlers: [
        http.get('/api/matches', () => {
          const response: ApiResponse<MatchListResponse> = {
            success: true,
            data: {
              matches: [],
              total: 0,
              hasMore: false,
            },
            meta: {
              timestamp: new Date().toISOString(),
            },
          };
          return HttpResponse.json(response);
        }),
      ],
    },
  },
};

export const ErrorState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'APIエラー時の表示状態',
      },
    },
    msw: {
      handlers: [
        http.get('/api/matches', () => {
          return HttpResponse.json(
            { error: 'Not Found' },
            { status: 404 }
          );
        }),
      ],
    },
  },
};