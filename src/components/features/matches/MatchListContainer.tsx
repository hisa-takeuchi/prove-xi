'use client';

import { MatchList } from './MatchList';

export function MatchListContainer() {
  const handlePredictClick = (matchId: string) => {
    // TODO: Navigate to prediction page
    console.log('Navigate to prediction for match:', matchId);
  };

  return <MatchList onPredictClick={handlePredictClick} />;
}