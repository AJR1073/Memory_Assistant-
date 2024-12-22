import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyANlc1RoLOUnieWKpgiZd5Z0rMk6KvL59s",
  authDomain: "memoryassistant-75220.firebaseapp.com",
  projectId: "memoryassistant-75220",
  storageBucket: "memoryassistant-75220.firebasestorage.app",
  messagingSenderId: "271474504743",
  appId: "1:271474504743:web:0ea10380ddf7c15a7e4a02",
  measurementId: "G-JBGG594JZK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable persistence
if (window.location.hostname === 'localhost') {
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db };
