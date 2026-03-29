/**
 * db.ts — Async Firestore service
 * Connects to the main Firebase project for all data collections.
 * All methods return Promises and operate on Firestore documents.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Customer,
  Subscription,
  Reminder,
  RenewalHistory,
  ActivityLog,
  IntakeRequest,
  Product,
  Post,
  Testimonial,
  Vendor,
  InventoryLog,
  DigitalCode,
  USDTTransaction
} from "../types/index";

// ─── Products ───────────────────────────────────────────────────────────────

export const getProducts = async (): Promise<Product[]> => {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map(d => d.data() as Product);
};

export const getProduct = async (id: string): Promise<Product | undefined> => {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? (snap.data() as Product) : undefined;
};

export const saveProduct = async (product: Product): Promise<void> => {
  await setDoc(doc(db, "products", product.id), product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "products", id));
};

// ─── Customers ───────────────────────────────────────────────────────────────

export const getCustomers = async (): Promise<Customer[]> => {
  const snap = await getDocs(query(collection(db, "customers"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => d.data() as Customer);
};

export const getCustomer = async (id: string): Promise<Customer | undefined> => {
  const snap = await getDoc(doc(db, "customers", id));
  return snap.exists() ? (snap.data() as Customer) : undefined;
};

export const saveCustomer = async (customer: Customer): Promise<void> => {
  await setDoc(doc(db, "customers", customer.id), customer);
};

export const findCustomerByIdentity = async (whatsapp?: string, email?: string): Promise<Customer | undefined> => {
  if (!whatsapp && !email) return undefined;
  
  // Try WhatsApp first
  if (whatsapp) {
    const q = query(collection(db, "customers"), where("whatsappNumber", "==", whatsapp), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as Customer;
  }
  
  // Then try Email
  if (email) {
    const q = query(collection(db, "customers"), where("email", "==", email), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as Customer;
  }
  
  return undefined;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const batch = writeBatch(db);

  // Delete customer document
  batch.delete(doc(db, "customers", id));

  // Delete related subscriptions
  const subsSnap = await getDocs(query(collection(db, "subscriptions"), where("customerId", "==", id)));
  subsSnap.docs.forEach(d => batch.delete(d.ref));

  // Delete related reminders
  const remSnap = await getDocs(query(collection(db, "reminders"), where("customerId", "==", id)));
  remSnap.docs.forEach(d => batch.delete(d.ref));

  // Delete related renewal history
  const histSnap = await getDocs(query(collection(db, "renewal_history"), where("customerId", "==", id)));
  histSnap.docs.forEach(d => batch.delete(d.ref));

  // Delete related activity logs
  const logSnap = await getDocs(query(collection(db, "activity_logs"), where("customerId", "==", id)));
  logSnap.docs.forEach(d => batch.delete(d.ref));

  await batch.commit();
};

/**
 * Merges two customer profiles. 
 * Moves all subscriptions, requests, and history from sourceId to targetId.
 */
export const mergeCustomers = async (sourceId: string, targetId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // 1. Get all subscriptions for source
  const subs = await getCustomerSubscriptions(sourceId);
  subs.forEach(sub => {
    batch.update(doc(db, "subscriptions", sub.id), { customerId: targetId });
  });

  // 2. Get all renewal history for source
  const historySnap = await getDocs(
    query(collection(db, "renewal_history"), where("customerId", "==", sourceId))
  );
  historySnap.docs.forEach(d => {
    batch.update(doc(db, "renewal_history", d.id), { customerId: targetId });
  });

  // 3. Move activity logs
  const logsSnap = await getDocs(
    query(collection(db, "activity_logs"), where("customerId", "==", sourceId))
  );
  logsSnap.docs.forEach(d => {
    batch.update(doc(db, "activity_logs", d.id), { customerId: targetId });
  });

  // 4. Delete the source customer
  batch.delete(doc(db, "customers", sourceId));
  
  await batch.commit();

  // 5. Update the target customer's order count
  await updateCustomerOrderCount(targetId);
};

