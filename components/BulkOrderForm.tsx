/**
 * BulkOrderForm.tsx
 * Client-facing form for B2B (Manager) bulk license purchases.
 * Allows a Manager to enter their details and dynamically add N Rep emails.
 * On submit, writes one `bulk_orders` doc + N `bulk_order_seats` docs atomically.
 */
import React, { useState, useId } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  Users,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Building2,
  Mail,
  User,
  Linkedin,
  ArrowLeft,
  MessageCircle,
  Package,
  Shield,
} from 'lucide-react';
import Button from './Button';
import { createBulkOrder, getProduct } from '../src/admin/services/db';
import type { BulkOrder, BulkOrderSeat, PlanDuration, Product } from '../src/admin/types/index';
import { useLocalization } from '../src/context/LocalizationContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RepRow {
  uid: string; // local-only key for React reconciliation
  name: string;
  email: string;
  linkedinUrl: string;
}

interface ManagerForm {
  fullName: string;
  email: string;
  whatsapp: string;
  companyName: string;
  notes: string;
}

/**
 * Locked to Sales Navigator — the only product eligible for B2B bulk orders.
 * Duration is locked to 1 Month, the only public tier currently offered.
 */
const PRODUCT_ID = 'prod_1774301122791';
const PRODUCT_NAME = 'Linkedin Sales Navigator Advance';
const LOCKED_DURATION: PlanDuration = '1M';

/**
 * Firestore rejects `undefined` values in document writes.
 * This helper strips any key whose value is `undefined` before we call
 * writeBatch.set(), preventing the "Unsupported field value: undefined" error.
 */
const stripUndefined = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;

// ─── Sub-components ───────────────────────────────────────────────────────────

const InputLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({
  htmlFor,
  children,
}) => (
  <label
    htmlFor={htmlFor}
    className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2"
  >
    {children}
  </label>
);

const inputCls =
  'w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200';

// ─── Main Component ───────────────────────────────────────────────────────────

