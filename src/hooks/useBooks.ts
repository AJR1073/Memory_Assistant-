import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export interface Book {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'books'),
      (snapshot) => {
        const booksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Book[];
        setBooks(booksData.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching books:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addBook = async (book: Omit<Book, 'id' | 'createdBy' | 'createdAt'>) => {
    if (!currentUser) throw new Error('Must be logged in to add books');
    
    const bookData = {
      ...book,
      createdBy: currentUser.uid,
      createdAt: new Date()
    };

    await addDoc(collection(db, 'books'), bookData);
  };

  const updateBook = async (id: string, data: Partial<Book>) => {
    if (!currentUser) throw new Error('Must be logged in to update books');
    await updateDoc(doc(db, 'books', id), data);
  };

  const deleteBook = async (id: string) => {
    if (!currentUser) throw new Error('Must be logged in to delete books');
    await deleteDoc(doc(db, 'books', id));
  };

  return {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook
  };
}
