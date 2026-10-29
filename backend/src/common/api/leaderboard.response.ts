export interface LeaderboardEntryResponse {
  rank: number;
  displayName: string;
  totalRewards: number;
  quizzesPassed: number;
  email?: string;
}
