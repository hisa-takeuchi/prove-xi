import { Match, PredictionStatus } from '@/types';

interface MatchCardProps {
  match: Match;
  onPredictClick?: (matchId: string) => void;
}

export function MatchCard({ match, onPredictClick }: MatchCardProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPredictionStatusStyle = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.ACCEPTING:
        return 'bg-green-100 text-green-800 border-green-200';
      case PredictionStatus.CLOSED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PredictionStatus.FINISHED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPredictionStatusText = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.ACCEPTING:
        return '予想受付中';
      case PredictionStatus.CLOSED:
        return '受付終了';
      case PredictionStatus.FINISHED:
        return '結果確定';
      default:
        return '不明';
    }
  };

  const isPredictionAvailable = match.predictionStatus === PredictionStatus.ACCEPTING;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* League Badge */}
      <div className="flex justify-between items-start mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {match.league}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPredictionStatusStyle(match.predictionStatus)}`}>
          {getPredictionStatusText(match.predictionStatus)}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold">{match.homeTeam.shortName}</span>
          </div>
          <span className="font-medium text-gray-900">{match.homeTeam.name}</span>
        </div>
        
        <div className="text-lg font-bold text-gray-500">VS</div>
        
        <div className="flex items-center space-x-3">
          <span className="font-medium text-gray-900">{match.awayTeam.name}</span>
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold">{match.awayTeam.shortName}</span>
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="text-sm text-gray-600 mb-4">
        <div className="flex justify-between items-center">
          <span>⏰ {formatTime(match.kickoffTime)}</span>
          {match.venue && <span>📍 {match.venue}</span>}
        </div>
        {isPredictionAvailable && (
          <div className="mt-1 text-red-600 text-xs">
            予想締切: {formatTime(match.predictionDeadline)}
          </div>
        )}
      </div>

      {/* Action Button */}
      {isPredictionAvailable && onPredictClick && (
        <button
          onClick={() => onPredictClick(match.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          予想する
        </button>
      )}
      
      {match.predictionStatus === PredictionStatus.CLOSED && (
        <button
          disabled
          className="w-full bg-gray-100 text-gray-500 font-medium py-2 px-4 rounded-md cursor-not-allowed"
        >
          予想受付終了
        </button>
      )}
      
      {match.predictionStatus === PredictionStatus.FINISHED && (
        <button
          className="w-full bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded-md transition-colors"
        >
          結果を見る
        </button>
      )}
    </div>
  );
}