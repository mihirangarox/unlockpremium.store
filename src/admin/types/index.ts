export type CustomerStatus = 'New' | 'Active' | 'In Follow-up' | 'Inactive';
export type SubscriptionStatus = 'Active' | 'Reserved' | 'Due Soon' | 'Due Today' | 'Expired' | 'Renewed' | 'Cancelled';
export type ReminderStatus = 'Pending' | 'Scheduled' | 'Sent' | 'Failed' | 'Skipped' | 'Manual Approval';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Archived' | 'Spam' | 'Lead';
export type PlanDuration = '1M' | '2M' | '3M' | '4M' | '6M' | '9M' | '12M';
export type AutoSendMode = 'ON' | 'OFF' | 'Manual Approval';

// ─── B2B Bulk Order Types ─────────────────────────────────────────────────────

export type BulkOrderStatus = 'Pending' | 'Active' | 'Partially Active' | 'Completed' | 'Cancelled';

/**
 * Top-level B2B order document. Represents a Manager purchasing multiple licenses.
 * Stored in the `bulk_orders` collection.
 */
export interface BulkOrder {
  id: string;

  // Manager identity (linked to an existing Customer record)
  managerId: string;         // → customers.id
  managerName: string;       // Denormalized for quick display
  managerEmail: string;      // Denormalized for quick display
  managerWhatsapp?: string;  // For delivery communications

  // Product details
  productId: string;
  productName: string;
  planDuration: PlanDuration;

  // Seat counts
  totalLicenses: number;
  activatedLicenses: number; // Incremented as each seat goes Active

  // Pricing — per-license defaults (can be overridden per seat)
  salePrice: number;         // Price per license charged to the Manager (GBP)
  usdtCost: number;          // Our cost per license from supplier (USDT)

  // Aggregate financials (kept denormalized for fast reporting)
  totalRevenue: number;      // salePrice × totalLicenses
  totalCost: number;         // costPrice × totalLicenses
  totalProfit: number;       // totalRevenue − totalCost

  // Payment
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  currency?: string;

  // Status
  status: BulkOrderStatus;

  notes?: string;
  internalNotes?: string;    // Admin-only

  // Shared dates for the bulk order
  startDate?: string;
  renewalDate?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * One seat (rep license) under a BulkOrder.
 * Stored in the `bulk_order_seats` collection.
 * Each seat maps 1-to-1 to a Subscription once activated.
 */
export interface BulkOrderSeat {
  id: string;
  bulkOrderId: string;       // → bulk_orders.id
  managerId: string;         // → customers.id (the Manager) — denormalized for queries

  // Rep identity (no Customer record required until activation)
  repName?: string;
  repEmail: string;          // The LinkedIn account email for this seat
  repLinkedinUrl?: string;

  // Per-seat pricing overrides (falls back to BulkOrder defaults if absent)
  salePrice?: number;
  usdtCost?: number;

  // Fulfillment links — set when the admin activates this seat
  subscriptionId?: string;   // → subscriptions.id
  codeId?: string;           // → live_stock.id
  activationCode?: string;   // The actual LinkedIn referral link string

  // Dates — each seat has its own staggered renewal schedule
  startDate?: string;        // ISO
  renewalDate?: string;      // ISO

  status: 'Pending' | 'Active' | 'Paused' | 'Expired' | 'Cancelled';

  deliveredAt?: string;      // ISO — set when link is sent to rep
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface CustomerNote {
  id: string;
  date: string;
  text: string;
}

export interface Customer {
  id: string;
  fullName: string;
  whatsappNumber: string;
  email: string;
  linkedinUrl: string;
  country: string;
  leadSource: string;
  notes: string | CustomerNote[]; // Historical notes/activity
  internalNotes?: string; // Admin-only private notes
  discountTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  fixedPrice?: number; // Special locked price for loyal customers
  orderCount?: number; // Cached count for performance
  reminderPreferences?: {
    days: number[];
    channel: 'WhatsApp' | 'Email' | 'SMS';
  };
  /** Differentiates individual buyers from B2B managers */
  accountType?: 'Individual' | 'Manager' | 'Rep';
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionType = string;

export type ProductCategory = 'LinkedIn';

export interface ProductPricing {
  durationMonths: number;
  priceUSD: number;
  priceGBP: number;
  priceEUR: number;
  oldPriceUSD: number;
  oldPriceGBP: number;
  oldPriceEUR: number;
  /** Admin can mark this tier as unavailable. Customers see it greyed-out. */
  isDisabled?: boolean;
  /** Optional short note shown to customers when this tier is selected. */
  tierNote?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  // Legacy fields (optional for backward compatibility)
  price?: number;
  oldPrice?: number;
  subscriptionType?: SubscriptionType;
  durationMonths?: number;