export const getSubscriptions = async (): Promise<Subscription[]> => {
  const snap = await getDocs(collection(db, "subscriptions"));
  return snap.docs.map(d => d.data() as Subscription);
};

export const getSubscription = async (id: string): Promise<Subscription | undefined> => {
  const snap = await getDoc(doc(db, "subscriptions", id));
  return snap.exists() ? (snap.data() as Subscription) : undefined;
};

export const getCustomerSubscriptions = async (customerId: string): Promise<Subscription[]> => {
  const snap = await getDocs(query(collection(db, "subscriptions"), where("customerId", "==", customerId)));
  return snap.docs.map(d => d.data() as Subscription);
};

export const saveSubscription = async (subscription: Subscription): Promise<void> => {
  await setDoc(doc(db, "subscriptions", subscription.id), subscription);
};

export const deleteSubscription = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "subscriptions", id));
};

// ─── Reminders ────────────────────────────────────────────────────────────────

export const getReminders = async (): Promise<Reminder[]> => {
  const snap = await getDocs(collection(db, "reminders"));
  return snap.docs.map(d => d.data() as Reminder);
};

export const saveReminder = async (reminder: Reminder): Promise<void> => {
  await setDoc(doc(db, "reminders", reminder.id), reminder);
};

export const deleteReminder = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "reminders", id));
};

// ─── Renewal History ──────────────────────────────────────────────────────────

export const getRenewalHistory = async (): Promise<RenewalHistory[]> => {
  const snap = await getDocs(query(collection(db, "renewal_history"), orderBy("renewedOn", "desc")));
  return snap.docs.map(d => d.data() as RenewalHistory);
};

export const saveRenewalHistory = async (history: RenewalHistory): Promise<void> => {
  await setDoc(doc(db, "renewal_history", history.id), history);
};

export const logTransaction = async (subscription: Subscription): Promise<void> => {
  // Check if a transaction for this subscription already exists on the same start date
  const snap = await getDocs(
    query(collection(db, "renewal_history"), where("subscriptionId", "==", subscription.id))
  );
  const subDate = new Date(subscription.startDate).toISOString().split("T")[0];
  const exists = snap.docs.some(
    d => new Date((d.data() as RenewalHistory).renewedOn).toISOString().split("T")[0] === subDate
  );

  if (!exists) {
    const history: RenewalHistory = {
      id: `h_${Date.now()}`,
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      oldPlan: subscription.planDuration,
      newPlan: subscription.planDuration,
      amount: subscription.price,
      renewedOn: subscription.startDate,
      paymentMethod: "Other",
      notes: `Initial subscription: ${subscription.subscriptionType ?? ""}`,
      createdAt: new Date().toISOString(),
    };
    await saveRenewalHistory(history);
  }
};

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  const snap = await getDocs(collection(db, "activity_logs"));
  return snap.docs.map(d => d.data() as ActivityLog);
};

export const logActivity = async (log: ActivityLog): Promise<void> => {
  await setDoc(doc(db, "activity_logs", log.id), log);
};

// ─── Analytics Helpers ────────────────────────────────────────────────────────

export const getCustomerValue = async (customerId: string): Promise<number> => {
  const snap = await getDocs(
    query(collection(db, "renewal_history"), where("customerId", "==", customerId))
  );
  return snap.docs.reduce((sum, d) => sum + (d.data() as RenewalHistory).amount, 0);
};

/**
 * Updates the order count for a customer by checking all subscriptions.
 */
export const updateCustomerOrderCount = async (customerId: string): Promise<number> => {
  const subs = await getCustomerSubscriptions(customerId);
  const count = subs.length;
  await setDoc(doc(db, "customers", customerId), { orderCount: count }, { merge: true });
  return count;
};

// ─── Requests (Intake) ────────────────────────────────────────────────────────

