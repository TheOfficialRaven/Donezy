import { create } from 'zustand';
import type { User } from 'firebase/auth';
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  resendVerificationEmail as authResendVerification,
  deleteAccount as authDeleteAccount,
  onAuthChanged,
} from '@/services/authService';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  needsEmailVerification: boolean;

  // Actions
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  clearError: () => void;
  clearVerificationState: () => void;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,
  needsEmailVerification: false,

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      await authSignUp(email, password, displayName);
      set({ loading: false, needsEmailVerification: true });
    } catch (err: any) {
      if (err?.code === 'auth/verification-email-failed') {
        // Account created but email failed — still show verification screen with resend option
        set({ loading: false, needsEmailVerification: true, error: 'A megerősítő email küldése sikertelen volt. Kattints az újraküldés gombra.' });
        return;
      }
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
      throw err;
    }
  },

  signIn: async (email, password, rememberMe = false) => {
    set({ loading: true, error: null, needsEmailVerification: false });
    try {
      await authSignIn(email, password, rememberMe);
      set({ loading: false });
    } catch (err: any) {
      if (err.code === 'auth/email-not-verified') {
        set({ loading: false, needsEmailVerification: true, error: null });
        throw err;
      }
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
      throw err;
    }
  },

  signInWithGoogle: async (rememberMe = false) => {
    set({ loading: true, error: null });
    try {
      await authSignInWithGoogle(rememberMe);
      set({ loading: false });
    } catch (err: any) {
      const errorCode = err?.code as string | undefined;

      // User voluntarily closed the popup — not a real error
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        set({ loading: false });
        return;
      }

      console.error('Google sign-in failed:', err);
      set({ loading: false, error: getFirebaseErrorMessage(errorCode) });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await authSignOut();
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
      throw err;
    }
  },

  deleteAccount: async () => {
    set({ loading: true, error: null });
    try {
      await authDeleteAccount();
      set({ loading: false, user: null });
    } catch (err: any) {
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
      throw err;
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await authResetPassword(email);
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
      throw err;
    }
  },

  resendVerificationEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authResendVerification(email, password);
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  clearVerificationState: () => set({ needsEmailVerification: false }),

  initAuth: () => {
    const unsubscribe = onAuthChanged((user) => {
      set({ user, initialized: true, loading: false });
    });
    return unsubscribe;
  },
}));

function getFirebaseErrorMessage(code: string | undefined): string {
  if (!code) return 'Ismeretlen hiba történt. Próbáld újra.';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ez az email cím már regisztrálva van.';
    case 'auth/invalid-email':
      return 'Érvénytelen email cím.';
    case 'auth/operation-not-allowed':
      return 'Ez a bejelentkezési mód nincs engedélyezve.';
    case 'auth/weak-password':
      return 'A jelszó túl gyenge. Legalább 6 karakter szükséges.';
    case 'auth/user-disabled':
      return 'Ez a felhasználói fiók le van tiltva.';
    case 'auth/user-not-found':
      return 'Nem található felhasználó ezzel az email címmel.';
    case 'auth/wrong-password':
      return 'Helytelen jelszó.';
    case 'auth/invalid-credential':
      return 'Helytelen email cím vagy jelszó.';
    case 'auth/too-many-requests':
      return 'Túl sok próbálkozás. Kérjük, próbáld újra később.';
    case 'auth/popup-closed-by-user':
      return 'A bejelentkezési ablak bezárult. Próbáld újra.';
    case 'auth/cancelled-popup-request':
      return 'A bejelentkezési kérés megszakadt. Próbáld újra.';
    case 'auth/popup-blocked':
      return 'A böngésző blokkolja a felugró ablakot. Engedélyezd a felugró ablakokat ehhez az oldalhoz.';
    case 'auth/unauthorized-domain':
      return 'Ez a domain nincs engedélyezve a bejelentkezéshez.';
    case 'auth/account-exists-with-different-credential':
      return 'Ezzel az email címmel már másik bejelentkezési móddal regisztráltak.';
    case 'auth/internal-error':
      return 'Belső hiba történt. Próbáld újra később.';
    case 'auth/network-request-failed':
      return 'Hálózati hiba. Ellenőrizd az internet kapcsolatot.';
    case 'auth/credential-already-in-use':
      return 'Ez a fiók már egy másik felhasználóhoz van kapcsolva.';
    default:
      console.warn('Unhandled Firebase error code:', code);
      return 'Ismeretlen hiba történt. Próbáld újra.';
  }
}
