export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  initials: string;
  createdAt: Date;
}

export interface Verse {
  id: string;
  userId: string;
  reference: string;
  text: string;
  translation: string;
  createdAt: Date;
  lastPracticed?: Date;
}

export interface PracticeAttempt {
  id: string;
  userId: string;
  verseId: string;
  inputText: string;
  score: number;
  mistakes: string[];
  usedSpeechInput: boolean;
  timestamp: Date;
}

export interface LeaderboardEntry {
  userId: string;
  initials: string;
  totalScore: number;
  versesMemorized: number;
  lastUpdated: Date;
}