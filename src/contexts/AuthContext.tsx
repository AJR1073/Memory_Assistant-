import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

interface AuthContextType {
  currentUser: User | null;
  register: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        if (firestoreError instanceof FirebaseError) {
          switch (firestoreError.code) {
            case 'permission-denied':
              throw new Error('Permission denied. Please check Firestore rules.');
            case 'unavailable':
              throw new Error('Firestore is temporarily unavailable. Please try again later.');
            default:
              throw new Error(`Firestore error: ${firestoreError.message}`);
          }
        }
        throw firestoreError;
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            throw new Error('This email is already registered');
          case 'auth/invalid-email':
            throw new Error('Invalid email address');
          case 'auth/operation-not-allowed':
            throw new Error('Email/password registration is not enabled');
          case 'auth/weak-password':
            throw new Error('Password is too weak');
          default:
            throw new Error(`Authentication error: ${error.message}`);
        }
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLogin: serverTimestamp(),
        }, { merge: true });
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // Continue even if updating last login fails
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            throw new Error('Invalid email or password');
          case 'auth/too-many-requests':
            throw new Error('Too many failed attempts. Please try again later.');
          case 'auth/user-disabled':
            throw new Error('This account has been disabled');
          case 'auth/network-request-failed':
            throw new Error('Network error. Please check your internet connection.');
          case 'auth/invalid-email':
            throw new Error('Invalid email format');
          default:
            throw new Error(`Authentication error: ${error.code}`);
        }
      }
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
