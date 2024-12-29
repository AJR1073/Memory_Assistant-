import { collection, addDoc, getDocs, query, limit, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const DEFAULT_TRANSLATIONS = [
  { name: 'King James Version', abbreviation: 'KJV', isDefault: true },
  { name: 'New International Version', abbreviation: 'NIV' },
  { name: 'English Standard Version', abbreviation: 'ESV' },
  { name: 'New Living Translation', abbreviation: 'NLT' },
  { name: 'New American Standard Bible', abbreviation: 'NASB' },
  { name: 'The Message', abbreviation: 'MSG' },
  { name: 'Amplified Bible', abbreviation: 'AMP' },
  { name: 'Christian Standard Bible', abbreviation: 'CSB' },
];

export const FAVORITE_BOOKS = [
  { name: 'Psalms', description: 'Book of worship and poetry' },
  { name: 'Proverbs', description: 'Book of wisdom' },
  { name: 'John', description: 'Fourth Gospel' },
  { name: 'Romans', description: 'Paul\'s letter to the Romans' },
  { name: 'Philippians', description: 'Paul\'s letter of joy' },
  { name: 'Genesis', description: 'Book of beginnings' },
  { name: 'Matthew', description: 'First Gospel' },
  { name: 'Revelation', description: 'Book of prophecy' },
];

export async function initializeDatabase(userId: string) {
  try {
    // Check and initialize translations
    const translationsRef = collection(db, 'translations');
    const translationsQuery = query(translationsRef, limit(1));
    const translationsSnapshot = await getDocs(translationsQuery);
    
    if (translationsSnapshot.empty) {
      console.log('Initializing translations...');
      for (const translation of DEFAULT_TRANSLATIONS) {
        await addDoc(translationsRef, {
          ...translation,
          createdAt: new Date(),
          createdBy: userId
        });
      }
    }

    // Check and initialize favorite books
    const booksRef = collection(db, 'books');
    const booksQuery = query(booksRef, limit(1));
    const booksSnapshot = await getDocs(booksQuery);
    
    if (booksSnapshot.empty) {
      console.log('Initializing favorite books...');
      for (const book of FAVORITE_BOOKS) {
        await addDoc(booksRef, {
          ...book,
          createdAt: new Date(),
          createdBy: userId
        });
      }
    }

    // Initialize user's leaderboard entry if it doesn't exist
    const leaderboardRef = doc(db, 'leaderboard', userId);
    await setDoc(leaderboardRef, {
      userId: userId,
      displayName: 'New User',
      totalScore: 0,
      versesMemorized: 0,
      lastUpdated: new Date()
    }, { merge: true });

  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
