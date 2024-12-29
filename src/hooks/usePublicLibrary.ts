import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface PublicVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  contributedBy: string;
  contributorName: string;
  likedBy: string[];
  createdAt: Date;
}

type SortOption = 'newest' | 'oldest' | 'popular';

export const usePublicLibrary = () => {
  const [verses, setVerses] = useState<PublicVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchVerses = async (sortOption: SortOption = 'newest') => {
    try {
      setLoading(true);
      const versesRef = collection(db, 'publicLibrary');
      const q = query(versesRef, orderBy('createdAt', sortOption === 'oldest' ? 'asc' : 'desc'));
      const querySnapshot = await getDocs(q);
      
      const versesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as PublicVerse));
      
      if (sortOption === 'popular') {
        versesData.sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
      }
      
      setVerses(versesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching verses:', err);
      setError('Failed to load verses');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (verseId: string) => {
    if (!currentUser) return;

    try {
      const verseRef = doc(db, 'publicLibrary', verseId);
      const isLiked = isVerseLiked(verseId);

      await updateDoc(verseRef, {
        likedBy: isLiked 
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid)
      });

      setVerses(prevVerses => 
        prevVerses.map(verse => {
          if (verse.id === verseId) {
            const newLikedBy = isLiked
              ? verse.likedBy.filter(id => id !== currentUser.uid)
              : [...verse.likedBy, currentUser.uid];
            return { ...verse, likedBy: newLikedBy };
          }
          return verse;
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like status');
    }
  };

  const isVerseLiked = (verseId: string): boolean => {
    if (!currentUser) return false;
    const verse = verses.find(v => v.id === verseId);
    return verse?.likedBy?.includes(currentUser.uid) || false;
  };

  useEffect(() => {
    fetchVerses();
  }, []);

  return {
    verses,
    loading,
    error,
    fetchVerses,
    toggleLike,
    isVerseLiked,
  };
};
