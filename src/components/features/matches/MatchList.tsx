'use client';

import { useState, useEffect } from 'react';
import { Match, League, PredictionStatus, ApiResponse, MatchListResponse } from '@/types';
import { MatchCard } from './MatchCard';

interface MatchListProps {
  initialMatches?: Match[];
  onPredictClick?: (matchId: string) => void;
}

export function MatchList({ initialMatches = [], onPredictClick }: MatchListProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<PredictionStatus | 'ALL'>('ALL');

  const leagues: Array<{ value: League | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'すべてのリーグ' },
    { value: League.PREMIER_LEAGUE, label: 'プレミアリーグ' },
    { value: League.LA_LIGA, label: 'ラ・リーガ' },
    { value: League.BUNDESLIGA, label: 'ブンデスリーガ' },
    { value: League.SERIE_A, label: 'セリエA' },
    { value: League.LIGUE_1, label: 'リーグ・アン' },
  ];

  const statuses: Array<{ value: PredictionStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'すべて' },
    { value: PredictionStatus.ACCEPTING, label: '予想受付中' },
    { value: PredictionStatus.CLOSED, label: '受付終了' },
    { value: PredictionStatus.FINISHED, label: '結果確定' },
  ];

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedLeague !== 'ALL') {
        params.append('league', selectedLeague);
      }
      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/matches?${params.toString()}`);
      const data: ApiResponse<MatchListResponse> = await response.json();

      if (data.success && data.data) {
        // Convert date strings back to Date objects
        const matchesWithDates = data.data.matches.map(match => ({
          ...match,
          kickoffTime: new Date(match.kickoffTime),
          predictionDeadline: new Date(match.predictionDeadline),
        }));
        setMatches(matchesWithDates);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch matches');
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedLeague, selectedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchMatches}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-2">
              リーグ
            </label>
            <select
              id="league-select"
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value as League | 'ALL')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {leagues.map((league) => (
                <option key={league.value} value={league.value}>
                  {league.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              id="status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PredictionStatus | 'ALL')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">試合を読み込み中...</p>
        </div>
      )}

      {/* Match List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.length > 0 ? (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onPredictClick={onPredictClick}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              条件に一致する試合が見つかりませんでした
            </div>
          )}
        </div>
      )}
    </div>
  );
}