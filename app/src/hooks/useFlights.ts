import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Flight {
  id: string;
  name: string;
  csv: string;
  slope: number | null;
  rows: number | null;
  createdAt: Timestamp | null;
}

export function useFlights(user: User | null) {
  const [flights, setFlights] = useState<Flight[] | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user || !db) return;
    setError('');
    setFlights(null);
    try {
      const q = query(collection(db, 'users', user.uid, 'flights'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setFlights(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Flight));
    } catch (e) {
      setError((e as Error).message);
      setFlights([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else setFlights(null);
  }, [user, refresh]);

  async function save(name: string, csvText: string, slope: number | null, rows: number | null) {
    if (!user || !db) throw new Error('Sign in to save.');
    await addDoc(collection(db, 'users', user.uid, 'flights'), {
      name,
      csv: csvText,
      slope,
      rows,
      createdAt: serverTimestamp(),
    });
    await refresh();
  }

  async function remove(id: string) {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'flights', id));
    await refresh();
  }

  return { flights, error, save, remove, refresh };
}
