import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD71UM8Xlc-PJRkdD873CckIIynsYqFE9o",
  authDomain: "crmsync-43aea.firebaseapp.com",
  projectId: "crmsync-43aea",
  storageBucket: "crmsync-43aea.firebasestorage.app",
  messagingSenderId: "516687285759",
  appId: "1:516687285759:web:dfefe35cf8c3e81fa2ebca"
};

const app = getApps().find(app => app.name === "admin-app") 
  ? getApp("admin-app") 
  : initializeApp(firebaseConfig, "admin-app");

export const db = getFirestore(app);
