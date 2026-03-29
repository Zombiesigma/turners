// src/firebase/firestore/use-collection.tsx
'use client';
import {
  onSnapshot,
  collection,
  query,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';

interface UseCollectionOptions<T> {
  query?: [string, '==', any];
}

const useCollection = <T extends DocumentData>(
  q: Query<T> | null,
  options?: UseCollectionOptions<T>
) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firestore && q) {
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const data: T[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ ...doc.data(), id: doc.id });
          });
          setData(data);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching collection:", error);
          setData(null);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [firestore, q]);

  return { data, loading };
};

export { useCollection };
