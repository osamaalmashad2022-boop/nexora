/* ==========================================
   firebase-config.js
   Firebase initialization and exports via CDN
   ========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } 
  from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } 
  from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoEqpZ-VGeI-aeBPM73ezkp7Dd5ZZh8ek",
  authDomain: "nexora-dc0e9.firebaseapp.com",
  projectId: "nexora-dc0e9",
  storageBucket: "nexora-dc0e9.firebasestorage.app",
  messagingSenderId: "890522172809",
  appId: "1:890522172809:web:c13badd2907d579c397558",
  measurementId: "G-7RFSRWCHV2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs
};
