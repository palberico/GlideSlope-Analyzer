import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, type AuthError } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const configured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app: FirebaseApp | null = configured ? initializeApp(firebaseConfig) : null;
export const auth: Auth | null = configured && app ? getAuth(app) : null;
export const db: Firestore | null = configured && app ? getFirestore(app) : null;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/missing-password': 'Enter a password.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/email-already-in-use': 'An account already exists for that email — try signing in instead.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many attempts — try again in a bit.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
};

export function friendlyAuthError(e: AuthError): string {
  return AUTH_ERROR_MESSAGES[e.code] || e.message;
}
