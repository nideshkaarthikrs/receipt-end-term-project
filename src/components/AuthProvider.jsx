import { createContext, useCallback, useEffect, useReducer } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase.js';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'AUTH_RESOLVED':
      return { user: action.user, loading: false, error: null };
    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

async function ensureUserDoc(user) {
  if (!user) return;
  await setDoc(
    doc(db, 'users', user.uid),
    {
      display_name: user.displayName ?? '',
      email: user.email ?? '',
      created_at: serverTimestamp(),
    },
    { merge: true },
  );
}

export default function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: 'AUTH_RESOLVED', user });
    });
    return unsubscribe;
  }, []);

  const signInEmail = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error.message });
      throw error;
    }
  }, []);

  const signUpEmail = useCallback(async (email, password, displayName) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      await ensureUserDoc(credential.user);
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error.message });
      throw error;
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(credential.user);
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error.message });
      throw error;
    }
  }, []);

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  const clearError = useCallback(() => dispatch({ type: 'AUTH_CLEAR_ERROR' }), []);

  const value = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signInEmail,
    signUpEmail,
    signInGoogle,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
