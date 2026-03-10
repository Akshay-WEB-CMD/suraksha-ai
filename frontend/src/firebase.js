import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCCuQgFI6hWm4VdAoEQa2capDkpJa9MuQc",
  authDomain: "suraksha-ai-8b81e.firebaseapp.com",
  projectId: "suraksha-ai-8b81e",
  storageBucket: "suraksha-ai-8b81e.firebasestorage.app",
  messagingSenderId: "456972761874",
  appId: "1:456972761874:web:4766a401c387caa14491cb",
  measurementId: "G-1VDLKKVRZ7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
