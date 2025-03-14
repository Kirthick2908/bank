import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjEywJ1oAsM_ovjY6QIQrJEFdCn8wry9M",
  authDomain: "bankingsystem-49ae6.firebaseapp.com",
  projectId: "bankingsystem-49ae6",
  storageBucket: "bankingsystem-49ae6.firebasestorage.app",
  messagingSenderId: "826266251048",
  appId: "1:826266251048:web:b8a44f7ab0291548cc2a1d",
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, sendPasswordResetEmail };