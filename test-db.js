import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('.firebaserc', 'utf8')); // Wait, .firebaserc doesn't have the apiKey.
