import React, { useState } from 'react';
import { m } from 'framer-motion';
import { useCart } from '../src/context/CartContext';
import { useLocalization } from '../src/context/LocalizationContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { saveRequest, getProducts, getStockCountForProduct } from '../src/admin/services/db';
import { alertService } from '../src/admin/services/alertService';
import type { IntakeRequest } from '../src/admin/types/index';
import { CheckCircle, CreditCard, User, ChevronRight, ShieldCheck, ShoppingBag, ArrowLeft, Loader2, Copy, Check, Upload, Zap, MessageCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const CheckoutPage: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { userCurrency, formatCurrency } = useLocalization();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
    linkedinUrl: '',
    transactionId: '',
    receiveViaWhatsApp: true,
    receiptFile: null as File | null
  });
  
  const [orderId] = useState<string>(`ord_${Date.now()}`);
  const [isLeadSaved, setIsLeadSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
  };
  
  const [isLinkedInVerifying, setIsLinkedInVerifying] = useState(false);
  const [isLinkedInVerified, setIsLinkedInVerified] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoneChange = (value?: string) => {
    setFormData(prev => ({ ...prev, whatsapp: value || '' }));
  };

  const handleCreateLead = async () => {
    if (items.length === 0 || isLeadSaved) return;
    
    setIsSubmitting(true);
    try {
      const orderContent = items.map(item => `${item.name} (${item.durationMonths}Mo)`).join(', ');
      const gbpEquivalent = items.reduce((sum, item) => {
        const tier = item.pricing?.find(p => p.durationMonths === item.durationMonths);
        return sum + (tier?.priceGBP || tier?.priceUSD || 0);
      }, 0);

      const newLead: IntakeRequest = {
        id: orderId,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        whatsappNumber: formData.whatsapp,
        preferredContact: 'WhatsApp',
        subscriptionType: items[0]?.name || '',
        subscriptionPeriod: items[0]?.durationMonths === 1 ? '1M' : items[0]?.durationMonths === 3 ? '3M' : items[0]?.durationMonths === 6 ? '6M' : (items[0]?.durationMonths + 'M' as any),
        linkedinUrl: formData.linkedinUrl,
        notes: `LEAD CAPTURE (Step 2) \nItems: ${orderContent}\nTotalValue: ${formatCurrency(totalPrice)}\nLedgerValue: £${gbpEquivalent.toFixed(2)}`,
        status: 'Lead',
        paymentStatus: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currency: userCurrency,
        amount: totalPrice,
        gbpEquivalent: gbpEquivalent
      } as any;

      await saveRequest(newLead);
      setIsLeadSaved(true);
      
      // Notify Admin (Handled by Cloud Function trigger on Firestore)
    } catch (error) {
      console.error("Lead capture failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    setIsSubmitting(true);

    try {
      const orderContent = items.map(item => `${item.name} (${item.durationMonths}Mo)`).join(', ');
      
      const gbpEquivalent = items.reduce((sum, item) => {
        const tier = item.pricing?.find(p => p.durationMonths === item.durationMonths);
        return sum + (tier?.priceGBP || tier?.priceUSD || 0); 
      }, 0);

      // Check if any item is a pre-order (stock = 0)
      let needsStock = false;
      try {
        const primaryItem = items[0];
        if (primaryItem?.id) {
          const stockCount = await getStockCountForProduct(primaryItem.id);
          needsStock = stockCount === 0;
        }
      } catch (_) { /* non-critical — skip if stock check fails */ }

      const baseNotes = `E-COMMERCE CHECKOUT \nItems: ${orderContent}\nTotalPaid: ${formatCurrency(totalPrice)}\nLedgerValue: £${gbpEquivalent.toFixed(2)}\nTransaction ID: ${formData.transactionId || 'Pending'}`;

      const updatedRequest: IntakeRequest = {
        id: orderId,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        whatsappNumber: formData.whatsapp,
        preferredContact: 'WhatsApp',
        subscriptionType: items[0]?.name || '',
        subscriptionPeriod: items[0]?.durationMonths === 1 ? '1M' : items[0]?.durationMonths === 3 ? '3M' : items[0]?.durationMonths === 6 ? '6M' : (items[0]?.durationMonths + 'M' as any),
        linkedinUrl: formData.linkedinUrl,
        notes: needsStock ? `[PENDING_STOCK] ${baseNotes}` : baseNotes,
        status: 'Pending',
        paymentStatus: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currency: userCurrency,
        amount: totalPrice,
        gbpEquivalent: gbpEquivalent
      } as any;

      await saveRequest(updatedRequest);
      
      clearCart();
      setIsSuccess(true);
      window.scrollTo(0, 0);

    } catch (error) {
      console.error("Order submission failed:", error);
      alert("There was an issue processing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
        <div className="text-center glass p-12 rounded-3xl border-white/5 max-w-lg mx-auto">
          <ShoppingBag className="w-16 h-16 text-indigo-500/50 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h2>
          <p className="text-neutral-400 mb-8">You need to add products to your cart before you can checkout.</p>
          <Button variant="primary" as={Link} to="/products">Return to Store</Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
        <m.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass p-12 rounded-3xl border-white/5 max-w-lg mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600" />
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Support Contacted!</h2>
          <p className="text-neutral-400 mb-10 text-pretty">
            Thank you for reaching out. We have received your order request and our support team is now standing by to provide your custom payment link. 
            Once payment is confirmed, your activation will be processed instantly.
          </p>
          
          {/* Status Tracker */}
          <div className="relative mb-12 px-2">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-white/5" />
            <div className="absolute top-4 left-0 w-1/3 h-0.5 bg-emerald-500" />
            
            <div className="flex justify-between relative z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Placed</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-indigo-500 flex items-center justify-center animate-pulse">
                  <Loader2 className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Verifying</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-600">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Activating</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-8 text-left">
            <p className="text-sm font-bold text-white mb-3">What happens next?</p>
            <ul className="text-sm text-neutral-400 space-y-3">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-indigo-400">1</span>
                </div>
                <span>Our team verifies your payment receipt.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-indigo-400">2</span>
                </div>
                <span>You receive a unique activation link.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-indigo-400">3</span>
                </div>
                <span>Apply the link to your LinkedIn account.</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" as={Link} to="/" className="flex-1 justify-center">Return to Home</Button>
            <Button 
              variant="outline" 
              className="flex-1 justify-center border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => window.open(`https://wa.me/447534317838?text=Hi, I just placed order for ${items[0]?.name}. Reference: ${formData.transactionId}`, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat Support
            </Button>
          </div>
        </m.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[#050505]">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Checkout Flow */}
          <div className="flex-1 lg:max-w-2xl">
            
            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-12 relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 -translate-y-1/2" />
              <div className={`absolute top-1/2 left-0 h-0.5 bg-indigo-500 -z-10 -translate-y-1/2 transition-all duration-500`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
              
              {[
                { num: 1, label: 'Details', icon: User },
                { num: 2, label: 'Review', icon: ShoppingBag },
                { num: 3, label: 'Payment', icon: CreditCard }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= s.num ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-zinc-900 border border-white/10 text-neutral-500'}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-semibold ${step >= s.num ? 'text-white' : 'text-neutral-500'}`}>{s.label}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              {/* Step 1: Guest Details */}
              {step === 1 && (
                <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="glass p-8 rounded-3xl border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-400" />
                      Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">First Name *</label>
                        <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Last Name *</label>
                        <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Doe" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="john@company.com" />
                      </div>
                      <div className="md:col-span-2 phone-input-container">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">WhatsApp Number</label>
                        <PhoneInput
                          placeholder="+1 234 567 8900"
                          value={formData.whatsapp}
                          onChange={handlePhoneChange}
                          defaultCountry="US"
                          international
                          className="checkout-phone-input"
                        />
                        <p className="mt-2 text-[10px] text-neutral-500">Please provide either Email or WhatsApp for delivery.</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">LinkedIn Profile URL</label>
                        <div className="flex gap-3">
                          <input 
                            type="url" 
                            name="linkedinUrl" 
                            value={formData.linkedinUrl} 
                            onChange={handleInputChange} 
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                            placeholder="https://linkedin.com/in/johndoe" 
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="shrink-0"
                            onClick={() => {
                              if (!formData.linkedinUrl) return;
                              setIsLinkedInVerifying(true);
                              setTimeout(() => {
                                setIsLinkedInVerifying(false);
                                setIsLinkedInVerified(true);
                              }, 1500);
                            }}
                            disabled={isLinkedInVerifying || !formData.linkedinUrl}
                          >
                            {isLinkedInVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : isLinkedInVerified ? "Verified" : "Verify Profile"}
                          </Button>
                        </div>
                        
                        {isLinkedInVerified && (
                          <m.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4"
                          >
                            <div className="w-12 h-12 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center text-neutral-500 overflow-hidden">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Profile Found</p>
                              <p className="text-xs text-neutral-400">Your activation will be linked to this account.</p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
                          </m.div>
                        )}
                      </div>

                      <div className="md:col-span-2 pt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div 
                            onClick={() => setFormData(prev => ({ ...prev, receiveViaWhatsApp: !prev.receiveViaWhatsApp }))}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${formData.receiveViaWhatsApp ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 transform ${formData.receiveViaWhatsApp ? 'translate-x-6' : 'translate-x-0'}`} />
                          </div>
                          <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
                            Receive activation link via WhatsApp instead of Email
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="primary" 
                      onClick={() => {
                        const hasContact = formData.email || formData.whatsapp;
                        const hasNames = formData.firstName && formData.lastName;
                        
                        if (hasNames && hasContact) setStep(2);
                        else if (!hasNames) alert('Please fill in your name.');
                        else alert('Please provide at least one contact method (Email or WhatsApp).');
                      }}
                    >
                      Continue to Review
                    </Button>
                  </div>
                </m.div>
              )}

              {/* Step 2: Review Order */}
              {step === 2 && (
                <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="glass p-8 rounded-3xl border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-indigo-400" />
                      Order Summary
                    </h2>
                    <div className="space-y-4 mb-8">
                      {items.map(item => {
                        const savings = (item.oldPrice || 0) > item.price ? (item.oldPrice || 0) : (item.price / 0.3); // Fallback to 70% if no oldPrice
                        const itemSavings = savings - item.price;
                        
                        return (
                          <div key={item.cartItemId} className="p-5 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-xs text-neutral-400">{item.durationMonths} Months</p>
                              </div>
                              <span className="font-black text-white text-lg">{formatCurrency(item.price)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-neutral-500 line-through">{formatCurrency(savings)}</span>
                              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">SAVE {formatCurrency(itemSavings)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/10">
                      <div className="flex justify-between items-center text-neutral-400 text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-500 text-sm font-bold">
                        <span>Total Savings</span>
                        <span>-{formatCurrency(items.reduce((acc, item) => {
                          const savings = (item.oldPrice || 0) > item.price ? (item.oldPrice || 0) : (item.price / 0.3);
                          return acc + (savings - item.price);
                        }, 0))}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold text-white">Total to Pay</span>
                        <span className="text-3xl font-black text-indigo-400">{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between gap-4">
                      <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back to Details</Button>
                      <Button 
                        type="button" 
                        variant="primary" 
                        className="flex-1" 
                        disabled={isSubmitting}
                        onClick={async () => {
                          await handleCreateLead();
                          setStep(3);
                        }}
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue to Payment"}
                      </Button>
                    </div>
                    
                    {/* Security Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-6 bg-white/5 rounded-3xl border border-white/5 grayscale opacity-50">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">SSL Secure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                      </div>
                    </div>
                  </div>
                </m.div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="glass p-8 rounded-3xl border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -z-10" />
                    
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-400" />
                      Payment Instructions
                    </h2>
                    <p className="text-neutral-400 text-sm mb-8">
                       To ensure your security and the fastest activation, we process payments manually via our <strong>Premium Concierge</strong>.
                    </p>
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-white space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Order Reference Reserved</p>
                          <p className="text-xs text-neutral-400 mt-1 font-mono">{orderId}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                        <p className="text-sm font-medium text-indigo-100 flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4" />
                           How to Pay:
                        </p>
                        <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                          We currently accept manual transfers via <strong>Bank (UK/EU/USA), PayPal, Wise, USDT (Crypto), or Credit/Debit Card</strong>. 
                          Please message our team below to receive the latest payment details.
                        </p>
                      </div>

                      <div className="pt-2">
                        <Button 
                          type="button" 
                          variant="primary" 
                          className="w-full justify-center !bg-emerald-600 hover:!bg-emerald-500 shadow-lg shadow-emerald-500/20 h-14"
                          onClick={() => {
                            const waMessage = encodeURIComponent(`Hi, my name is ${formData.firstName} and my Order Reference is ${orderId}. Please send me payment instructions for my ${items[0]?.name} subscription.`);
                            window.open(`https://wa.me/447534317838?text=${waMessage}`, '_blank');
                            
                            // Also trigger final submission to mark as "Pending Payment Verification" if they click
                            handleCheckoutSubmit({ preventDefault: () => {} } as any);
                          }}
                        >
                          <MessageCircle className="w-5 h-5 mr-3" />
                          Message Support for Payment Details
                        </Button>
                      </div>
                    </div>

                    <div className="text-center">
                       <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Secure Concierge Checkout</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back to Review</Button>
                  </div>
                </m.div>
              )}
            </form>
          </div>

          {/* Right Column: Trust Badges / Mini Summary */}
          <div className="hidden lg:block w-80 shrink-0 space-y-6">
            <div className="glass p-6 rounded-3xl border-white/5 sticky top-32">
              <h3 className="font-bold text-white mb-4">Why UnlockPremium?</h3>
              <ul className="space-y-4">
                {[
                  { title: "Safe & Legitimate", desc: "No passwords required. Official activation." },
                  { title: "Instant Access", desc: "Fast processing upon payment confirmation." },
                  { title: "Full Warranty", desc: "Guaranteed access for your entire term." }
                ].map((perk, i) => (
                  <li key={i} className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">{perk.title}</p>
                      <p className="text-xs text-neutral-400 leading-relaxed">{perk.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

// Style overrides for react-phone-number-input to match the glass theme
const styleOverrides = `
  .phone-input-container .checkout-phone-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: white;
    display: flex;
    transition: all 0.2s;
  }

  .phone-input-container .checkout-phone-input:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }

  .phone-input-container .PhoneInputInput {
    background: transparent;
    border: none;
    color: white;
    outline: none;
    font-size: 1rem;
    margin-left: 0.75rem;
    width: 100%;
  }

  .phone-input-container .PhoneInputCountry {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    padding: 0 0.5rem;
    border-radius: 0.5rem;
    margin-right: -0.25rem;
  }

  .phone-input-container .PhoneInputCountryIcon {
    width: 1.5rem;
    height: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  .phone-input-container .PhoneInputCountrySelect {
    background: #1a1a1a;
    color: white;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(styleOverrides));
  document.head.appendChild(style);
}
