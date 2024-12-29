import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export interface Verse {
  id: string;
  reference: string;
  text: string;
  userId: string;
  createdAt: Date;
  translation: string;
}

export function useVerses(translationFilter?: string) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setVerses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let versesQuery = query(
      collection(db, 'verses'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    if (translationFilter) {
      versesQuery = query(
        collection(db, 'verses'),
        where('userId', '==', currentUser.uid),
        where('translation', '==', translationFilter),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      versesQuery,
      (snapshot) => {
        const versesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Verse[];
        setVerses(versesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching verses:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, translationFilter]);

  const addVerse = async (verseData: Omit<Verse, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) throw new Error('Must be logged in to add verses');

    try {
      const newVerse = {
        ...verseData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'verses'), newVerse);
      return { id: docRef.id, ...newVerse, createdAt: new Date() } as Verse;
    } catch (err) {
      console.error('Error adding verse:', err);
      throw new Error('Failed to add verse');
    }
  };

  const updateVerse = async (id: string, updates: Partial<Omit<Verse, 'id' | 'userId' | 'createdAt'>>) => {
    if (!currentUser) throw new Error('Must be logged in to update verses');

    const verse = verses.find(v => v.id === id);
    if (!verse) throw new Error('Verse not found');
    if (verse.userId !== currentUser.uid) throw new Error('Not authorized to update this verse');

    try {
      const verseRef = doc(db, 'verses', id);
      await updateDoc(verseRef, updates);
      return { ...verse, ...updates };
    } catch (err) {
      console.error('Error updating verse:', err);
      throw new Error('Failed to update verse');
    }
  };

  const deleteVerse = async (id: string) => {
    if (!currentUser) throw new Error('Must be logged in to delete verses');

    const verse = verses.find(v => v.id === id);
    if (!verse) throw new Error('Verse not found');
    if (verse.userId !== currentUser.uid) throw new Error('Not authorized to delete this verse');

    try {
      await deleteDoc(doc(db, 'verses', id));
    } catch (err) {
      console.error('Error deleting verse:', err);
      throw new Error('Failed to delete verse');
    }
  };

  return {
    verses,
    loading,
    error,
    addVerse,
    updateVerse,
    deleteVerse,
  };
}
