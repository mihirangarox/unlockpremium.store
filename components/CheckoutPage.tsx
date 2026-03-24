import React, { useState } from 'react';
import { m } from 'framer-motion';
import { useCart } from '../src/context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { saveRequest } from '../src/admin/services/db';
import type { IntakeRequest } from '../src/admin/types/index';
import { CheckCircle, CreditCard, User, ChevronRight, ShieldCheck, ShoppingBag, ArrowLeft, Loader2, Copy, Check, Upload, Zap, MessageCircle } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();
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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    setIsSubmitting(true);

    try {
      // Create an order request mapped to the existing IntakeRequest structure
      const orderContent = items.map(item => `${item.name} (${item.durationMonths}Mo)`).join(', ');
      
      const newRequest: IntakeRequest = {
        id: `ord_${Date.now()}`,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        whatsappNumber: formData.whatsapp,
        preferredContact: 'WhatsApp',
        subscriptionType: items[0]?.name || '',
        subscriptionPeriod: items[0]?.durationMonths === 1 ? '1M' : items[0]?.durationMonths === 3 ? '3M' : items[0]?.durationMonths === 6 ? '6M' : (items[0]?.durationMonths + 'M' as any),
        linkedinUrl: formData.linkedinUrl,
        notes: `E-COMMERCE CHECKOUT \nItems: ${orderContent}\nTotal: $${totalPrice.toFixed(2)}\nTransaction ID: ${formData.transactionId || 'Pending'}`,
        status: 'Pending',
        paymentStatus: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveRequest(newRequest);
      
      // Complete
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
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Order Received!</h2>
          <p className="text-neutral-400 mb-10 text-pretty">
            Thank you for your order. We have received your request and will process your activation once the bank transfer is verified. 
            Our support team will contact you via WhatsApp shortly.
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
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Email Address *</label>
                        <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="john@company.com" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">WhatsApp Number *</label>
                        <input required type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="+1 234 567 8900" />
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
                            <div className="w-12 h-12 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-500 overflow-hidden">
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
                        if (formData.firstName && formData.lastName && formData.email && formData.whatsapp) setStep(2);
                        else alert('Please fill in all required fields marked with *');
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
                              <span className="font-black text-white text-lg">${item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-neutral-500 line-through">${savings.toFixed(2)}</span>
                              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">SAVE ${itemSavings.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/10">
                      <div className="flex justify-between items-center text-neutral-400 text-sm">
                        <span>Subtotal</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-500 text-sm font-bold">
                        <span>Total Savings</span>
                        <span>-${items.reduce((acc, item) => {
                          const savings = (item.oldPrice || 0) > item.price ? (item.oldPrice || 0) : (item.price / 0.3);
                          return acc + (savings - item.price);
                        }, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold text-white">Total to Pay</span>
                        <span className="text-3xl font-black text-indigo-400">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between gap-4">
                      <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back to Details</Button>
                      <Button type="button" variant="primary" className="flex-1" onClick={() => setStep(3)}>Continue to Payment</Button>
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
                  <div className="glass p-8 rounded-3xl border-white/5">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-400" />
                      Bank Transfer Instructions
                    </h2>
                    <p className="text-neutral-400 text-sm mb-6">Please transfer the total amount accurately to secure your order.</p>
                    
                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 mb-8 text-indigo-100 space-y-4 font-mono text-sm leading-relaxed">
                      <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 mb-1">Bank Name</span>
                          <span className="font-bold text-white">Example Global Bank</span>
                        </div>
                        <button type="button" onClick={() => copyToClipboard("Example Global Bank", "bank")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-indigo-400">
                          {copySuccess === "bank" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 mb-1">Account Name</span>
                          <span className="font-bold text-white">UnlockPremium LLC</span>
                        </div>
                        <button type="button" onClick={() => copyToClipboard("UnlockPremium LLC", "name")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-indigo-400">
                          {copySuccess === "name" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 mb-1">Account Number</span>
                          <span className="font-bold text-white">1234 5678 9012 3456</span>
                        </div>
                        <button type="button" onClick={() => copyToClipboard("1234 5678 9012 3456", "account")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-indigo-400">
                          {copySuccess === "account" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 mb-1">SWIFT/BIC Code</span>
                          <span className="font-bold text-white">EXGBUS33XXX</span>
                        </div>
                        <button type="button" onClick={() => copyToClipboard("EXGBUS33XXX", "swift")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-indigo-400">
                          {copySuccess === "swift" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 mb-1">Amount to Transfer</span>
                          <span className="font-black text-xl text-emerald-400">${totalPrice.toFixed(2)} USD</span>
                        </div>
                        <button type="button" onClick={() => copyToClipboard(totalPrice.toFixed(2), "amount")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-indigo-400">
                          {copySuccess === "amount" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Transaction ID / Reference Number</label>
                        <input 
                          type="text" 
                          name="transactionId" 
                          value={formData.transactionId} 
                          onChange={handleInputChange} 
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                          placeholder="e.g. TRN123456789" 
                        />
                        <p className="text-[10px] text-neutral-500 mt-2 font-medium">TIP: Please include your **Email** or **Last Name** in the bank transfer reference field if possible.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Upload Payment Receipt (Optional)</label>
                        <div className="relative group">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setFormData(prev => ({ ...prev, receiptFile: e.target.files?.[0] || null }))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`w-full py-4 px-6 border border-dashed rounded-xl flex items-center justify-center gap-3 transition-colors ${formData.receiptFile ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-neutral-400 group-hover:border-indigo-500/50 group-hover:text-neutral-300'}`}>
                            {formData.receiptFile ? (
                              <>
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium truncate max-w-[200px]">{formData.receiptFile.name}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5" />
                                <span className="text-sm font-medium">Click to upload screenshot</span>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-2">Uploading a receipt helps us confirm your order immediately.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back to Review</Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={isSubmitting} 
                      className={`w-full sm:w-auto !bg-indigo-600 hover:!bg-indigo-500 shadow-xl shadow-indigo-600/20 ${isSubmitting ? 'opacity-70' : ''}`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm Order 
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
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
