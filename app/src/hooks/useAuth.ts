import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { auth, configured } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // Firebase resolves the signed-in-or-not state asynchronously, even for a
  // persisted session — until the first callback fires we don't actually know
  // yet, so callers must not treat a null `user` as "signed out" while this
  // is true (otherwise a sign-in gate flashes open on every page load).
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
  }, []);

  return {
    user,
    initializing,
    configured,
    signInGoogle: () => signInWithPopup(auth!, new GoogleAuthProvider()),
    signInEmail: (email: string, password: string) =>
      signInWithEmailAndPassword(auth!, email, password),
    signUpEmail: (email: string, password: string) =>
      createUserWithEmailAndPassword(auth!, email, password),
    signOutUser: () => signOut(auth!),
  };
}
