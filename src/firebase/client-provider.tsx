// src/firebase/client-provider.tsx
'use client';
import {
  initializeFirebase,
  FirebaseProvider,
  type FirebaseProviderProps,
} from './provider';

let app: FirebaseProviderProps | null = null;
function getFirebase() {
  if (typeof window !== 'undefined' && !app) {
    app = initializeFirebase();
  }
  return app;
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebase = getFirebase();

  // On the server, we can return the content without the provider
  if (!firebase) {
    return <>{children}</>;
  }

  // On the client, we need to wait for the firebase to be initialized
  // We can show a loading screen here if needed
  if (!firebase.app) {
    return null;
  }

  return <FirebaseProvider {...firebase}>{children}</FirebaseProvider>;
}
