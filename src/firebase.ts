// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBXoXYHj-dp1qUgwCjQIBRBOCI9814fHGM",
    authDomain: "napkin-scribble.firebaseapp.com",
    projectId: "napkin-scribble",
    storageBucket: "napkin-scribble.firebasestorage.app",
    messagingSenderId: "871255866744",
    appId: "1:871255866744:web:d50aef8123f2fbb250dc8d",
    measurementId: "G-6F29J1670H"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);