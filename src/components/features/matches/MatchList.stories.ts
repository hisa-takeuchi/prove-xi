import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MatchList } from './MatchList';
import { Match, PredictionStatus, MatchStatus, League } from '@/types';

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

// モックデータの生成
const createMockMatch = (
  id: string,
  homeTeam: string,
  awayTeam: string,
  league: League,
  status: PredictionStatus,
  hoursFromNow: number = 24
): Match => ({
  id,
  homeTeam: {
    id: `${homeTeam.toLowerCase().replace(' ', '-')}`,
    name: homeTeam,
    shortName: homeTeam.substring(0, 3).toUpperCase(),
    logo: `/logos/${homeTeam.toLowerCase().replace(' ', '-')}.png`,
    league,
    country: league === League.PREMIER_LEAGUE ? 'England' : 
             league === League.LA_LIGA ? 'Spain' : 
             league === League.BUNDESLIGA ? 'Germany' : 
             league === League.SERIE_A ? 'Italy' : 'France',
  },
  awayTeam: {
    id: `${awayTeam.toLowerCase().replace(' ', '-')}`,
    name: awayTeam,
    shortName: awayTeam.substring(0, 3).toUpperCase(),
    logo: `/logos/${awayTeam.toLowerCase().replace(' ', '-')}.png`,
    league,
    country: league === League.PREMIER_LEAGUE ? 'England' : 
             league === League.LA_LIGA ? 'Spain' : 
             league === League.BUNDESLIGA ? 'Germany' : 
             league === League.SERIE_A ? 'Italy' : 'France',
  },
  kickoffTime: new Date(Date.now() + hoursFromNow * 60 * 60 * 1000),
  predictionDeadline: new Date(Date.now() + (hoursFromNow - 1) * 60 * 60 * 1000),
  status: status === PredictionStatus.FINISHED ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
  venue: `${homeTeam} Stadium`,
  league,
  season: '2024-25',
  predictionStatus: status,
});

const mockMatches: Match[] = [
  createMockMatch('1', 'Arsenal', 'Chelsea', League.PREMIER_LEAGUE, PredictionStatus.ACCEPTING, 24),
  createMockMatch('2', 'Liverpool', 'Manchester City', League.PREMIER_LEAGUE, PredictionStatus.ACCEPTING, 48),
  createMockMatch('3', 'Real Madrid', 'Barcelona', League.LA_LIGA, PredictionStatus.CLOSED, 2),
  createMockMatch('4', 'Bayern Munich', 'Dortmund', League.BUNDESLIGA, PredictionStatus.ACCEPTING, 72),
  createMockMatch('5', 'Juventus', 'AC Milan', League.SERIE_A, PredictionStatus.FINISHED, -24),
  createMockMatch('6', 'PSG', 'Monaco', League.LIGUE_1, PredictionStatus.ACCEPTING, 96),
];

export const Default: Story = {
  args: {
    initialMatches: mockMatches,
  },
  parameters: {
    docs: {
      description: {
        story: 'デフォルトの試合一覧表示。様々なリーグと予想ステータスの試合が混在しています。',
      },
    },
    msw: {
      handlers: [
        // MSWを使ったAPIモックを後で追加可能
      ],
    },
  },
};

export const OnlyPremierLeague: Story = {
  args: {
    initialMatches: mockMatches.filter(match => match.league === League.PREMIER_LEAGUE),
  },
  parameters: {
    docs: {
      description: {
        story: 'プレミアリーグの試合のみを表示',
      },
    },
  },
};

export const OnlyAcceptingPredictions: Story = {
  args: {
    initialMatches: mockMatches.filter(match => match.predictionStatus === PredictionStatus.ACCEPTING),
  },
  parameters: {
    docs: {
      description: {
        story: '予想受付中の試合のみを表示',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    initialMatches: [],
  },
  parameters: {
    docs: {
      description: {
        story: '試合が存在しない場合の空状態表示',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    initialMatches: undefined, // loadingを発生させるためundefined
  },
  parameters: {
    docs: {
      description: {
        story: 'データ読み込み中の状態（ローディングスピナー）',
      },
    },
  },
  play: async () => {
    // 実際のローディング状態をシミュレートするplay関数を後で追加可能
  },
};

export const MixedLeagues: Story = {
  args: {
    initialMatches: [
      createMockMatch('pl1', 'Arsenal', 'Chelsea', League.PREMIER_LEAGUE, PredictionStatus.ACCEPTING, 24),
      createMockMatch('ll1', 'Real Madrid', 'Barcelona', League.LA_LIGA, PredictionStatus.ACCEPTING, 48),
      createMockMatch('bl1', 'Bayern Munich', 'Dortmund', League.BUNDESLIGA, PredictionStatus.ACCEPTING, 72),
      createMockMatch('sa1', 'Juventus', 'AC Milan', League.SERIE_A, PredictionStatus.ACCEPTING, 96),
      createMockMatch('l1_1', 'PSG', 'Monaco', League.LIGUE_1, PredictionStatus.ACCEPTING, 120),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '全リーグから1試合ずつ、すべて予想受付中の状態',
      },
    },
  },
};

export const AllStatuses: Story = {
  args: {
    initialMatches: [
      createMockMatch('accepting', 'Arsenal', 'Chelsea', League.PREMIER_LEAGUE, PredictionStatus.ACCEPTING, 24),
      createMockMatch('closed', 'Liverpool', 'Manchester City', League.PREMIER_LEAGUE, PredictionStatus.CLOSED, 2),
      createMockMatch('finished', 'Tottenham', 'Manchester United', League.PREMIER_LEAGUE, PredictionStatus.FINISHED, -12),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '全ての予想ステータス（受付中・終了・確定）を含む試合一覧',
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  args: {
    initialMatches: mockMatches.slice(0, 6), // 6試合でレスポンシブレイアウトをテスト
  },
  parameters: {
    docs: {
      description: {
        story: 'レスポンシブレイアウトの確認用。6試合のグリッド表示',
      },
    },
    viewport: {
      defaultViewport: 'mobile1', // モバイル表示での確認
    },
  },
};