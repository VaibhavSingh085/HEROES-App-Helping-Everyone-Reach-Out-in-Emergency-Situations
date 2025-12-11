// context/AuthContext.js
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase Auth User
  const [userDoc, setUserDoc] = useState(null); // Firestore user document
  const [loading, setLoading] = useState(true);

  // -------------------------------
  // LISTEN FOR AUTH STATE CHANGES
  // -------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // -------------------------------
  // LOAD USER FIRESTORE DOCUMENT
  // -------------------------------
  useEffect(() => {
    if (!user?.uid) {
      setUserDoc(null);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    // Real-time listener for user’s Firestore doc
    const unsub = onSnapshot(userRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setUserDoc(data);

      // ✔ AUTOMATICALLY AWARD VERIFIED USERS IF NOT AWARDED BEFORE
      if (data.isVerified === true && data.verificationAwarded !== true) {
        try {
          await updateDoc(userRef, {
            points: increment(100),
            verificationAwarded: true,
            notifications: arrayUnion({
              message: "🎖️ You are now a Verified Professional! (+100 points)",
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error("Error awarding verification points:", err);
        }
      }
    });

    return () => unsub();
  }, [user]);

  // ------------------------------------------------------------------------
  // LISTEN FOR VERIFICATION REQUEST STATUS UPDATES (approved/rejected)
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!user?.uid) return;

    const reqQuery = query(
      collection(db, "verificationRequests"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(reqQuery, async (snapshot) => {
      if (snapshot.empty) return;

      const reqDoc = snapshot.docs[0];
      const request = reqDoc.data();
      const requestRef = reqDoc.ref;
      const userRef = doc(db, "users", user.uid);

      // --------------------------------------------------
      // IF APPROVED BY ADMIN
      // --------------------------------------------------
      if (request.status === "approved") {
        try {
          await updateDoc(userRef, {
            isVerified: true,
            notifications: arrayUnion({
              message: "🎉 Your verification request was approved!",
              timestamp: new Date().toISOString(),
            }),
          });

          // Remove request after processing
          await deleteDoc(requestRef);
        } catch (err) {
          console.error("Error approving verification:", err);
        }
      }

      // --------------------------------------------------
      // IF REJECTED BY ADMIN
      // --------------------------------------------------
      if (request.status === "rejected") {
        try {
          await updateDoc(userRef, {
            notifications: arrayUnion({
              message: "❌ Your verification request was rejected.",
              timestamp: new Date().toISOString(),
            }),
          });

          // Remove request after processing
          await deleteDoc(requestRef);
        } catch (err) {
          console.error("Error rejecting verification:", err);
        }
      }
    });

    return () => unsub();
  }, [user]);

  // -------------------------------
  // SIGNUP
  // -------------------------------
  const signup = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (name) await updateProfile(cred.user, { displayName: name });

    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      points: 0,
      isVerified: false,
      verificationAwarded: false,
      notifications: [],
    });

    await sendEmailVerification(cred.user);
    await signOut(auth);

    return { success: true, message: "Email verification sent." };
  };

  // -------------------------------
  // LOGIN
  // -------------------------------
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      throw new Error("Email not verified.");
    }
    return cred.user;
  };

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserDoc(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
