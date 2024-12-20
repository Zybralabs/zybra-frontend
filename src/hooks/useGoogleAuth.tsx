import { useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "@/firebase";
import { useUserAccount } from "@/context/UserAccountContext";


export const useSocialAuth = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { signUp, signIn, address } = useUserAccount();

  // Sync user with the backend
  const syncUserWithBackend = async (firebaseUser, isSignUp = false) => {
    try {
      const { displayName, email } = firebaseUser;

      if (isSignUp) {
        await signUp(email, undefined,displayName || "Anonymous", "", address, 'social');
      } else {
        await signIn(email, "");
      }

      console.log("User synced with backend successfully.");
    } catch (err) {
      console.error("Error syncing user with backend:", err);
      throw new Error("Failed to sync user with backend");
    }
  };

  // Google Sign-In
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      setFirebaseUser(result.user);
      await syncUserWithBackend(result.user, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apple Sign-In
  const signInWithApple = useCallback(async () => {
    const provider = new OAuthProvider("apple.com");
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      setFirebaseUser(result.user);
      await syncUserWithBackend(result.user, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign Out
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setFirebaseUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        await syncUserWithBackend(firebaseUser);
      } else {
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user: firebaseUser,
    loading,
    error,
    signInWithGoogle,
    signInWithApple,
    logout,
  };
};
