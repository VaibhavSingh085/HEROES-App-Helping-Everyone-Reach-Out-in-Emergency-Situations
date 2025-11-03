// firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-Hm59jiImI1DqQ-xIacy53knIHB5viEA",
  authDomain: "heroes-app-26d14.firebaseapp.com",
  projectId: "heroes-app-26d14",
  storageBucket: "heroes-app-26d14.appspot.com",  // ⚠️ fix: must end with .appspot.com
  messagingSenderId: "1075076645391",
  appId: "1:1075076645391:web:2ffdfa4a142782a448997a",
  measurementId: "G-Y21JN67M7R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app); // uncomment if needed

export default app;
