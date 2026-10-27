// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIwIFbBStEo74cWx6oBsc-8AxKLq1JzeE",
  authDomain: "orbix-7426b.firebaseapp.com",
  projectId: "orbix-7426b",
  storageBucket: "orbix-7426b.firebasestorage.app",
  messagingSenderId: "1026511371281",
  appId: "1:1026511371281:web:636164d0086eb7db0385b0",
  measurementId: "G-E0MVMHTEQS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);