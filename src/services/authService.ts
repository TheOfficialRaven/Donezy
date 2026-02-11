import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, googleProvider, db } from '@/lib/firebase';

export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });

  // Send email verification
  await sendEmailVerification(userCredential.user);

  // Create user profile in Realtime Database
  await set(ref(db, `users/${userCredential.user.uid}/profile`), {
    displayName,
    email,
    persona: 'student',
    createdAt: new Date().toISOString(),
  });

  // Initialize default stats (lastActiveDate empty so first handleDailyLogin sets streak to 1)
  await set(ref(db, `users/${userCredential.user.uid}/stats`), {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    essence: 50,
    streak: 0,
    questsCompleted: 0,
    totalQuestsCompleted: 0,
    lastActiveDate: '',
  });

  // Sign out immediately so user must verify email first
  await firebaseSignOut(auth);

  return userCredential.user;
}

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  if (!userCredential.user.emailVerified) {
    // Sign out unverified users
    await firebaseSignOut(auth);
    throw { code: 'auth/email-not-verified', user: userCredential.user };
  }

  return userCredential.user;
}

export async function resendVerificationEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user);
  await firebaseSignOut(auth);
}

export async function signInWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;

  // Check if user profile exists; if not, create one
  const profileRef = ref(db, `users/${user.uid}/profile`);
  const snapshot = await get(profileRef);

  if (!snapshot.exists()) {
    await set(profileRef, {
      displayName: user.displayName || 'Felhasználó',
      email: user.email,
      persona: 'student',
      createdAt: new Date().toISOString(),
    });

    await set(ref(db, `users/${user.uid}/stats`), {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      essence: 50,
      streak: 0,
      questsCompleted: 0,
      totalQuestsCompleted: 0,
      lastActiveDate: '',
    });
  }

  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