const BulkOrderForm: React.FC = () => {
  const formId = useId();

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId] = useState<string>(`bo_${Date.now()}`);

  // ── Manager form ─────────────────────────────────────────────────────────
  const [manager, setManager] = useState<ManagerForm>({
    fullName: '',
    email: '',
    whatsapp: '',
    companyName: '',
    notes: '',
  });

  // ── Reps list ─────────────────────────────────────────────────────────────
  const [reps, setReps] = useState<RepRow[]>([
    { uid: `rep_${Date.now()}`, name: '', email: '', linkedinUrl: '' },
  ]);

  // ── Product Pricing ───────────────────────────────────────────────────────
  const [productInfo, setProductInfo] = useState<Product | null>(null);
  const { formatCurrency, userCurrency } = useLocalization();

  React.useEffect(() => {
    const fetchProduct = async () => {
      const p = await getProduct(PRODUCT_ID);
      if (p) setProductInfo(p);
    };
    fetchProduct();
  }, []);

  const getTierPrice = (): number => {
    if (!productInfo || !productInfo.pricing) return 0;
    const tier = productInfo.pricing.find(p => p.durationMonths === 1);
    if (!tier) return 0;
    if (userCurrency === 'GBP') return tier.priceGBP;
    if (userCurrency === 'EUR') return tier.priceEUR;
    return tier.priceUSD;
  };

  const unitPrice = getTierPrice();
  const estimatedTotal = unitPrice * reps.length;

  // ── Validation helpers ────────────────────────────────────────────────────
  const [step1Errors, setStep1Errors] = useState<Partial<ManagerForm>>({});

  const validateStep1 = (): boolean => {
    const errors: Partial<ManagerForm> = {};
    if (!manager.fullName.trim()) errors.fullName = 'Required';
    if (!manager.email.trim() || !/\S+@\S+\.\S+/.test(manager.email))
      errors.email = 'Valid email required';
    if (!manager.whatsapp.trim()) errors.whatsapp = 'Required';
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const [repErrors, setRepErrors] = useState<Record<string, string>>({});

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    reps.forEach((rep, i) => {
      if (!rep.email.trim() || !/\S+@\S+\.\S+/.test(rep.email)) {
        errors[`${rep.uid}_email`] = `Rep ${i + 1}: valid email required`;
      }
    });
    setRepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Rep CRUD ──────────────────────────────────────────────────────────────
  const addRep = () => {
    setReps((prev) => [
      ...prev,
      { uid: `rep_${Date.now()}`, name: '', email: '', linkedinUrl: '' },
    ]);
  };

  const removeRep = (uid: string) => {
    if (reps.length === 1) return; // Always keep at least one
    setReps((prev) => prev.filter((r) => r.uid !== uid));
  };

  const updateRep = (uid: string, field: keyof RepRow, value: string) => {
    setReps((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, [field]: value } : r))
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();

      // Build the parent BulkOrder document
      const bulkOrderData = stripUndefined({
        id: orderId,
        managerId: `mgr_${Date.now()}`, // Placeholder — admin links to Customer record later
        managerName: manager.fullName.trim(),
        managerEmail: manager.email.trim(),
        managerWhatsapp: manager.whatsapp.trim() || undefined,
        // Locked to Sales Navigator — this form is exclusively for B2B Sales Navigator bulk orders
        productId: PRODUCT_ID,
        productName: PRODUCT_NAME,
        planDuration: LOCKED_DURATION,
        totalLicenses: reps.length,
        activatedLicenses: 0,
        salePrice: 0, // Admin sets price after reviewing
        costPrice: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        paymentStatus: 'Pending' as const,
        status: 'Pending' as const,
        notes: manager.notes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }) as BulkOrder;

      // Build one BulkOrderSeat per rep — also strip optional undefined fields
      const seats: BulkOrderSeat[] = reps.map((rep, i) =>
        stripUndefined({
          id: `seat_${orderId}_${i}`,
          bulkOrderId: orderId,
          managerId: bulkOrderData.managerId,
          repName: rep.name.trim() || undefined,
          repEmail: rep.email.trim(),
          repLinkedinUrl: rep.linkedinUrl.trim() || undefined,
          status: 'Pending' as const,
          createdAt: now,
          updatedAt: now,
        }) as BulkOrderSeat
      );

      await createBulkOrder(bulkOrderData, seats);

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[BulkOrderForm] submission error:', err);
      setSubmitError(
        err?.message || 'Submission failed. Please try again or contact support.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center px-4">
        <m.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-lg w-full text-center glass p-10 rounded-3xl border border-white/10 relative overflow-hidden"
        >
          {/* Glow bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
            Request Received!
          </h2>
          <p className="text-neutral-400 mb-2 text-pretty leading-relaxed">
            Your bulk order request for{' '}
            <span className="text-white font-semibold">{reps.length} licenses</span> has
            been submitted successfully.
          </p>
          <p className="text-neutral-500 text-sm mb-8">
            Reference:{' '}
            <span className="font-mono text-indigo-400">{orderId}</span>
          </p>

          <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-left mb-8 space-y-3">
            <p className="text-sm font-bold text-white">What happens next?</p>
            {[
              'Our team reviews your request and prepares a custom quote.',
              'You receive a payment link via WhatsApp within 24 hours.',
              'Upon payment, we activate all licenses and send each rep their link.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-indigo-400">{i + 1}</span>
                </div>
                <span className="text-sm text-neutral-400">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" as={Link} to="/" className="flex-1 justify-center">
              Return to Home
            </Button>
            <Button
              variant="outline"
              className="flex-1 justify-center border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() =>
                window.open(
                  `https://wa.me/447534317838?text=${encodeURIComponent(
                    `Hi, I just submitted a bulk order request for ${reps.length} Sales Navigator licenses. Reference: ${orderId}`
                  )}`,
                  '_blank'
                )
              }
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Us
            </Button>
          </div>
        </m.div>
      </div>
    );
  }

  // ── Steps indicator bar ───────────────────────────────────────────────────
  const steps = [
    { num: 1, label: 'Your Details', icon: User },
    { num: 2, label: 'Add Reps', icon: Users },
    { num: 3, label: 'Review', icon: Package },
  ];

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[#050505]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Page header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold tracking-[0.2em] text-indigo-400 mb-5 uppercase">
            B2B Enterprise
          </div>
          {/* Product lock badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A66C2]/15 border border-[#0A66C2]/30 text-xs font-bold text-[#5aaff5] mb-5 ml-3">
            <Linkedin className="w-3.5 h-3.5" />
            Sales Navigator Only
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            Bulk{' '}
            <span className="text-indigo-400">Sales Navigator</span>
            {' '}Licenses
          </h1>
          <p className="text-neutral-500 text-base max-w-xl">
            Equip your entire sales team with LinkedIn Sales Navigator. Enter your
            details, add your reps' LinkedIn emails and we'll handle the rest.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-white/10 -z-10" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-indigo-500 -z-10 transition-all duration-500"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />
          {steps.map((s) => {
            const Icon = s.icon;
            const active = step >= s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    active
                      ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30'
                      : 'bg-zinc-900 border border-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-neutral-600'}`} />
                </div>
                <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-neutral-600'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Manager Details ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <m.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="glass p-8 rounded-3xl border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Manager / Buyer Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full name */}
                  <div className="md:col-span-2">
                    <InputLabel htmlFor={`${formId}-name`}>Full Name *</InputLabel>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                      <input
                        id={`${formId}-name`}
                        type="text"
                        value={manager.fullName}
                        onChange={(e) =>
                          setManager((p) => ({ ...p, fullName: e.target.value }))
                        }
                        className={`${inputCls} pl-11 ${step1Errors.fullName ? 'border-red-500/60' : ''}`}
                        placeholder="Jane Smith"
                      />
                    </div>
                    {step1Errors.fullName && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {step1Errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Company */}
                  <div className="md:col-span-2">
                    <InputLabel htmlFor={`${formId}-company`}>Company Name</InputLabel>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                      <input
                        id={`${formId}-company`}
                        type="text"
                        value={manager.companyName}
                        onChange={(e) =>
                          setManager((p) => ({ ...p, companyName: e.target.value }))
                        }
                        className={`${inputCls} pl-11`}
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <InputLabel htmlFor={`${formId}-email`}>Email Address *</InputLabel>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                      <input
                        id={`${formId}-email`}
                        type="email"
                        value={manager.email}
                        onChange={(e) =>
                          setManager((p) => ({ ...p, email: e.target.value }))
                        }
                        className={`${inputCls} pl-11 ${step1Errors.email ? 'border-red-500/60' : ''}`}
                        placeholder="jane@company.com"
                      />
                    </div>
                    {step1Errors.email && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {step1Errors.email}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <InputLabel htmlFor={`${formId}-whatsapp`}>WhatsApp Number *</InputLabel>
                    <div className="b2b-phone-wrap">
                      <PhoneInput
                        id={`${formId}-whatsapp`}
                        value={manager.whatsapp}
                        onChange={(v) => setManager((p) => ({ ...p, whatsapp: v || '' }))}
                        defaultCountry="GB"
                        international
                        className={`b2b-phone-input ${step1Errors.whatsapp ? 'b2b-phone-error' : ''}`}
                        placeholder="+44 7700 900 000"
                      />
                    </div>
                    {step1Errors.whatsapp && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {step1Errors.whatsapp}
                      </p>
                    )}
                  </div>

                  {/* Plan duration — locked to 1 Month */}
                  <div className="md:col-span-2">
                    <InputLabel htmlFor={`${formId}-plan`}>Plan Duration</InputLabel>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-white font-bold text-sm">1 Month</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <InputLabel htmlFor={`${formId}-notes`}>Additional Notes</InputLabel>
                    <textarea
                      id={`${formId}-notes`}
                      value={manager.notes}
                      onChange={(e) =>
                        setManager((p) => ({ ...p, notes: e.target.value }))
                      }
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="Any specific requirements, preferred start dates, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                >
                  Add Rep Emails <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </m.div>
          )}

          {/* ── STEP 2: Rep Emails ──────────────────────────────────────────── */}
          {step === 2 && (
            <m.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Info banner */}
              <div className="p-4 bg-indigo-500/8 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-200/80 leading-relaxed">
                  Add the <strong>LinkedIn email address</strong> for each rep who needs
                  a license. We'll send each rep their unique activation link directly.
                  You can add or remove reps at any time.
                </p>
              </div>

              {/* Rep rows */}
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {reps.map((rep, i) => (
                    <m.div
                      key={rep.uid}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="glass border border-white/10 rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-indigo-400">
                          Rep #{i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRep(rep.uid)}
                          disabled={reps.length === 1}
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={`Remove rep ${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Rep name (optional) */}
                        <div>
                          <InputLabel htmlFor={`${formId}-rep-name-${rep.uid}`}>
                            Rep Name
                          </InputLabel>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                            <input
                              id={`${formId}-rep-name-${rep.uid}`}
                              type="text"
                              value={rep.name}
                              onChange={(e) => updateRep(rep.uid, 'name', e.target.value)}
                              className={`${inputCls} pl-9 text-sm py-2.5`}
                              placeholder="John Doe (optional)"
                            />
                          </div>
                        </div>

                        {/* Rep email (required) */}
                        <div>
                          <InputLabel htmlFor={`${formId}-rep-email-${rep.uid}`}>
                            LinkedIn Email *
                          </InputLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                            <input
                              id={`${formId}-rep-email-${rep.uid}`}
                              type="email"
                              value={rep.email}
                              onChange={(e) => updateRep(rep.uid, 'email', e.target.value)}
                              className={`${inputCls} pl-9 text-sm py-2.5 ${repErrors[`${rep.uid}_email`] ? 'border-red-500/60' : ''}`}
                              placeholder="rep@company.com"
                            />
                          </div>
                          {repErrors[`${rep.uid}_email`] && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {repErrors[`${rep.uid}_email`]}
                            </p>
                          )}
                        </div>

                        {/* LinkedIn URL (optional) */}
                        <div className="sm:col-span-2">
                          <InputLabel htmlFor={`${formId}-rep-li-${rep.uid}`}>
                            LinkedIn Profile URL
                          </InputLabel>
                          <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                            <input
                              id={`${formId}-rep-li-${rep.uid}`}
                              type="url"
                              value={rep.linkedinUrl}
                              onChange={(e) =>
                                updateRep(rep.uid, 'linkedinUrl', e.target.value)
                              }
                              className={`${inputCls} pl-9 text-sm py-2.5`}
                              placeholder="https://linkedin.com/in/johndoe (optional)"
                            />
                          </div>
                        </div>
                      </div>
                    </m.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add rep button */}
              <button
                type="button"
                onClick={addRep}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-white/10 text-neutral-500 hover:border-indigo-500/40 hover:text-indigo-400 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Add Another Rep
              </button>

              {/* Counter summary */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-sm text-neutral-400">
                  Total licenses in this order:
                </span>
                <span className="text-xl font-black text-white">{reps.length}</span>
              </div>

              {/* Nav */}
              <div className="flex justify-between gap-4">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                >
                  Review Order <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </m.div>
          )}

          {/* ── STEP 3: Review & Confirm ────────────────────────────────────── */}
          {step === 3 && (
            <m.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Manager summary */}
              <div className="glass border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  Manager Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Name', value: manager.fullName },
                    { label: 'Email', value: manager.email },
                    { label: 'WhatsApp', value: manager.whatsapp },
                    { label: 'Company', value: manager.companyName || '—' },
                    { label: 'Plan', value: `${LOCKED_DURATION} (Sales Navigator)` },
                    { label: 'Licenses', value: String(reps.length) },
                    { label: 'Est. Unit Price', value: unitPrice > 0 ? formatCurrency(unitPrice) : 'TBD' },
                    { label: 'Est. Total Price', value: estimatedTotal > 0 ? formatCurrency(estimatedTotal) : 'TBD' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-neutral-600 text-xs mb-0.5">{label}</p>
                      <p className="text-white font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                {manager.notes && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-neutral-600 text-xs mb-1">Notes</p>
                    <p className="text-neutral-300 text-sm">{manager.notes}</p>
                  </div>
                )}
              </div>

              {/* Reps summary */}
              <div className="glass border border-white/10 rounded-3xl p-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Rep Licenses ({reps.length})
                </h3>
                <div className="space-y-2">
                  {reps.map((rep, i) => (
                    <div
                      key={rep.uid}
                      className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-indigo-400">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {rep.name || rep.email}
                        </p>
                        {rep.name && (
                          <p className="text-xs text-neutral-500 truncate">{rep.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing note */}
              <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200/80 leading-relaxed">
                  Bulk Sales Navigator pricing is negotiated individually. Our team will
                  send you a custom quote via WhatsApp within 24 hours.
                </p>
              </div>

              {/* Error */}
              {submitError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{submitError}</p>
                </div>
              )}

              {/* Nav */}
              <div className="flex justify-between gap-4">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Edit Reps
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="min-w-[180px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit Order
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Trust strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 py-5 border-t border-white/5 opacity-40">
          {['SSL Secure', 'No Password Required', 'Full Warranty'].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone input styles */}
      <style>{`
        .b2b-phone-wrap .b2b-phone-input {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: white;
          display: flex;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .b2b-phone-wrap .b2b-phone-input:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
        }
        .b2b-phone-wrap .b2b-phone-error {
          border-color: rgba(239,68,68,0.6) !important;
        }
        .b2b-phone-wrap .PhoneInputInput {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 0.9375rem;
          margin-left: 0.625rem;
          width: 100%;
        }
        .b2b-phone-wrap .PhoneInputCountry {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          padding: 0 0.5rem;
          border-radius: 0.5rem;
        }
        .b2b-phone-wrap .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .b2b-phone-wrap .PhoneInputCountrySelect {
          background: #1a1a1a;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default BulkOrderForm;
