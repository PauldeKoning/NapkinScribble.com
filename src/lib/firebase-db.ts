import { getFirestore } from "firebase/firestore";
import { app } from "./firebase-auth";

// Initialize Firestore lazily
export const db = getFirestore(app);
