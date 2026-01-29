import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBXoXYHj-dp1qUgwCjQIBRBOCI9814fHGM",
    authDomain: "napkin-scribble.firebaseapp.com",
    projectId: "napkin-scribble",
    storageBucket: "napkin-scribble.firebasestorage.app",
    messagingSenderId: "871255866744",
    appId: "1:871255866744:web:d50aef8123f2fbb250dc8d",
    measurementId: "G-6F29J1670H"
};

// Initialize Firebase once
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
