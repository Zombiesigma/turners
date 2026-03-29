// src/firebase/provider.tsx
'use client';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { createContext, useContext } from 'react';
import { firebaseConfig } from './config';

export type FirebaseProviderProps = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  children?: React.ReactNode;
};

const FirebaseContext = createContext<FirebaseProviderProps | null>(null);

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const firestore = getFirestore(app);

export const initializeFirebase = () => {
  return { app, auth, firestore };
};

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export const useFirebaseApp = () => {
  return useContext(FirebaseContext)?.app;
};

export const useAuth = () => {
  return useContext(FirebaseContext)?.auth;
};

export const useFirestore = () => {
  return useContext(FirebaseContext)?.firestore;
};
