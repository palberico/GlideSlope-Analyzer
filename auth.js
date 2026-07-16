import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadFirebaseConfigFromEnv(){
  const candidates = ['./secrets/.env', '/secrets/.env', '/.env'];
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { cache: 'no-store' });
      if (!response.ok) continue;
      const text = await response.text();
      const values = {};
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const separator = line.indexOf('=');
        if (separator === -1) continue;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
        values[key] = value;
      }
      return {
        apiKey: values.FIREBASE_API_KEY || '',
        authDomain: values.FIREBASE_AUTH_DOMAIN || '',
        projectId: values.FIREBASE_PROJECT_ID || '',
        storageBucket: values.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: values.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: values.FIREBASE_APP_ID || '',
        measurementId: values.FIREBASE_MEASUREMENT_ID || ''
      };
    } catch (e) {
      // keep trying the next candidate
    }
  }
  return null;
}

// ===================================================================
//  Firebase config is loaded from secrets/.env when the page is served
//  from a local web server (for example via python3 -m http.server).
// ===================================================================
const firebaseConfig = (await loadFirebaseConfigFromEnv()) || {
  apiKey: '', authDomain: '', projectId: '', storageBucket: '',
  messagingSenderId: '', appId: ''
};
// ===================================================================

export const configured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
export const app  = configured ? initializeApp(firebaseConfig) : null;
export const auth = configured ? getAuth(app) : null;
export const db   = configured ? getFirestore(app) : null;

export {
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
};

export function friendlyAuthError(e){
  const map = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/missing-password': 'Enter a password.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/email-already-in-use': 'An account already exists for that email — try signing in instead.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account found for that email.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/too-many-requests': 'Too many attempts — try again in a bit.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.'
  };
  return map[e.code] || e.message;
}
