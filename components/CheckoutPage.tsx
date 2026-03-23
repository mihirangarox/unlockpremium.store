import React, { useState } from 'react';
import { m } from 'framer-motion';
import { useCart } from '../src/context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { saveRequest } from '../src/admin/services/db';
import type { IntakeRequest } from '../src/admin/types/index';
import { CheckCircle, CreditCard, User, ChevronRight, ShieldCheck, ShoppingBag, ArrowLeft } from 'lucide-react';

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
    transactionId: ''
  });

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
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500" />
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Order Received!</h2>
          <p className="text-neutral-400 mb-8">
            Thank you for your order. We have received your request and will process your activation once the bank transfer is verified. 
            Our support team will contact you via WhatsApp shortly.
          </p>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-8 text-left">
            <p className="text-sm font-bold text-white mb-1">What happens next?</p>
            <ol className="text-sm text-neutral-400 list-decimal pl-4 space-y-1">
              <li>Our team verifies your payment.</li>
              <li>You receive a unique activation link.</li>
              <li>Apply the link to your LinkedIn account.</li>
            </ol>
          </div>
          <Button variant="primary" as={Link} to="/" className="w-full justify-center">Return to Home</Button>
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
                        <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://linkedin.com/in/johndoe" />
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
                    <div className="space-y-4 mb-6">
                      {items.map(item => (
                        <div key={item.cartItemId} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-xs text-neutral-400">{item.durationMonths} Months</p>
                          </div>
                          <span className="font-black text-white">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-white/10">
                      <span className="text-lg font-medium text-neutral-400">Total to Pay</span>
                      <span className="text-3xl font-black text-indigo-400">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back to Details</Button>
                    <Button type="button" variant="primary" onClick={() => setStep(3)}>Continue to Payment</Button>
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
                    
                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 mb-8 text-indigo-100 space-y-3 font-mono text-sm leading-relaxed">
                      <div className="flex justify-between border-b border-indigo-500/20 pb-2">
                        <span className="text-indigo-400">Bank Name</span>
                        <span className="font-bold text-white">Example Global Bank</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/20 pb-2">
                        <span className="text-indigo-400">Account Name</span>
                        <span className="font-bold text-white">UnlockPremium LLC</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/20 pb-2">
                        <span className="text-indigo-400">Account Number</span>
                        <span className="font-bold text-white">1234 5678 9012 3456</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/20 pb-2">
                        <span className="text-indigo-400">SWIFT/BIC Code</span>
                        <span className="font-bold text-white">EXGBUS33XXX</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-indigo-400">Amount to Transfer</span>
                        <span className="font-black text-xl text-emerald-400">${totalPrice.toFixed(2)} USD</span>
                      </div>
                    </div>

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
                      <p className="text-xs text-neutral-500 mt-2">Entering this helps us verify your payment faster.</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back to Review</Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting} className={isSubmitting ? 'opacity-70' : ''}>
                      {isSubmitting ? 'Processing...' : 'Confirm Order'}
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
