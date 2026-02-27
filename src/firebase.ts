// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbnapJyBz6z3JedPYnd1h0zv3AOPwZVAY",
  authDomain: "unlockpremium-372c9.firebaseapp.com",
  projectId: "unlockpremium-372c9",
  storageBucket: "unlockpremium-372c9.firebasestorage.app",
  messagingSenderId: "43727770212",
  appId: "1:43727770212:web:e691754175370fbe08c571",
  measurementId: "G-186HM7Y7F7"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Analytics
export const getAppAnalytics = async () => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getAnalytics(app);
};

export { app, auth };
