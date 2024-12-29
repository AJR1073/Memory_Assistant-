import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  totalScore: number;
  versesMemorized: number;
  lastUpdated: Date;
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Initialize or update user's leaderboard entry
  useEffect(() => {
    if (!currentUser) return;

    const initializeUserEntry = async () => {
      try {
        const userRef = doc(db, 'leaderboard', currentUser.uid);
        await setDoc(userRef, {
          userId: currentUser.uid,
          displayName: currentUser.email?.split('@')[0] || 'Anonymous',
          totalScore: 0,
          versesMemorized: 0,
          lastUpdated: new Date()
        }, { merge: true });
      } catch (err) {
        console.error('Error initializing user leaderboard entry:', err);
      }
    };

    initializeUserEntry();
  }, [currentUser]);

  // Subscribe to leaderboard updates
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'leaderboard'),
      orderBy('totalScore', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const leaderboardData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        })) as LeaderboardEntry[];

        setEntries(leaderboardData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in leaderboard listener:', err);
        setError('Failed to load leaderboard data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const updateUserScore = async (score: number, versesMemorized: number) => {
    if (!currentUser) throw new Error('Must be logged in to update score');

    try {
      const entryRef = doc(db, 'leaderboard', currentUser.uid);
      await setDoc(
        entryRef,
        {
          userId: currentUser.uid,
          displayName: currentUser.email?.split('@')[0] || 'Anonymous',
          totalScore: score,
          versesMemorized,
          lastUpdated: new Date(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error updating leaderboard:', err);
      throw new Error('Failed to update leaderboard');
    }
  };

  return {
    entries,
    loading,
    error,
    updateUserScore,
  };
}
