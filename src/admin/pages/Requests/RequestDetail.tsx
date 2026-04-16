import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, XCircle, User,
  MessageSquare, CreditCard, FileText,
  Zap, ChevronRight, AlertTriangle, Copy, ExternalLink,
  Clock, Filter
} from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useLocalization } from "../../../context/LocalizationContext";
import { generateInvoicePDF } from "../../utils/invoiceGenerator";
import * as db from "../../services/db";
import { alertService } from "../../services/alertService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import type { IntakeRequest, Customer, Subscription, PlanDuration, SubscriptionType, Product, RequestStatus } from "../../types/index";

const SUBSCRIPTION_TYPES: SubscriptionType[] = [
  "Premium Career",
  "Premium Business",
  "Premium Company Page",
  "Recruiter Lite",
  "Sales Navigator Core",
  "Sales Navigator Advanced",
  "Sales Navigator Advanced Plus"
];

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { formatCurrency, formatDate } = useLocalization();

  const [request, setRequest] = useState<IntakeRequest | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for processing
  const [soldPrice, setSoldPrice] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [renewalDate, setRenewalDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending" | "Partial">("Pending");
  const [internalNotes, setInternalNotes] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType | "">("");
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<PlanDuration | "">("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(true);
  const [messagePreview, setMessagePreview] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // Edit Client Information state
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editedFullName, setEditedFullName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedWhatsapp, setEditedWhatsapp] = useState("");
  const [editedLinkedinUrl, setEditedLinkedinUrl] = useState("");

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: RequestStatus | null;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null,
    isDestructive: false
  });

  useEffect(() => {
    if (id) {
      loadRequest(id);
    }
  }, [id]);

  const loadRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      const data = await db.getRequest(requestId);
      if (data) {
        setRequest(data);
        if (data.soldPrice) setSoldPrice(data.soldPrice.toString());
        if (data.startDate) setStartDate(data.startDate);
        if (data.renewalDate) setRenewalDate(data.renewalDate);
        if (data.paymentStatus) setPaymentStatus(data.paymentStatus);
        if (data.internalNotes) setInternalNotes(data.internalNotes);
        if (data.subscriptionType) setSubscriptionType(data.subscriptionType);
        if (data.subscriptionPeriod) setSubscriptionPeriod(data.subscriptionPeriod);

        // Fetch products to populate dropdown
        const allProducts = await db.getProducts();
        setProducts(allProducts);

        // Initial Price Logic
        if (data.soldPrice) {
          setSoldPrice(data.soldPrice.toString());
        } else {
          const matchedProduct = allProducts.find(p => p.subscriptionType === data.subscriptionType);
          if (matchedProduct) setSoldPrice(matchedProduct.price.toString());
        }

        // Duplicate check
        const allRequests = await db.getRequests();
        const duplicates = allRequests.filter(r =>
          r.id !== data.id &&
          r.status === "Pending" &&
          ((data.whatsappNumber && r.whatsappNumber === data.whatsappNumber) ||
            (data.email && r.email === data.email) ||
            (data.redditUsername && r.redditUsername === data.redditUsername))
        );
        if (duplicates.length > 0) {
          setDuplicateWarning(true);
        }

        // Auto-calculate renewal date if not set
        if (!data.renewalDate && data.subscriptionPeriod) {
          const months = parseInt(data.subscriptionPeriod.replace('M', ''));
          const start = new Date(data.startDate || new Date().toISOString());
          start.setMonth(start.getMonth() + months);
          setRenewalDate(start.toISOString().split('T')[0]);
        }
      } else {
        showToast("Request not found", "error");
        navigate("/requests");
      }
    } catch (error) {
      console.error("Failed to load request:", error);
      showToast("Failed to load request", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updatePreview();
  }, [request, subscriptionType, subscriptionPeriod, soldPrice, startDate, renewalDate]);

  const updatePreview = () => {
    if (!request) return;

    // Create a mock request object for the preview
    const previewRequest: IntakeRequest = {
      ...request,
      subscriptionType: subscriptionType as any || request.subscriptionType,
      subscriptionPeriod: subscriptionPeriod as any || request.subscriptionPeriod,
      soldPrice: parseFloat(soldPrice) || request.soldPrice || 0,
      startDate,
      renewalDate
    };

    const preview = alertService.prepareFulfillmentMessage(
      previewRequest,
      request.activationCode || "[ACTIVATION_CODE_HERE]"
    );
    setMessagePreview(preview);
  };

  const handleCalculateRenewal = () => {
    // Use the admin-edited state value, not the original request value
    const period = subscriptionPeriod || request?.subscriptionPeriod;
    if (!period) return;
    const months = parseInt(period.replace("M", ""));
    if (isNaN(months)) return;

    const start = new Date(startDate);
    start.setMonth(start.getMonth() + months);
    setRenewalDate(start.toISOString().split("T")[0]);
  };

  const handleApproveAndConvert = async () => {
    if (!request || !startDate || !renewalDate) {
      showToast("Please fill in start date and renewal date.", "error");
      return;
    }

    const defaultPrice = parseFloat(soldPrice);
    if (isNaN(defaultPrice) || defaultPrice <= 0) {
      showToast("Price must be greater than 0.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date().toISOString();

      // IDENTITY-BASED DEDUPLICATION
      // Check if customer already exists by WhatsApp or Email
      const existingCustomer = await db.findCustomerByIdentity(
        request.whatsappNumber || undefined,
        request.email || undefined
      );

      let customerId = existingCustomer?.id;

      if (existingCustomer) {
        // Update existing customer metadata if needed
        const updatedCustomer: Customer = {
          ...existingCustomer,
          updatedAt: now
        };
        await db.saveCustomer(updatedCustomer);
      } else {
        // Create New Customer
        customerId = `cu_${Date.now()}`;
        const customer: Customer = {
          id: customerId,
          fullName: request.fullName,
          whatsappNumber: request.whatsappNumber || "",
          email: request.email || "",
          linkedinUrl: request.linkedinUrl || "",
          country: "Unknown",
          leadSource: request.preferredContact === 'Reddit' ? 'Reddit' : 'Organic',
          notes: request.notes,
          status: "Active",
          createdAt: now,
          updatedAt: now
        };
        await db.saveCustomer(customer);
      }

      // 2. Create Subscription
      const subId = `su_${Date.now()}`;
      const subscription: Subscription = {
        id: subId,
        customerId,
        subscriptionType: (subscriptionType as SubscriptionType) || "Sales Navigator Core",
        planDuration: (subscriptionPeriod as PlanDuration) || "6M",
        price: defaultPrice,
        startDate,
        renewalDate,
        paymentStatus,
        // Phase 1: "Reserved" — link is locked but NOT yet counted in financial metrics.
        // confirmDelivery() will upgrade this to "Active".
        status: "Reserved",
        autoRenew: true,
        createdAt: now,
        updatedAt: now
      };

      // 3. Claim Digital Activation Code
      const targetProduct = products.find(p => p.subscriptionType === (subscriptionType || request.subscriptionType));

      const claimedCodeObj = await db.claimCodeForRequest(
        targetProduct?.id || (subscriptionType as string) || (request.subscriptionType as string) || "",
        (subscriptionPeriod as string) || request.subscriptionPeriod || "",
        request.id,
        subscription.id
      );

      const activationCode = claimedCodeObj?.code || null;
      const linkCost = Number(claimedCodeObj?.gbpPurchaseCost || 0);
      const profit = Number(defaultPrice || 0) - linkCost;

      if (activationCode) {
        subscription.activationCode = activationCode;
      }

      // 5. Mark Request as Approved — include admin-edited type/period so saved record reflects changes
      const updatedRequest: IntakeRequest = {
        ...request,
        subscriptionType: (subscriptionType as SubscriptionType) || request.subscriptionType,
        subscriptionPeriod: (subscriptionPeriod as PlanDuration) || request.subscriptionPeriod,
        soldPrice: defaultPrice,
        startDate,
        renewalDate,
        paymentStatus,
        internalNotes,
        activationCode: activationCode,
        inventoryId: claimedCodeObj?.id,
        subscriptionId: subId,
        status: "Approved",
        updatedAt: now
      };

      // Save Subscription (Active status but pending delivery confirmation)
      await db.saveSubscription(subscription);
      await db.saveRequest(updatedRequest);

      // NOTE: We SKIP db.logTransaction and notifySaleCelebration here.
      // They will be triggered during handleConfirmDelivery.

      // Update order count for the "Loyalty" system
      if (customerId) {
        await db.updateCustomerOrderCount(customerId);
      }

      setRequest(updatedRequest);

      // Auto-Fulfillment Pop-up (Just opens the tab, doesn't finalize)
      if (activationCode && updatedRequest.whatsappNumber && autoSendWhatsApp) {
        const waLink = alertService.prepareCustomerFulfillment(updatedRequest, activationCode);
        if (waLink) {
          window.open(waLink, '_blank');
        }
      }

      showToast(
        claimedCodeObj
          ? "Approved! Code Reserved. Please confirm delivery after sending."
          : "Approved! (No available codes to assign)",
        claimedCodeObj ? "success" : "info"
      );

    } catch (error) {
      console.error("Failed to approve request:", error);
      showToast("Failed to process request.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!request || !request.inventoryId || !request.subscriptionId) return;

    setIsConfirming(true);
    try {
      await db.confirmDelivery(
        request.id,
        request.inventoryId,
        request.subscriptionId
      );

      // Fetch the code to get the final profit for Discord notification
      const codeRecord = await db.getLiveStockItem(request.inventoryId);
      const profit = (Number(request.soldPrice) || 0) - (Number(codeRecord?.gbpPurchaseCost) || 0);

      // Now celebrate on Discord!
      const existingCustomer = await db.findCustomerByIdentity(request.whatsappNumber, request.email);
      alertService.notifySaleCelebration(request, profit, existingCustomer);

      // Update local state
      const updatedRequest = { ...request, deliveredAt: new Date().toISOString() };
      setRequest(updatedRequest);
      showToast("Delivery confirmed and recorded!", "success");
    } catch (error) {
      console.error("Confirmation error:", error);
      showToast("Failed to confirm delivery.", "error");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReleaseReservation = async () => {
    if (!request || !request.inventoryId || !request.subscriptionId) return;

    setIsReverting(true);
    try {
      await db.releaseReservation(
        request.id,
        request.inventoryId,
        request.subscriptionId
      );

      // Revert local state
      const updatedRequest: IntakeRequest = {
        ...request,
        status: 'Pending',
        activationCode: undefined,
        inventoryId: undefined,
        subscriptionId: undefined
      };
      setRequest(updatedRequest);
      showToast("Link released back to stock.", "info");
    } catch (error) {
      showToast("Failed to release link.", "error");
    } finally {
      setIsReverting(false);
    }
  };

  const handleReject = () => {
    if (!request) return;
    setConfirmModal({
      isOpen: true,
      title: "Reject Request",
      message: "Are you sure you want to reject this request? This will mark it as Rejected in your records.",
      action: "Rejected",
      isDestructive: true
    });
  };

  const handleUpdateStatus = (newStatus: RequestStatus) => {
    if (!request) return;
    setConfirmModal({
      isOpen: true,
      title: `Mark as ${newStatus}`,
      message: `Are you sure you want to mark this request as ${newStatus}?`,
      action: newStatus,
      isDestructive: newStatus === "Spam"
    });
  };

  const executeStatusUpdate = async () => {
    if (!request || !confirmModal.action) return;

    setIsProcessing(true);
    const newStatus = confirmModal.action;

    try {
      const updatedRequest: IntakeRequest = {
        ...request,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      await db.saveRequest(updatedRequest);
      setRequest(updatedRequest);
      showToast(`Request marked as ${newStatus}.`, "success");
    } catch (error) {
      console.error(`Failed to update status to ${newStatus}:`, error);
      showToast(`Failed to update status to ${newStatus}.`, "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleSaveClient = async () => {
    if (!request) return;

    setIsProcessing(true);
    try {
      const updatedRequest: IntakeRequest = {
        ...request,
        fullName: editedFullName,
        email: editedEmail,
        whatsappNumber: editedWhatsapp,
        linkedinUrl: editedLinkedinUrl,
        updatedAt: new Date().toISOString()
      };

      await db.saveRequest(updatedRequest);
      setRequest(updatedRequest);
      setIsEditingClient(false);
      showToast("Client information updated", "success");
    } catch (error) {
      console.error("Failed to update client info:", error);
      showToast("Failed to update client information", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditingClient = () => {
    if (!request) return;
    setEditedFullName(request.fullName);
    setEditedEmail(request.email || "");
    setEditedWhatsapp(request.whatsappNumber || "");
    setEditedLinkedinUrl(request.linkedinUrl || "");
    setIsEditingClient(true);
  };

  const getInvoiceText = () => {
    if (!request || !request.soldPrice) return "";
    return `*INVOICE*
-----------------------------
*Customer:* ${request.fullName}
*Subscription:* ${request.subscriptionType} (${request.subscriptionPeriod} plan)
*Activation Date:* ${formatDate(request.startDate || startDate)}
*Renewal Date:* ${formatDate(request.renewalDate || renewalDate)}
*Total Amount:* ${formatCurrency(request.soldPrice)}
*Status:* ${request.paymentStatus}
${request.activationCode ? `\n*Digital Activation Key:* ${request.activationCode}` : ""}

Thank you for your business!`;
  };

  const handleGenerateInvoice = () => {
    if (!request) return;

    generateInvoicePDF({
      customerName: request.fullName,
      subscriptionType: request.subscriptionType || subscriptionType || "",
      planDuration: request.subscriptionPeriod || subscriptionPeriod || "",
      startDate: formatDate(request.startDate || startDate),
      renewalDate: formatDate(request.renewalDate || renewalDate),
      amount: formatCurrency(request.soldPrice || 0),
      status: request.paymentStatus || paymentStatus,
      email: request.email,
      whatsapp: request.whatsappNumber
    });
    showToast("Professional PDF Invoice generated!", "success");
  };

  const handleWhatsAppLink = () => {
    if (!request?.whatsappNumber) {
      showToast("No WhatsApp number provided for this request.", "error");
      return;
    }
    const text = getInvoiceText();
    const cleanNumber = request.whatsappNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/10 font-black tracking-wide';
      case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/10 font-black tracking-wide';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-500/10 font-black tracking-wide';
      case 'Spam': return 'bg-slate-200 text-slate-700 border-slate-300 font-black tracking-wide';
      case 'Archived': return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-black tracking-wide';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/requests')}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Request Details</h1>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">Submitted on {formatDate(request.createdAt)}</p>
            </div>
          </div>

          {request.status === "Approved" && (
            <div className="flex gap-3">
              <button
                onClick={handleGenerateInvoice}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold flex items-center hover:bg-indigo-50 shadow-sm transition"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download PDF Invoice
              </button>
              <button
                onClick={handleWhatsAppLink}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold flex items-center shadow-lg hover:bg-emerald-600 hover:shadow-emerald-500/25 transition"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp Link
              </button>
            </div>
          )}
        </div>

        {duplicateWarning && request.status === "Pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Potential Duplicate Detected</h4>
              <p className="text-xs text-amber-700 mt-1">There is another pending request with the same contact information.</p>
            </div>
          </div>
        )}

        {/* Pre-order alert: customer ordered when stock was zero */}
        {request.notes?.includes('[PENDING_STOCK]') && request.status === "Pending" && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-orange-800">⚡ Pre-Order — Stock Needed</h4>
              <p className="text-xs text-orange-700 mt-1">This order was placed when stock was zero. Source a link before approving.</p>
            </div>
          </div>
        )}

        {/* Approved but no code assigned — admin needs to manually add a link */}
        {request.status === "Approved" && !request.activationCode && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">⚠️ Awaiting Stock — No Link Assigned</h4>
              <p className="text-xs text-amber-700 mt-1">Request approved but no activation link was available. Add stock in Manage Stock, then come back and reprocess.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Submitted Data */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4" /> Client Information
                </h3>
                {isEditingClient ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingClient(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveClient}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditingClient}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    Edit Information
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  {isEditingClient ? (
                    <input
                      type="text"
                      value={editedFullName}
                      onChange={e => setEditedFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-lg font-bold text-slate-900">{request.fullName}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Preferred Contact</label>
                    <div className="font-medium text-slate-700">{request.preferredContact}</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp</label>
                    {isEditingClient ? (
                      <input
                        type="tel"
                        value={editedWhatsapp}
                        onChange={e => setEditedWhatsapp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <div className="font-medium text-slate-700">{request.whatsappNumber || 'N/A'}</div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    {isEditingClient ? (
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={e => setEditedEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <div className="font-medium text-slate-700">{request.email || 'N/A'}</div>
                    )}
                  </div>
                  {request.redditUsername && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Reddit</label>
                      <div className="font-medium text-slate-700">{request.redditUsername}</div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500 font-medium">LinkedIn URL</span>
                      <div className="flex items-center gap-1">
                        {request.linkedinUrl && (
                          <>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(request.linkedinUrl || "");
                                showToast("URL copied!", "success");
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Copy URL"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => window.open(request.linkedinUrl, '_blank')}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Open Profile"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditingClient ? (
                      <input
                        type="url"
                        value={editedLinkedinUrl}
                        onChange={e => setEditedLinkedinUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="https://linkedin.com/in/..."
                      />
                    ) : (
                      <div className="text-xs font-bold text-slate-700 break-all leading-relaxed pr-2">
                        {request.linkedinUrl || 'N/A'}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2 rounded-xl">
                    <span className="text-slate-500 font-medium">Channel</span>
                    <span className="font-bold text-slate-700">{request.preferredContact}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <CreditCard className="w-4 h-4" /> Subscription Request
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                    {request.status === "Pending" ? (
                      <select
                        value={subscriptionType}
                        onChange={e => {
                          const newType = e.target.value as any;
                          setSubscriptionType(newType);
                          // Auto-select first available duration for this type
                          const firstMatch = products.find(p => p.subscriptionType === newType);
                          if (firstMatch) {
                            if (firstMatch.pricing && firstMatch.pricing.length > 0) {
                              setSubscriptionPeriod((firstMatch.pricing[0].durationMonths + 'M') as any);
                            } else if (firstMatch.durationMonths) {
                              setSubscriptionPeriod((firstMatch.durationMonths + 'M') as any);
                            }
                          }
                        }}
                        className="w-full text-sm font-bold text-indigo-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      >
                        <option value="">Select Plan...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.subscriptionType}>{p.name}</option>
                        ))}
                        {!products.some(p => p.subscriptionType === request.subscriptionType) && request.subscriptionType && (
                          <option value={request.subscriptionType}>{request.subscriptionType} (Legacy)</option>
                        )}
                      </select>
                    ) : (
                      <div className="font-bold text-indigo-600">
                        {request.subscriptionType || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
                    {request.status === "Pending" ? (
                      (() => {
                        // Filter durations to only those available in the product catalog
                        const selectedType = subscriptionType || request.subscriptionType;
                        const availableDurations = products
                          .filter(p => !selectedType || p.subscriptionType === selectedType)
                          .flatMap(p => {
                            if (p.pricing && p.pricing.length > 0) {
                              return p.pricing.map(price => price.durationMonths + 'M');
                            }
                            return p.durationMonths ? [p.durationMonths + 'M'] : [];
                          });
                        const durationLabels: Record<string, string> = {
                          '1M': '1 Month', '2M': '2 Months', '3M': '3 Months',
                          '6M': '6 Months', '12M': '12 Months'
                        };
                        // Fallback to all standard options if catalog is empty
                        const options = availableDurations.length > 0
                          ? availableDurations
                          : ['1M', '2M', '3M', '6M', '12M'];

                        // Remove duplicates from availableDurations in case multiple products have the same duration
                        const uniqueOptions = Array.from(new Set(options));

                        return (
                          <select
                            value={subscriptionPeriod}
                            onChange={e => setSubscriptionPeriod(e.target.value as any)}
                            className="w-full text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500"
                          >
                            {uniqueOptions.map(dur => (
                              <option key={dur} value={dur}>{durationLabels[dur] || dur}</option>
                            ))}
                          </select>
                        );
                      })()
                    ) : (
                      <div className="font-medium text-slate-700">{request.subscriptionPeriod || 'N/A'} plan</div>
                    )}
                  </div>
                </div>

                {request.currency && (
                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Received</label>
                      <div className="text-lg font-black text-slate-900">{formatCurrency(request.amount || 0)} {request.currency}</div>
                    </div>
                    <div className="text-right">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ledger Value (GBP)</label>
                      <div className="text-lg font-black text-emerald-600">£{(request.gbpEquivalent || 0).toFixed(2)}</div>
                    </div>
                  </div>
                )}

                {request.notes && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Customer Notes</label>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm italic">
                      "{request.notes}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Admin Processing */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col h-full">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4" /> Processing Workflow
            </h3>

            <div className="space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Agreed Price (£) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium pb-0.5">{formatCurrency(0).replace(/[0-9.,\s]/g, '')}</span>
                    <input
                      type="number"
                      value={soldPrice}
                      onChange={e => setSoldPrice(e.target.value)}
                      disabled={request.status !== "Pending"}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-inner-spin-button]:appearance-none text-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Payment Status *</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    disabled={request.status !== "Pending"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50 text-slate-900"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Activation Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      // Don't auto-calculate strictly here as they might want manual control,
                      // but they can click the button
                    }}
                    disabled={request.status !== "Pending"}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold disabled:opacity-50 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between items-center">
                    Renewal Date *
                    {request.status === "Pending" && (
                      <button onClick={handleCalculateRenewal} className="text-[10px] text-indigo-600 uppercase hover:underline">Auto-calc</button>
                    )}
                  </label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={e => setRenewalDate(e.target.value)}
                    disabled={request.status !== "Pending"}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold disabled:opacity-50 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">Internal Admin Notes</label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  disabled={request.status !== "Pending"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] disabled:opacity-50 text-sm"
                  placeholder="Private notes about pricing or negotiations..."
                />
              </div>

              {request.status === "Pending" && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Preview</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Auto-Send</span>
                      <div
                        onClick={() => setAutoSendWhatsApp(!autoSendWhatsApp)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${autoSendWhatsApp ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoSendWhatsApp ? 'left-4.5' : 'left-0.5'}`} />
                      </div>
                    </label>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 text-[11px] font-medium text-slate-300 leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar border border-slate-800 shadow-inner whitespace-pre-wrap">
                    {messagePreview}
                  </div>
                  <p className="text-[9px] text-slate-500 italic">
                    Note: The activation code will be injected automatically upon approval.
                  </p>
                </div>
              )}
            </div>

            {request.status === "Pending" && (
              <div className="pt-6 mt-6 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="w-full py-3.5 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={handleApproveAndConvert}
                    disabled={isProcessing}
                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Approve & Convert
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleUpdateStatus('Archived')}
                    disabled={isProcessing}
                    className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50 text-xs uppercase tracking-widest"
                  >
                    Archive for Stats
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Spam')}
                    disabled={isProcessing}
                    className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition disabled:opacity-50 text-xs uppercase tracking-widest"
                  >
                    Mark as Spam
                  </button>
                </div>
              </div>
            )}

            {request.status === "Approved" && (
              <div className="pt-6 mt-6 border-t border-emerald-100 space-y-4">
                {!request.deliveredAt ? (
                  /* Stage 2: Fulfillment (Reserved but not delivered) */
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Fulfillment Pending</p>
                        <p className="text-xs text-amber-600 mt-1">Code is reserved. Open WhatsApp to send it, then confirm delivery to finalize finances.</p>
                      </div>
                    </div>

                    {request.activationCode && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Reserved Code</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(request.activationCode || "");
                              showToast("Code copied!", "success");
                            }}
                            className="p-1.5 hover:bg-white rounded-lg text-indigo-400 hover:text-indigo-600 transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-mono text-lg font-bold text-indigo-900 break-all bg-white/50 p-4 rounded-xl border border-indigo-50 text-center mb-4">
                          {request.activationCode}
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              const waLink = alertService.prepareCustomerFulfillment(request, request.activationCode!);
                              if (waLink) window.open(waLink, '_blank');
                            }}
                            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Open WhatsApp
                          </button>

                          <button
                            onClick={handleConfirmDelivery}
                            disabled={isConfirming}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                          >
                            {isConfirming ? (
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm Delivered
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleReleaseReservation}
                            disabled={isReverting}
                            className="w-full py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          >
                            {isReverting ? "Releasing..." : "Release Link & Revert Approval"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Stage 3: Fully Delivered */
                  <>
                    <div className="bg-emerald-50 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800">Order Delivered</p>
                        <p className="text-xs text-emerald-600 mt-1">
                          Successfully delivered on {formatDate(request.deliveredAt)}.
                          Profit recorded in financial records.
                        </p>
                      </div>
                    </div>

                    {request.activationCode && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivered Code</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(request.activationCode || "");
                              showToast("Code copied!", "success");
                            }}
                            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-mono text-lg font-bold text-slate-900 break-all bg-white/50 p-4 rounded-xl border border-slate-100 text-center">
                          {request.activationCode}
                        </div>
                        <button
                          onClick={() => {
                            const waLink = alertService.prepareCustomerFulfillment(request, request.activationCode!);
                            if (waLink) window.open(waLink, '_blank');
                          }}
                          className="w-full mt-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" /> Re-open WhatsApp
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {request.status === "Rejected" && (
              <div className="pt-6 mt-6 border-t border-rose-100 space-y-4">
                <div className="bg-rose-50 rounded-xl p-4 flex items-start gap-3 border border-rose-100">
                  <XCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-800">Request Rejected</p>
                    <p className="text-xs text-rose-600 mt-1">This request was rejected manually. It is still visible in the Rejected list but filtered from active views.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleUpdateStatus('Archived')}
                    className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition"
                  >
                    Move to Archive
                  </button>
                </div>
              </div>
            )}

            {request.status === "Archived" && (
              <div className="pt-6 mt-6 border-t border-indigo-100 space-y-4">
                <div className="bg-indigo-50/50 rounded-xl p-4 flex items-start gap-3 border border-indigo-100">
                  <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-indigo-800">Request Archived</p>
                    <p className="text-xs text-indigo-600 mt-1">This request is archived for conversion statistics. It will not appear in the main "Waiting Room" list.</p>
                  </div>
                </div>
              </div>
            )}

            {request.status === "Spam" && (
              <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 border border-slate-200">
                  <Filter className="w-5 h-5 text-slate-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Flagged as Spam</p>
                    <p className="text-xs text-slate-600 mt-1">This request is hidden from list views to keep your workspace clean.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeStatusUpdate}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        confirmLabel={confirmModal.action === "Rejected" ? "Reject" : confirmModal.action === "Spam" ? "Mark Spam" : "Confirm"}
      />
    </>
  );
}
