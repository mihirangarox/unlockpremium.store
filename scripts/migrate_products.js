/**
 * One-time migration: sets isActive + acceptsPreOrders on all product docs
 * Run with: node scripts/migrate_products.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrate() {
  const snap = await db.collection('products').get();
  if (snap.empty) { console.log('No products found.'); return; }

  const batch = db.batch();
  let count = 0;

  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const updates = {};
    if (data.isActive === undefined) { updates.isActive = true; count++; }
    if (data.acceptsPreOrders === undefined) { updates.acceptsPreOrders = true; }
    if (Object.keys(updates).length > 0) {
      batch.update(docSnap.ref, updates);
    }
  });

  await batch.commit();
  console.log(`✅ Migration complete. Updated ${count} product(s) with isActive/acceptsPreOrders.`);
}

migrate().catch(console.error);
