// context/AuthContext.js
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password, name) => {
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    // ✅ Create user doc in Firestore immediately
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      points: 0,
    });

    // ✅ Send email verification
    await sendEmailVerification(cred.user);

    await signOut(auth); // prevent auto-login before verification

    return { success: true, message: "Verification email sent. Please verify before logging in." };
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      throw new Error("Email not verified. Please check your inbox.");
    }
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resendVerificationEmail = async (user) => {
    if (!user) throw new Error("No user to resend verification email.");
    await sendEmailVerification(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
