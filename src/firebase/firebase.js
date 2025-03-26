// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCROsbwnyiUjYSuAmdTq6NfuUX7NakhOko",
  authDomain: "equipment-rental-system-838f0.firebaseapp.com",
  projectId: "equipment-rental-system-838f0",
  storageBucket: "equipment-rental-system-838f0.firebasestorage.app",
  messagingSenderId: "71958410034",
  appId: "1:71958410034:web:274a6798aa9d7ec5805d2b"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  hd: "khu.ac.kr"
});

export { auth, signInWithPopup, provider };
export const storage = getStorage(app);
