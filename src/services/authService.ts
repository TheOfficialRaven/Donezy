import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser,
  type User,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, googleProvider, db } from '@/lib/firebase';
import { deleteAllUserData } from './databaseService';
import { FOCUS_AREAS } from '@/lib/focusAreas';

export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Send verification email with retry (up to 3 attempts) to ensure delivery
  let emailSent = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await sendEmailVerification(user);
      emailSent = true;
      break;
    } catch {
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 800 * attempt));
      }
    }
  }

  // Set up profile, stats, and preferences in parallel for speed
  await Promise.all([
    updateProfile(user, { displayName }),
    set(ref(db, `users/${user.uid}/profile`), {
      displayName,
      email,
      persona: 'student',
      createdAt: new Date().toISOString(),
    }),
    set(ref(db, `users/${user.uid}/stats`), {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      essence: 50,
      streak: 0,
      questsCompleted: 0,
      totalQuestsCompleted: 0,
      lastActiveDate: '',
    }),
    set(ref(db, `users/${user.uid}/preferences`), {
      onboardingCompleted: false,
      interests: [],
      challenge: '',
      questFrequency: 'medium',
      activeTime: 'morning',
      livingWith: [],
      focusAreasOrder: FOCUS_AREAS,
      focusAreasEnabled: FOCUS_AREAS,
      wellbeingMode: true,
      maxActiveItems: 5,
    }),
  ]);

  // Sign out so user must verify email first
  await firebaseSignOut(auth);

  if (!emailSent) {
    throw { code: 'auth/verification-email-failed' };
  }

  return user;
}

export async function signIn(email: string, password: string, rememberMe: boolean = false) {
  // Set persistence based on "remember me" choice
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

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
  try {
    await sendEmailVerification(userCredential.user);
  } finally {
    await firebaseSignOut(auth);
  }
}

export async function signInWithGoogle(rememberMe: boolean = false) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;

  // Database setup for new Google users — wrapped separately so a DB failure
  // doesn't reject the sign-in (the user is already authenticated at this point).
  try {
    const profileRef = ref(db, `users/${user.uid}/profile`);
    const snapshot = await get(profileRef);

    if (!snapshot.exists()) {
      await Promise.all([
        set(profileRef, {
          displayName: user.displayName || 'Felhasználó',
          email: user.email,
          persona: 'student',
          createdAt: new Date().toISOString(),
        }),
        set(ref(db, `users/${user.uid}/stats`), {
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          essence: 50,
          streak: 0,
          questsCompleted: 0,
          totalQuestsCompleted: 0,
          lastActiveDate: '',
        }),
        set(ref(db, `users/${user.uid}/preferences`), {
          onboardingCompleted: false,
          interests: [],
          challenge: '',
          questFrequency: 'medium',
          activeTime: 'morning',
          livingWith: [],
          focusAreasOrder: FOCUS_AREAS,
          focusAreasEnabled: FOCUS_AREAS,
          wellbeingMode: true,
          maxActiveItems: 5,
        }),
      ]);
    }
  } catch (dbError) {
    console.error('Google sign-in DB setup failed (user is still authenticated):', dbError);
  }

  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  // Delete all user data from Realtime Database first
  await deleteAllUserData(user.uid);

  // Delete the Firebase Auth account
  await deleteUser(user);
}

export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
