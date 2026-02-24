import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// initializeAuth with explicit persistence ensures the auth state is stored
// correctly. browserLocalPersistence (IndexedDB → localStorage fallback)
// is tried first; browserSessionPersistence is the fallback.
// getAuth() fallback handles HMR re-evaluation during development.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export default app;
