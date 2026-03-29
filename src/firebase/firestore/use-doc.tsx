// src/firebase/firestore/use-doc.tsx
'use client';
import {
  onSnapshot,
  doc,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';

const useDoc = <T extends DocumentData>(
  ref: DocumentReference<T> | null
) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firestore && ref) {
      const unsubscribe = onSnapshot(ref, 
        (doc) => {
          if (doc.exists()) {
            setData({ ...doc.data(), id: doc.id });
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching document:", error);
          setData(null);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, [firestore, ref]);

  return { data, loading };
};

export { useDoc };
