import { MatchListContainer } from '@/components/features/matches/MatchListContainer';

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">試合一覧</h1>
          <p className="mt-2 text-gray-600">
            予想可能な試合を確認して、フォーメーション予想に挑戦しましょう
          </p>
        </div>

        {/* Match List */}
        <MatchListContainer />
      </div>
    </div>
  );
}