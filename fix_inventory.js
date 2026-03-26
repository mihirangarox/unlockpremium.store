
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, updateDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbnapJyBz6z3JedPYnd1h0zv3AOPwZVAY",
  authDomain: "unlockpremium-372c9.firebaseapp.com",
  projectId: "unlockpremium-372c9",
  storageBucket: "unlockpremium-372c9.firebasestorage.app",
  messagingSenderId: "43727770212",
  appId: "1:43727770212:web:e691754175370fbe08c571",
  measurementId: "G-186HM7Y7F7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixInventory() {
  console.log("Fetching products...");
  const productsSnap = await getDocs(collection(db, "products"));
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const careerProduct = products.find(p => p.name === "Linkedin Premium Career");
  if (!careerProduct) {
    console.log("Could not find Linkedin Premium Career product.");
    return;
  }
  
  console.log(`Found Career Product ID: ${careerProduct.id}`);
  
  console.log("Counting available codes in live_stock...");
  const stockQuery = query(
    collection(db, "live_stock"), 
    where("productId", "==", careerProduct.id),
    where("status", "==", "Available")
  );
  const stockSnap = await getDocs(stockQuery);
  const actualCount = stockSnap.size;
  
  console.log(`Actual available codes: ${actualCount}`);
  
  console.log("Checking current inventory document...");
  const invRef = doc(db, "inventory", careerProduct.id);
  const invSnap = await getDoc(invRef);
  
  if (invSnap.exists()) {
    const currentData = invSnap.data();
    console.log(`Current stockCount in inventory: ${currentData.stockCount}`);
    
    if (currentData.stockCount !== actualCount) {
      console.log(`Syncing stockCount to ${actualCount}...`);
      await updateDoc(invRef, { stockCount: actualCount });
      console.log("Sync complete.");
    } else {
      console.log("Inventory is already in sync.");
    }
  } else {
    console.log("Inventory document does not exist for this product. Creating it...");
    await setDoc(invRef, { 
      id: careerProduct.id, 
      stockCount: actualCount, 
      lowStockThreshold: 5, 
      costPrice: (careerProduct.price || 0) * 0.5 
    });
    console.log("Created inventory document.");
  }
}

fixInventory().catch(console.error);
