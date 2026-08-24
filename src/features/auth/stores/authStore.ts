/**
 * HealthQuest — Auth Store (Zustand)
 *
 * Manages authentication state globally.
 * Uses Firebase Auth onAuthStateChanged listener for reactive auth state with
 * local persistent fallback for seamless local/offline development.
 */
import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '@/config/firebase';
import { ProfileDocument, AvatarConfig } from '@/shared/types/database';

interface UserProfile {
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  isOnboarded: boolean;
  settings: {
    notificationsEnabled: boolean;
    voiceEnabled: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
  };
  createdAt: any;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  studentProfile: ProfileDocument | null;
  isLoading: boolean;
  profileLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  completeOnboarding: (
    nickname: string,
    avatar: AvatarConfig,
    grade: string,
    interests: string[],
    dailyGoalXP: number
  ) => Promise<void>;
  updateStudentProfile: (updates: Partial<ProfileDocument>) => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEY = 'hq_active_session';

const isOfflineOrDevError = (err: any): boolean => {
  if (!err) return false;
  const code = err.code || '';
  const msg = err.message || '';
  return (
    code.includes('invalid-api-key') ||
    code.includes('api-key-not-valid') ||
    code.includes('project-not-found') ||
    code.includes('app-not-authorized') ||
    code.includes('network-request-failed') ||
    msg.includes('invalid-api-key') ||
    msg.includes('API key')
  );
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  studentProfile: null,
  isLoading: true,
  profileLoading: false,
  error: null,

  initialize: () => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeStudentProfile: (() => void) | null = null;

    // 1. Check local cached session first (instant load & persistence across refreshes)
    AsyncStorage.getItem(STORAGE_KEY).then((cached) => {
      if (cached && !get().user) {
        try {
          const { user, profile, studentProfile } = JSON.parse(cached);
          if (user) {
            set({
              user,
              profile,
              studentProfile,
              isLoading: false,
              profileLoading: false,
            });
          }
        } catch (e) {
          console.warn('Failed to parse cached session:', e);
        }
      }
    });

    // 2. Setup Firebase Auth Listener
    let unsubscribeAuth: (() => void) | undefined;
    try {
      unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        if (unsubscribeStudentProfile) {
          unsubscribeStudentProfile();
          unsubscribeStudentProfile = null;
        }

        if (firebaseUser) {
          set({ user: firebaseUser, isLoading: false, profileLoading: true });

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const studentDocRef = doc(db, 'profiles', firebaseUser.uid);

          // 1. Listen to student profile
          unsubscribeStudentProfile = onSnapshot(
            studentDocRef,
            (studentSnap) => {
              if (studentSnap.exists()) {
                const sData = studentSnap.data() as ProfileDocument;
                set({
                  studentProfile: sData,
                  profile: {
                    email: firebaseUser.email || '',
                    role: 'student',
                    isOnboarded: true,
                    settings: {
                      notificationsEnabled: true,
                      voiceEnabled: true,
                      soundEnabled: true,
                      hapticEnabled: true,
                    },
                    createdAt: sData.updatedAt || new Date().toISOString(),
                  },
                  profileLoading: false,
                });
              } else {
                set({ studentProfile: null });
              }
            },
            (error) => {
              console.warn('Student profile snapshot error:', error);
            }
          );

          // 2. Listen to user document
          unsubscribeProfile = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const userData = docSnap.data() as UserProfile;
                set((state) => ({
                  profile: { ...(state.profile || {}), ...userData },
                  profileLoading: false,
                }));
              } else {
                set((state) => ({
                  profileLoading: state.studentProfile ? false : state.profileLoading,
                }));
              }
            },
            (error) => {
              console.warn('User profile snapshot error:', error);
              set({ profileLoading: false });
            }
          );
        } else {
          // If no firebase user, and not in local session mode
          if (!get().user) {
            set({
              user: null,
              profile: null,
              studentProfile: null,
              isLoading: false,
              profileLoading: false,
            });
          }
        }
      });
    } catch (err) {
      console.warn('Firebase Auth listener initialization fallback:', err);
      set({ isLoading: false, profileLoading: false });
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeStudentProfile) unsubscribeStudentProfile();
    };
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      // Try Firebase live auth
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return;
      } catch (fbErr: any) {
        if (!isOfflineOrDevError(fbErr)) {
          const message = getAuthErrorMessage(fbErr.code);
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      }

      // Local / Offline fallback auth
      const rawStored = await AsyncStorage.getItem(STORAGE_KEY);
      let localSession = rawStored ? JSON.parse(rawStored) : null;

      const uid = localSession?.user?.uid || 'user_' + Math.random().toString(36).substring(2, 9);
      const user: any = {
        uid,
        email,
        emailVerified: true,
      };

      const role = email.includes('admin')
        ? 'admin'
        : email.includes('teach')
        ? 'teacher'
        : 'student';

      const profile: UserProfile = localSession?.profile || {
        email,
        role,
        isOnboarded: localSession?.profile?.isOnboarded ?? true,
        settings: {
          notificationsEnabled: true,
          voiceEnabled: true,
          soundEnabled: true,
          hapticEnabled: true,
        },
        createdAt: new Date().toISOString(),
      };

      const studentProfile: ProfileDocument = localSession?.studentProfile || {
        nickname: email.split('@')[0] || 'Hero',
        avatar: {
          skinColor: '#FFDFBF',
          hairStyle: 'short',
          hairColor: '#4A3728',
          expression: 'smile',
          clothing: 'sporty_tshirt',
          accessory: 'none',
        },
        grade: 'Grade 3',
        interests: ['nutrition', 'fitness'],
        dailyGoalXP: 20,
        totalXP: 45,
        level: 1,
        coins: 30,
        energy: 100,
        streakCount: 3,
        lastStreakActiveDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      };

      set({
        user,
        profile,
        studentProfile: role === 'student' ? studentProfile : null,
        isLoading: false,
        error: null,
      });

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, profile, studentProfile })
      );
    } catch (error: any) {
      const message = error.message || 'Failed to sign in. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      // Try Firebase live auth
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await sendEmailVerification(credential.user);
        } catch (e) {}
        return credential.user;
      } catch (fbErr: any) {
        if (!isOfflineOrDevError(fbErr)) {
          const message = getAuthErrorMessage(fbErr.code);
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      }

      // Local / Offline fallback creation
      const uid = 'user_' + Math.random().toString(36).substring(2, 9);
      const user: any = {
        uid,
        email,
        emailVerified: true, // auto-verified for smooth onboarding
      };

      const role = email.includes('admin')
        ? 'admin'
        : email.includes('teach')
        ? 'teacher'
        : 'student';

      const profile: UserProfile = {
        email,
        role,
        isOnboarded: false, // will proceed to avatar builder
        settings: {
          notificationsEnabled: true,
          voiceEnabled: true,
          soundEnabled: true,
          hapticEnabled: true,
        },
        createdAt: new Date().toISOString(),
      };

      set({
        user,
        profile,
        studentProfile: null,
        isLoading: false,
        error: null,
      });

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, profile, studentProfile: null })
      );

      return user as User;
    } catch (error: any) {
      const message = error.message || 'Failed to create account. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      try {
        await firebaseSignOut(auth);
      } catch (e) {}
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ user: null, profile: null, studentProfile: null, isLoading: false });
    } catch (error: any) {
      set({ error: 'Failed to sign out', isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (fbErr: any) {
        if (!isOfflineOrDevError(fbErr)) {
          const message = getAuthErrorMessage(fbErr.code);
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      }
      set({ isLoading: false });
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  sendVerification: async () => {
    const { user } = get();
    if (!user) throw new Error('No user signed in');
    try {
      await sendEmailVerification(user);
    } catch (error: any) {
      if (!isOfflineOrDevError(error)) {
        set({ error: 'Failed to send verification email' });
        throw error;
      }
    }
  },

  completeOnboarding: async (
    nickname: string,
    avatar: AvatarConfig,
    grade: string,
    interests: string[],
    dailyGoalXP: number
  ) => {
    const { user, profile } = get();
    if (!user) throw new Error('No authenticated user found');

    try {
      set({ isLoading: true, error: null });

      const newStudentProfile: ProfileDocument = {
        nickname,
        avatar,
        grade,
        interests,
        dailyGoalXP,
        totalXP: 0,
        level: 1,
        coins: 10,
        energy: 100,
        streakCount: 1,
        lastStreakActiveDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      };

      // Try saving to Firestore if available
      try {
        const userRef = doc(db, 'users', user.uid);
        const profileRef = doc(db, 'profiles', user.uid);
        
        await setDoc(profileRef, {
          ...newStudentProfile,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(userRef, {
          email: user.email || '',
          role: 'student',
          isOnboarded: true,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore write in completeOnboarding:', err);
      }

      const updatedUserProfile: UserProfile = {
        ...(profile || {
          email: user.email || '',
          role: 'student',
          settings: {
            notificationsEnabled: true,
            voiceEnabled: true,
            soundEnabled: true,
            hapticEnabled: true,
          },
          createdAt: new Date().toISOString(),
        }),
        isOnboarded: true,
      };

      set({
        profile: updatedUserProfile,
        studentProfile: newStudentProfile,
        isLoading: false,
      });

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          profile: updatedUserProfile,
          studentProfile: newStudentProfile,
        })
      );
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      const message = error.message || 'Failed to complete onboarding';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateStudentProfile: async (updates: Partial<ProfileDocument>) => {
    const { user, profile, studentProfile } = get();
    if (!user || !studentProfile) return;

    const newStudentProfile: ProfileDocument = {
      ...studentProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    set({ studentProfile: newStudentProfile });

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore update skipped (local dev session):', err);
    }

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user,
        profile,
        studentProfile: newStudentProfile,
      })
    );
  },

  clearError: () => set({ error: null }),
}));

/** Maps Firebase Auth error codes to child-friendly messages */
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in!';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Try again!';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'No internet connection. Check your network and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
