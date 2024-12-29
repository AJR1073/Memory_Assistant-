import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export interface PublicVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  contributedBy: string;
  contributorName: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
  tags?: string[];
}

export type SortOption = 'newest' | 'oldest' | 'popular';

export function usePublicLibrary() {
  const [verses, setVerses] = useState<PublicVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchPublicVerses = async () => {
      if (!currentUser) {
        setVerses([]);
        setLoading(false);
        return;
      }

      try {
        let q = query(collection(db, 'publicLibrary'));
        
        // Apply sorting
        switch (sortBy) {
          case 'newest':
            q = query(q, orderBy('createdAt', 'desc'));
            break;
          case 'oldest':
            q = query(q, orderBy('createdAt', 'asc'));
            break;
          case 'popular':
            q = query(q, orderBy('likes', 'desc'));
            break;
        }
        
        const querySnapshot = await getDocs(q);
        let versesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          likedBy: doc.data().likedBy || [],
        })) as PublicVerse[];
        
        // Apply search filter if searchTerm exists
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          versesData = versesData.filter(verse => 
            verse.reference.toLowerCase().includes(searchLower) ||
            verse.text.toLowerCase().includes(searchLower) ||
            verse.translation.toLowerCase().includes(searchLower) ||
            verse.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }
        
        setVerses(versesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching public verses:', err);
        setError('Failed to load public library');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicVerses();
  }, [currentUser, sortBy, searchTerm]);

  const addToPublicLibrary = async (verseData: Omit<PublicVerse, 'id' | 'contributedBy' | 'contributorName' | 'createdAt' | 'likes' | 'likedBy'>) => {
    if (!currentUser) throw new Error('Must be logged in to contribute verses');

    try {
      const newVerse = {
        ...verseData,
        contributedBy: currentUser.uid,
        contributorName: currentUser.displayName || 'Anonymous User',
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
      };

      const docRef = await addDoc(collection(db, 'publicLibrary'), newVerse);
      return { id: docRef.id, ...newVerse, createdAt: new Date() } as PublicVerse;
    } catch (err) {
      console.error('Error adding verse to public library:', err);
      throw new Error('Failed to add verse to public library');
    }
  };

  const updatePublicVerse = async (id: string, updates: Partial<Omit<PublicVerse, 'id' | 'contributedBy' | 'contributorName' | 'createdAt' | 'likes' | 'likedBy'>>) => {
    if (!currentUser) throw new Error('Must be logged in to update verses');

    const verse = verses.find(v => v.id === id);
    if (!verse) throw new Error('Verse not found');
    if (verse.contributedBy !== currentUser.uid) throw new Error('Not authorized to update this verse');

    try {
      const verseRef = doc(db, 'publicLibrary', id);
      await updateDoc(verseRef, updates);
      return { ...verse, ...updates };
    } catch (err) {
      console.error('Error updating public verse:', err);
      throw new Error('Failed to update verse');
    }
  };

  const removeFromPublicLibrary = async (id: string) => {
    if (!currentUser) throw new Error('Must be logged in to remove verses');

    const verse = verses.find(v => v.id === id);
    if (!verse) throw new Error('Verse not found');
    if (verse.contributedBy !== currentUser.uid) throw new Error('Not authorized to remove this verse');

    try {
      await deleteDoc(doc(db, 'publicLibrary', id));
    } catch (err) {
      console.error('Error removing verse from public library:', err);
      throw new Error('Failed to remove verse from public library');
    }
  };

  const toggleLike = async (id: string) => {
    if (!currentUser) throw new Error('Must be logged in to like verses');

    const verse = verses.find(v => v.id === id);
    if (!verse) throw new Error('Verse not found');

    const isLiked = verse.likedBy.includes(currentUser.uid);
    const verseRef = doc(db, 'publicLibrary', id);

    try {
      await updateDoc(verseRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      });

      // Update local state
      setVerses(verses.map(v => {
        if (v.id === id) {
          return {
            ...v,
            likes: isLiked ? v.likes - 1 : v.likes + 1,
            likedBy: isLiked
              ? v.likedBy.filter(uid => uid !== currentUser.uid)
              : [...v.likedBy, currentUser.uid],
          };
        }
        return v;
      }));
    } catch (err) {
      console.error('Error toggling verse like:', err);
      throw new Error('Failed to update verse like');
    }
  };

  const getMyContributions = () => {
    if (!currentUser) return [];
    return verses.filter(verse => verse.contributedBy === currentUser.uid);
  };

  const getLikedVerses = () => {
    if (!currentUser) return [];
    return verses.filter(verse => verse.likedBy.includes(currentUser.uid));
  };

  const isVerseLiked = (id: string) => {
    if (!currentUser) return false;
    const verse = verses.find(v => v.id === id);
    return verse ? verse.likedBy.includes(currentUser.uid) : false;
  };

  return {
    verses,
    loading,
    error,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    addToPublicLibrary,
    updatePublicVerse,
    removeFromPublicLibrary,
    toggleLike,
    getMyContributions,
    getLikedVerses,
    isVerseLiked,
  };
}