  features: string[];
  category: ProductCategory;
  popular: boolean;
  isActive: boolean;
  /** When true, orders are still accepted even when stock is zero (pending_stock flow). Defaults to true. */
  acceptsPreOrders?: boolean;
  
  // New unified pricing array
  pricing: ProductPricing[];
  
  iconName?: string; // e.g., 'career', 'business', 'sales'
}

export interface Subscription {
  id: string;
  customerId: string;
  productId?: string; // New: For direct product mapping
  subscriptionType?: SubscriptionType;
  durationMonths?: number;
  planDuration: PlanDuration;
  price: number;
  startDate: string; // ISO format
  renewalDate: string; // ISO format
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  status: SubscriptionStatus;
  autoRenew: boolean;
  paymentLink?: string;
  lastContactedAt?: string;
  lastRenewed?: string;
  activationCode?: string; // New: For digital fulfillment
  deliveredAt?: string; // New: For activation confirmation
  createdAt: string;
  updatedAt: string;

  // ── B2B fields — only present on bulk-order seats ────────────────────────
  /** Links this subscription to a parent BulkOrder document. */
  bulkOrderId?: string;      // → bulk_orders.id
  /** Links this subscription to a specific seat in the BulkOrder. */
  bulkOrderSeatId?: string;  // → bulk_order_seats.id
  /** True when this license was provisioned as part of a bulk order. */
  isB2BLicense?: boolean;
  /** Per-seat sale price — may differ from the BulkOrder default. */
  salePrice?: number;
  /** Per-seat cost price — for margin tracking in renewal_history. */
  costPrice?: number;
  /** ISO date stamp set when a win-back reminder is queued. Prevents re-queueing. */
  winBackQueuedAt?: string;
}

export interface Reminder {
  id: string;
  customerId: string;
  subscriptionId: string;
  reminderType: '7-day' | '3-day' | '1-day' | 'due-today' | 'expired-follow-up' | 'win-back' | 'manual';
  channel: 'WhatsApp' | 'Email' | 'SMS';
  scheduledFor: string;
  sentAt?: string;
  status: ReminderStatus;
  messagePreview: string;
  createdAt: string;
}

export interface RenewalHistory {
  id: string;
  customerId: string;
  subscriptionId: string;
  requestId?: string; // New: Link to the original form submission
  codeId?: string; // New: Link to the specific Stock item (DigitalCode)
  activationCode?: string; // New: The physical link string for absolute correlation
  oldPlan: PlanDuration | '';
  newPlan: PlanDuration | '';
  amount: number; // Agreed Sales Price
  cost: number;   // GBP Cost of the link
  profit: number; // amount - cost
  renewedOn: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;

  // ── B2B fields — only present on bulk-order seats ────────────────────────
  /** Links this ledger entry to the parent BulkOrder. */
  bulkOrderId?: string;
  /** Links this ledger entry to the specific seat. */
  bulkOrderSeatId?: string;
}

export interface IntakeRequest {
  id: string;
  fullName: string;
  preferredContact: 'WhatsApp' | 'Email' | 'Reddit';
  whatsappNumber: string;
  email: string;
  redditUsername?: string;
  subscriptionType: SubscriptionType | '';
  subscriptionPeriod: PlanDuration | '';
  linkedinUrl?: string;
  notes: string;
  
  // Admin-added fields during processing
  soldPrice?: number;
  internalNotes?: string;
  startDate?: string;
  renewalDate?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Partial';
  
  activationCode?: string; // New: Assigned upon approval
  inventoryId?: string; // New: For tracking reserved stock item
  subscriptionId?: string; // New: Link to generated subscription
  deliveredAt?: string; // New: Final delivery timestamp
  
