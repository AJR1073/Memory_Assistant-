import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Translation } from '../types/verse';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_TRANSLATIONS: Translation[] = [
  { id: 'kjv', name: 'King James Version', abbreviation: 'KJV', isDefault: true },
  { id: 'niv', name: 'New International Version', abbreviation: 'NIV' },
  { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV' },
  { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT' },
  { id: 'nasb', name: 'New American Standard Bible', abbreviation: 'NASB' },
];

export function useTranslations() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Initialize default translations if none exist
  const initializeDefaultTranslations = async () => {
    try {
      const translationsRef = collection(db, 'translations');
      const q = query(translationsRef, limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No translations found, initializing defaults...');
        for (const translation of DEFAULT_TRANSLATIONS) {
          const { id, ...data } = translation;
          await addDoc(collection(db, 'translations'), {
            ...data,
            createdAt: new Date(),
            createdBy: currentUser?.uid || 'system'
          });
        }
      }
    } catch (error) {
      console.error('Error initializing translations:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      initializeDefaultTranslations();
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'translations'),
      (snapshot) => {
        const translationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Translation[];
        setTranslations(translationsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching translations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addTranslation = async (translation: Omit<Translation, 'id'>) => {
    if (!currentUser) throw new Error('Must be logged in to add translations');
    
    // If this is set as default, remove default from others
    if (translation.isDefault) {
      const currentDefault = translations.find(t => t.isDefault);
      if (currentDefault) {
        await updateDoc(doc(db, 'translations', currentDefault.id), {
          isDefault: false
        });
      }
    }
    
    const translationData = {
      ...translation,
      createdBy: currentUser.uid,
      createdAt: new Date()
    };

    await addDoc(collection(db, 'translations'), translationData);
  };

  const updateTranslation = async (id: string, data: Partial<Translation>) => {
    if (!currentUser) throw new Error('Must be logged in to update translations');
    
    // If this is set as default, remove default from others
    if (data.isDefault) {
      const currentDefault = translations.find(t => t.isDefault && t.id !== id);
      if (currentDefault) {
        await updateDoc(doc(db, 'translations', currentDefault.id), {
          isDefault: false
        });
      }
    }
    
    await updateDoc(doc(db, 'translations', id), data);
  };

  const deleteTranslation = async (id: string) => {
    if (!currentUser) throw new Error('Must be logged in to delete translations');
    
    // Don't allow deletion if it's the only translation
    if (translations.length <= 1) {
      throw new Error('Cannot delete the last translation');
    }
    
    // If deleting default translation, set another as default
    const translation = translations.find(t => t.id === id);
    if (translation?.isDefault && translations.length > 1) {
      const newDefault = translations.find(t => t.id !== id);
      if (newDefault) {
        await updateDoc(doc(db, 'translations', newDefault.id), {
          isDefault: true
        });
      }
    }
    
    await deleteDoc(doc(db, 'translations', id));
  };

  return {
    translations,
    loading,
    addTranslation,
    updateTranslation,
    deleteTranslation
  };
}