export const getRequests = async (): Promise<IntakeRequest[]> => {
  const snap = await getDocs(query(collection(db, "requests"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => d.data() as IntakeRequest);
};

export const getRequestsByContact = async (whatsapp?: string, email?: string): Promise<IntakeRequest[]> => {
  if (!whatsapp && !email) return [];
  const all = await getRequests();
  return all.filter(r => 
    (whatsapp && r.whatsappNumber === whatsapp) || 
    (email && r.email === email)
  );
};

export const getRequest = async (id: string): Promise<IntakeRequest | undefined> => {
  const snap = await getDoc(doc(db, "requests", id));
  return snap.exists() ? (snap.data() as IntakeRequest) : undefined;
};

export const saveRequest = async (request: IntakeRequest): Promise<void> => {
  await setDoc(doc(db, "requests", request.id), request);
};

export const deleteRequest = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "requests", id));
};

// ─── Posts ──────────────────────────────────────────────────────────────────

export const getPosts = async (): Promise<Post[]> => {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => d.data() as Post);
};

export const getPost = async (id: string): Promise<Post | undefined> => {
  const snap = await getDoc(doc(db, "posts", id));
  return snap.exists() ? (snap.data() as Post) : undefined;
};

export const getPostBySlug = async (slug: string): Promise<Post | undefined> => {
  const q = query(collection(db, "posts"), where("slug", "==", slug));
  const snap = await getDocs(q);
  return !snap.empty ? (snap.docs[0].data() as Post) : undefined;
};

export const savePost = async (post: Post): Promise<void> => {
  await setDoc(doc(db, "posts", post.id), {
    ...post,
    updatedAt: new Date().toISOString()
  });
};

export const deletePost = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "posts", id));
};

// ─── Testimonials ────────────────────────────────────────────────────────────

export const getTestimonials = async (): Promise<Testimonial[]> => {
  const snap = await getDocs(query(collection(db, "testimonials"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => d.data() as Testimonial);
};

export const saveTestimonial = async (testimonial: Testimonial): Promise<void> => {
  await setDoc(doc(db, "testimonials", testimonial.id), testimonial);
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "testimonials", id));
};

// ─── Finance (USDT) ──────────────────────────────────────────────────────────

export const getUSDTTransactions = async (): Promise<USDTTransaction[]> => {
  const snap = await getDocs(query(collection(db, "usdt_transactions"), orderBy("date", "desc")));
  return snap.docs.map(d => d.data() as USDTTransaction);
};

export const saveUSDTTransaction = async (transaction: USDTTransaction): Promise<void> => {
  // Ensure FIFO fields are initialized for Inbound
  const tx = { ...transaction };
  if (tx.type === 'Inbound' && tx.remainingAmount === undefined) {
    tx.remainingAmount = tx.amount;
    tx.gbpTotalSpent = tx.amount * tx.usdtRate;
    tx.isFullyUtilized = false;
  }
  if (tx.createdAt === undefined) {
    tx.createdAt = new Date().toISOString();
  }
  await setDoc(doc(db, "usdt_transactions", tx.id), tx);
};

export const deleteUSDTTransaction = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "usdt_transactions", id));
};

/**
 * Gets unspent USDT batches in FIFO order (oldest first).
 */