  status: RequestStatus;
  currency?: string;
  amount?: number;
  gbpEquivalent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  customerId: string;
  activityType: string;
  description: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'Activation' | 'Reminder' | 'Post-Activation' | 'Win-Back' | 'Payment Follow-Up';
  productType: SubscriptionType | 'All';
  duration: PlanDuration | 'All';
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  // General
  organizationName: string;
  organizationEmail: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  
  // Automation
  autoSendMode: AutoSendMode;
  reminderThresholds: number[];
  /** @deprecated Use per-threshold templates (reminderTemplate7/3/1/0) instead */
  whatsappTemplate: string;
  /** Per-threshold reminder message templates — no {payment_link} variable */
  reminderTemplate7: string;  // 7 days before — friendly awareness nudge
  reminderTemplate3: string;  // 3 days before — confirmation check-in
  reminderTemplate1: string;  // 1 day before — action message
  reminderTemplate0: string;  // On the day — final nudge
  /** Optional extended thresholds for win-back flows */
  reminderTemplate14?: string;
  reminderTemplate30?: string;
  automationChannels: ('WhatsApp' | 'Email' | 'SMS')[];
  
  // Notifications
  notificationPreferences: {
    customerAlerts: boolean;
    systemAlerts: boolean;
    dailySummary: boolean;
    summaryTime: string;
    channels: ('In-App' | 'Email' | 'WhatsApp')[];
    adminWhatsAppNumber?: string;
    webhookUrl?: string;
    callMeBotPhone?: string;
    callMeBotApiKey?: string;
    lastSundayReportDate?: string;
    lastDailyReportDate?: string;
    lastMorningReportDate?: string;
  };
  
  // Integrations
  integrations: {
    whatsapp: 'connected' | 'disconnected';
    stripe: 'connected' | 'disconnected';
    paypal: 'connected' | 'disconnected';
    smtp: 'connected' | 'disconnected';
  };
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  status: 'draft' | 'published';
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  authorUid?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Testimonial {
  id: string;
  content: string;
  user: string;
  rating: number;
  region?: string;
  featured: boolean;
  createdAt: string;
  /** Where the review came from */
  source?: 'reddit' | 'whatsapp' | 'direct';
  /** Firebase Storage URL for a screenshot image */
  screenshotUrl?: string;
  /** Product type for filtering on the testimonials page */
  productType?: 'career' | 'business' | 'sales-navigator' | 'company-page' | 'recruiter';
  /** Whether this review is visible on the public page (defaults to true if absent) */
  visible?: boolean;
  /** Avatar colour key */
  avatarColor?: 'blue' | 'purple' | 'green' | 'orange' | 'teal' | 'pink';
  /** Country flag emoji */
  flag?: string;
}

// ─── Phase 8: Inventory & Vendors ─────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem extends Product {
  stockCount: number;
  lowStockThreshold: number;
  costPrice: number; // In local currency
}

export interface InventoryLog {
  id: string;
  productId: string;
  vendorId?: string;
  quantityAdded: number;
  usdtCost: number; // USDT cost for this batch
  localCurrencyRate: number; // Rate at time of purchase
  date: string;
  note: string;
}

// ─── Phase 9: Live Stock & Digital Fulfillment ────────────────────────────────

export interface DigitalCode {
  id: string;
  productId: string;
  productName: string;
  code: string;
  duration: PlanDuration;
  costBasisUSDT: number;
  gbpPurchaseCost?: number;
  usdtBatchId?: string;
  vendorId?: string;
  status: 'Available' | 'Reserved' | 'Assigned' | 'Expired';
  /** When true, this code is claimed first ahead of FIFO order. Cleared automatically when claimed. */
  isPriority?: boolean;
  assignedToRequestId?: string;
  assignedToSubscriptionId?: string;
  assignedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface USDTTransaction {
  id: string;
  type: 'Inbound' | 'Outbound';
  amount: number;
  usdtRate: number; // USDT to Local Currency rate
  gbpPaid?: number; // Total GBP paid for this Inbound batch
  usdtReceived?: number; // Total USDT received for this Inbound batch
  binanceId?: string; // Optional Binance P2P Transaction ID
  parentId?: string; // For Outbound: reference to the Inbound batch it consumed
  remainingAmount: number; // For FIFO consumption tracking
  gbpTotalSpent: number; // For Inbound: amount * usdtRate
  date: string;
  note: string;
  status: 'Completed' | 'Pending' | 'Failed';
  isFullyUtilized: boolean; // True when remainingAmount == 0
  createdAt: string;
}
