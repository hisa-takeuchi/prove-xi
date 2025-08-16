import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MatchCard } from './MatchCard';
import { Match, PredictionStatus, MatchStatus, League } from '@/types';

const meta = {
  title: 'Features/Matches/MatchCard',
  component: MatchCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'サッカーの試合情報を表示するカードコンポーネント。予想ステータスに応じてアクションボタンが変化します。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onPredictClick: { action: 'predict clicked' },
  },
} satisfies Meta<typeof MatchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的なサンプルマッチデータ
const baseMockMatch: Match = {
  id: 'match-1',
  homeTeam: {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    logo: '/logos/arsenal.png',
    league: League.PREMIER_LEAGUE,
    country: 'England',
  },
  awayTeam: {
    id: 'chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    logo: '/logos/chelsea.png',
    league: League.PREMIER_LEAGUE,
    country: 'England',
  },
  kickoffTime: new Date('2024-08-17T15:00:00Z'),
  predictionDeadline: new Date('2024-08-17T14:00:00Z'),
  status: MatchStatus.SCHEDULED,
  venue: 'Emirates Stadium',
  league: League.PREMIER_LEAGUE,
  season: '2024-25',
  predictionStatus: PredictionStatus.ACCEPTING,
};

export const AcceptingPredictions: Story = {
  args: {
    match: baseMockMatch,
  },
  parameters: {
    docs: {
      description: {
        story: '予想受付中の状態。「予想する」ボタンが表示されます。',
      },
    },
  },
};

export const PredictionsClosed: Story = {
  args: {
    match: {
      ...baseMockMatch,
      predictionStatus: PredictionStatus.CLOSED,
      predictionDeadline: new Date('2024-08-16T14:00:00Z'), // 過去の時刻
    },
  },
  parameters: {
    docs: {
      description: {
        story: '予想受付終了の状態。無効化されたボタンが表示されます。',
      },
    },
  },
};

export const MatchFinished: Story = {
  args: {
    match: {
      ...baseMockMatch,
      status: MatchStatus.FINISHED,
      predictionStatus: PredictionStatus.FINISHED,
      kickoffTime: new Date('2024-08-16T15:00:00Z'), // 過去の時刻
    },
  },
  parameters: {
    docs: {
      description: {
        story: '試合終了の状態。「結果を見る」ボタンが表示されます。',
      },
    },
  },
};

export const LaLigaMatch: Story = {
  args: {
    match: {
      ...baseMockMatch,
      homeTeam: {
        id: 'real-madrid',
        name: 'Real Madrid',
        shortName: 'RMA',
        logo: '/logos/real-madrid.png',
        league: League.LA_LIGA,
        country: 'Spain',
      },
      awayTeam: {
        id: 'barcelona',
        name: 'FC Barcelona',
        shortName: 'BAR',
        logo: '/logos/barcelona.png',
        league: League.LA_LIGA,
        country: 'Spain',
      },
      league: League.LA_LIGA,
      venue: 'Santiago Bernabéu',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'ラ・リーガの試合例（レアル・マドリード vs バルセロナ）',
      },
    },
  },
};

export const BundesligaMatch: Story = {
  args: {
    match: {
      ...baseMockMatch,
      homeTeam: {
        id: 'bayern-munich',
        name: 'Bayern Munich',
        shortName: 'BAY',
        logo: '/logos/bayern.png',
        league: League.BUNDESLIGA,
        country: 'Germany',
      },
      awayTeam: {
        id: 'borussia-dortmund',
        name: 'Borussia Dortmund',
        shortName: 'BVB',
        logo: '/logos/dortmund.png',
        league: League.BUNDESLIGA,
        country: 'Germany',
      },
      league: League.BUNDESLIGA,
      venue: 'Allianz Arena',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'ブンデスリーガの試合例（バイエルン・ミュンヘン vs ボルシア・ドルトムント）',
      },
    },
  },
};

export const WithoutVenue: Story = {
  args: {
    match: {
      ...baseMockMatch,
      venue: undefined,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '会場情報が無い場合の表示',
      },
    },
  },
};

export const LongTeamNames: Story = {
  args: {
    match: {
      ...baseMockMatch,
      homeTeam: {
        ...baseMockMatch.homeTeam,
        name: 'Manchester United Football Club',
        shortName: 'MUN',
      },
      awayTeam: {
        ...baseMockMatch.awayTeam,
        name: 'Tottenham Hotspur Football Club',
        shortName: 'TOT',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: '長いチーム名での表示確認',
      },
    },
  },
};