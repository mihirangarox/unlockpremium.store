import { db } from '../src/admin/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function debugAccounting() {
  try {
    console.log("--- RENEWAL HISTORY ---");
    const hSnap = await getDocs(collection(db, "renewal_history"));
    hSnap.forEach(doc => {
      const data = doc.data();
      console.log(`History ID: ${doc.id}, subId: ${data.subscriptionId}, reqId: ${data.requestId}, amount: ${data.amount}, cost: ${data.cost}`);
    });

    console.log("\n--- LIVE STOCK (Assigned) ---");
    const sSnap = await getDocs(collection(db, "live_stock"));
    sSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Assigned') {
        console.log(`Stock ID: ${doc.id}, assignedToSub: ${data.assignedToSubscriptionId}, assignedToReq: ${data.assignedToRequestId}, gbpCost: ${data.gbpPurchaseCost}`);
      }
    });
  } catch (err) {
    console.log("Error during debug:");
    console.log(err);
  }
}

debugAccounting().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
