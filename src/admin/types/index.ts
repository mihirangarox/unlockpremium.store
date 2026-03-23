export type CustomerStatus = 'New' | 'Active' | 'In Follow-up' | 'Inactive';
export type SubscriptionStatus = 'Active' | 'Due Soon' | 'Due Today' | 'Expired' | 'Renewed' | 'Cancelled';
export type ReminderStatus = 'Pending' | 'Scheduled' | 'Sent' | 'Failed' | 'Skipped' | 'Manual Approval';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type PlanDuration = '1M' | '2M' | '3M' | '4M' | '6M' | '9M' | '12M';
export type AutoSendMode = 'ON' | 'OFF' | 'Manual Approval';

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
  notes: string | CustomerNote[]; // Supporting both temporarily for migration
  reminderPreferences?: {
    days: number[];
    channel: 'WhatsApp' | 'Email' | 'SMS';
  };
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionType = 
  | 'Premium Career' 
  | 'Premium Business' 
  | 'Premium Company Page' 
  | 'Recruiter Lite' 
  | 'Sales Navigator Core' 
  | 'Sales Navigator Advanced' 
  | 'Sales Navigator Advanced Plus';

export type ProductCategory = 'LinkedIn';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number;
  features: string[];
  category: ProductCategory;
  popular: boolean;
  isActive: boolean;
  subscriptionType: SubscriptionType;
  durationMonths: number;
  iconName?: string; // e.g., 'career', 'business', 'sales'
}

export interface Subscription {
  id: string;
  customerId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  customerId: string;
  subscriptionId: string;
  reminderType: '7-day' | '3-day' | '1-day' | 'due-today' | 'expired-follow-up' | 'manual';
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
  oldPlan: PlanDuration | '';
  newPlan: PlanDuration | '';
  amount: number;
  renewedOn: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
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
  
  status: RequestStatus;
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
  whatsappTemplate: string;
  automationChannels: ('WhatsApp' | 'Email' | 'SMS')[];
  
  // Notifications
  notificationPreferences: {
    customerAlerts: boolean;
    systemAlerts: boolean;
    dailySummary: boolean;
    summaryTime: string;
    channels: ('In-App' | 'Email' | 'WhatsApp')[];
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
  vendorId?: string;
  status: 'Available' | 'Assigned' | 'Expired';
  assignedToRequestId?: string;
  assignedAt?: string;
  createdAt: string;
}