export const getAvailableUSDTBatches = async (): Promise<USDTTransaction[]> => {
  // Fetch all to avoid complex composite index requirements
  const snap = await getDocs(collection(db, "usdt_transactions"));
  const all = snap.docs.map(d => d.data() as USDTTransaction);
  
  return all
    .filter(tx => 
      tx.type === 'Inbound' && 
      tx.isFullyUtilized === false && 
      tx.status === 'Completed'
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Gets the most recent USDT exchange rate from Inbound transactions.
 */
export const getLatestUSDTRate = async (): Promise<number> => {
  const transactions = await getUSDTTransactions();
  const inbound = transactions
    .filter(tx => tx.type === 'Inbound' && tx.status === 'Completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  return inbound.length > 0 ? inbound[0].usdtRate : 0.78; // Fallback to standard rate if none found
};

/**
 * Consumes USDT from available batches using FIFO logic.
 * Returns an array of allocations showing which batches were used and at what rate.
 */
export const consumeUSDT = async (totalAmount: number, note: string): Promise<{batchId: string, amount: number, rate: number}[]> => {
  const batches = await getAvailableUSDTBatches();
  let remainingToConsume = totalAmount;
  const allocations: {batchId: string, amount: number, rate: number}[] = [];
  
  const batch = writeBatch(db);
  
  for (const utx of batches) {
    if (remainingToConsume <= 0) break;
    
    const availableInBatch = utx.remainingAmount;
    const toConsumeFromThisBatch = Math.min(availableInBatch, remainingToConsume);
    
    allocations.push({
      batchId: utx.id,
      amount: toConsumeFromThisBatch,
      rate: utx.usdtRate
    });
    
    const updatedRemaining = availableInBatch - toConsumeFromThisBatch;
    batch.update(doc(db, "usdt_transactions", utx.id), {
      remainingAmount: updatedRemaining,
      isFullyUtilized: updatedRemaining <= 0.001 // Floating point safety
    });
    
    // Create an individual Outbound transaction for this specific batch allocation
    const outboundTx: USDTTransaction = {
      id: `out_${Date.now()}_${utx.id}`,
      type: 'Outbound',
      amount: toConsumeFromThisBatch,
      usdtRate: utx.usdtRate, // Record the rate of the source batch
      parentId: utx.id, // Link to the parent batch
      remainingAmount: 0,
      gbpTotalSpent: toConsumeFromThisBatch * utx.usdtRate,
      date: new Date().toISOString(),
      note: note,
      status: 'Completed',
      isFullyUtilized: true,
      createdAt: new Date().toISOString()
    };
    batch.set(doc(db, "usdt_transactions", outboundTx.id), outboundTx);
    
    remainingToConsume -= toConsumeFromThisBatch;
  }
  
  if (remainingToConsume > 0.001) {
    throw new Error(`Insufficient USDT balance. Missing: ${remainingToConsume.toFixed(2)} USDT`);
  }
  
  await batch.commit();
  return allocations;
};

// ─── Inventory ───────────────────────────────────────────────────────────────

export const getInventoryItems = async (): Promise<any[]> => {
  const snap = await getDocs(collection(db, "inventory"));
  return snap.docs.map(d => d.data());
};

export const saveInventoryItem = async (item: any): Promise<void> => {
  await setDoc(doc(db, "inventory", item.id), item);
};

// ─── Vendors ─────────────────────────────────────────────────────────────────

export const getVendors = async (): Promise<Vendor[]> => {
  const snap = await getDocs(query(collection(db, "vendors"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => d.data() as Vendor);
};

export const saveVendor = async (vendor: Vendor): Promise<void> => {
  await setDoc(doc(db, "vendors", vendor.id), vendor);
};

export const deleteVendor = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "vendors", id));
};

// ─── Inventory Logs ──────────────────────────────────────────────────────────

export const getInventoryLogs = async (productId?: string): Promise<InventoryLog[]> => {
  const coll = collection(db, "inventory_logs");
  const q = productId 
    ? query(coll, where("productId", "==", productId), orderBy("date", "desc"))
    : query(coll, orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as InventoryLog);
};

export const saveInventoryLog = async (log: InventoryLog): Promise<void> => {
  await setDoc(doc(db, "inventory_logs", log.id), log);
};

// ─── Live Stock ─────────────────────────────────────────────────────────────

export const getLiveStock = async (): Promise<DigitalCode[]> => {
  const snap = await getDocs(query(collection(db, "live_stock"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => d.data() as DigitalCode);
};

export const getCustomerDigitalCodes = async (whatsapp?: string, email?: string): Promise<DigitalCode[]> => {
  const requests = await getRequestsByContact(whatsapp, email);
  const requestIds = requests.map(r => r.id);
  
  if (requestIds.length === 0) return [];
  
  const allCodes = await getLiveStock();
  return allCodes.filter(c => c.assignedToRequestId && requestIds.includes(c.assignedToRequestId));
};

export const getAvailableLiveStock = async (): Promise<DigitalCode[]> => {
  const snap = await getDocs(
    query(collection(db, "live_stock"), where("status", "==", "Available"))
  );
  return snap.docs.map(d => d.data() as DigitalCode);
};

export const saveLiveStockBatch = async (codes: DigitalCode[]): Promise<void> => {
  const batch = writeBatch(db);
  codes.forEach(code => {
    batch.set(doc(db, "live_stock", code.id), code);
  });
  await batch.commit();
};

export const deleteLiveStockCode = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "live_stock", id));
};

export const updateLiveStockCode = async (id: string, updates: Partial<DigitalCode>): Promise<void> => {
  await setDoc(doc(db, "live_stock", id), updates, { merge: true });
};

export const updateLiveStockStatus = async (id: string, status: 'Available' | 'Assigned' | 'Expired', subscriptionId?: string): Promise<void> => {
  await setDoc(doc(db, "live_stock", id), { 
    status, 
    assignedToSubscriptionId: subscriptionId || null,
    assignedAt: status === 'Assigned' ? new Date().toISOString() : null
  }, { merge: true });
};

export const getAvailableCodesCount = async (productId?: string): Promise<number> => {
  const coll = collection(db, "live_stock");
  const q = productId 
    ? query(coll, where("productId", "==", productId), where("status", "==", "Available"))
    : query(coll, where("status", "==", "Available"));
  const snap = await getDocs(q);
  return snap.size;
};

/**
 * Claims an available digital code for a specific request.
 * Returns the code string if successful, or null if no codes available.
 */
export const claimCodeForRequest = async (
  productIdOrType: string, 
  duration: string, 
  requestId: string
): Promise<string | null> => {
  // 1. Try to find by direct productId first
  let q = query(
    collection(db, "live_stock"),
    where("productId", "==", productIdOrType),
    where("duration", "==", duration),
    where("status", "==", "Available"),
    limit(1)
  );
  
  let snap = await getDocs(q);
  
  // 2. If not found, try finding product by subscriptionType first
  if (snap.empty) {
    const products = await getProducts();
    const product = products.find(p => p.subscriptionType === productIdOrType);
    if (product) {
      q = query(
        collection(db, "live_stock"),
        where("productId", "==", product.id),
        where("duration", "==", duration),
        where("status", "==", "Available"),
        limit(1)
      );
      snap = await getDocs(q);
    }
  }

  // 3. Last resort: try matching by productName directly (legacy or loose matching)
  if (snap.empty) {
     q = query(
      collection(db, "live_stock"),
      where("productName", "==", productIdOrType),
      where("duration", "==", duration),
      where("status", "==", "Available"),
      limit(1)
    );
    snap = await getDocs(q);
  }

  if (snap.empty) return null;
  
  const codeDoc = snap.docs[0];
  const codeData = codeDoc.data() as DigitalCode;
  
  const updatedCode: DigitalCode = {
    ...codeData,
    status: 'Assigned',
    assignedToRequestId: requestId,
    assignedAt: new Date().toISOString()
  };
  
  const batch = writeBatch(db);
  batch.set(codeDoc.ref, updatedCode);

  // Deduct from general inventory if applicable
  const inventoryRef = doc(db, "inventory", codeData.productId);
  const inventorySnap = await getDoc(inventoryRef);
  if (inventorySnap.exists()) {
    const invData = inventorySnap.data();
    if (invData.stockCount > 0) {
      batch.update(inventoryRef, { stockCount: invData.stockCount - 1 });
    }
  }

  await batch.commit();

  return updatedCode.code;
};

/**
 * Recalculates and updates the summary inventory collection based on live_stock data.
 * This ensures that other parts of the system (like the storefront) have accurate counts.
 */
export const syncInventoryFromLiveStock = async (productId: string): Promise<void> => {
  const q = query(
    collection(db, "live_stock"),
    where("productId", "==", productId),
    where("status", "==", "Available")
  );
  const snap = await getDocs(q);
  const count = snap.size;
  const totalCost = snap.docs.reduce((sum, d) => sum + ((d.data() as DigitalCode).costBasisUSDT || 0), 0);
  const avgCost = count > 0 ? totalCost / count : 0;

  const inventoryRef = doc(db, "inventory", productId);
  await setDoc(inventoryRef, {
    id: productId,
    stockCount: count,
    costPrice: avgCost,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};
