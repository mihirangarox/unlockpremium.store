import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Globe, Clock, Edit, Trash2, Shield, MessageSquare, TrendingUp, Linkedin, Activity, Plus, Hash, ShieldCheck, Star, Tag, DollarSign, ClipboardList, Save, X } from "lucide-react";
import * as db from "../../services/db";
import { useToast } from "../../components/ui/Toast";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import type { Customer, Subscription, CustomerNote, DigitalCode } from "../../types/index";
import { getDaysLeft, formatDaysLeft, getDaysLeftColorClass } from "../../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";

export function CustomerDetail() {
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [assignedCodes, setAssignedCodes] = useState<DigitalCode[]>([]);
  const [lifetimeValue, setLifetimeValue] = useState(0);
  
  // Modal & Input state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // Admin Settings Editing
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [discountTier, setDiscountTier] = useState<Customer['discountTier']>('Bronze');
  const [fixedPrice, setFixedPrice] = useState("");

  useEffect(() => {
    if (id) {
      (async () => {
        const foundCustomer = await db.getCustomer(id);
        if (foundCustomer) {
          setCustomer(foundCustomer);
          setInternalNotes(foundCustomer.internalNotes || "");
          setDiscountTier(foundCustomer.discountTier || "Bronze");
          setFixedPrice(foundCustomer.fixedPrice?.toString() || "");

          const [subs, value, codes] = await Promise.all([
            db.getCustomerSubscriptions(id),
            db.getCustomerValue(id),
            db.getCustomerDigitalCodes(foundCustomer.whatsappNumber, foundCustomer.email)
          ]);
          setSubscriptions(subs);
          setLifetimeValue(value);
          setAssignedCodes(codes);
        }
      })();
    }
  }, [id]);

  const handleConfirmDelete = async () => {
    if (!customer) return;
    await db.deleteCustomer(customer.id);
    showToast(`${customer.fullName} deleted successfully`, "success");
    navigate("/customers");
  };

  const handleAddNote = async () => {
    if (!customer || !newNote.trim()) return;

    const note: CustomerNote = {
      id: `n_${Date.now()}`,
      date: new Date().toISOString(),
      text: newNote.trim()
    };

    const updatedCustomer: Customer = {
      ...customer,
      notes: Array.isArray(customer.notes) ? [note, ...customer.notes] : [note],
      updatedAt: new Date().toISOString()
    };

    await db.saveCustomer(updatedCustomer);
    setCustomer(updatedCustomer);
    setNewNote("");
    setIsAddingNote(false);
    showToast("Note added to timeline", "success");
  };

  const handleSaveAdminSettings = async () => {
    if (!customer) return;

    const updatedCustomer: Customer = {
      ...customer,
      internalNotes,
      discountTier,
      fixedPrice: fixedPrice ? parseFloat(fixedPrice) : undefined,
      updatedAt: new Date().toISOString()
    };

    await db.saveCustomer(updatedCustomer);
    setCustomer(updatedCustomer);
    setIsEditingAdmin(false);
    showToast("Admin settings updated", "success");
  };

  const handleQuickRenew = async (sub: Subscription) => {
    if (!customer) return;
    
    // Logic: Create a new renewal record using fixedPrice if available, otherwise market price
    const renewalPrice = customer.fixedPrice || sub.price;
    const daysToAdd = sub.planDuration === '1M' ? 30 : 365; // Corrected from '1 Month' to '1M'
    const newRenewalDate = new Date(new Date(sub.renewalDate).getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    const updatedSub: Subscription = {
      ...sub,
      renewalDate: newRenewalDate,
      price: renewalPrice,
      updatedAt: new Date().toISOString()
    };

    try {
      await db.saveSubscription(updatedSub);
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? updatedSub : s));
      
      // Auto-log the activity
      await db.logActivity({
        id: `log_${Date.now()}`,
        activityType: 'subscription_renewal',
        customerId: customer.id,
        description: `Quick Renewal processed for ${sub.subscriptionType} (£${renewalPrice})`,
        createdAt: new Date().toISOString()
      });

      showToast(`Renewed until ${new Date(newRenewalDate).toLocaleDateString()}`, "success");
    } catch (error) {
       showToast("Quick renewal failed", "error");
    }
  };

  if (!customer) return <div className="p-8 text-center text-slate-500">Loading customer profile...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate("/customers")}
          className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Customers
        </button>
        <div className="flex items-center gap-3">
          <Link 
            to={`/customers/${customer.id}/edit`}
            className="inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 text-slate-700 px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Link>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center justify-center bg-white border border-red-100 hover:bg-red-50 text-red-600 px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Health Info Indicator */}
      {subscriptions.length > 0 && (
        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ${getDaysLeftColorClass(getDaysLeft(subscriptions[0].renewalDate))}`}>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center animate-pulse">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Customer Health</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black">Active</span>
                  <span className="text-sm font-medium opacity-60">• {subscriptions[0].planDuration} Plan</span>
                </div>
              </div>
           </div>
           <div className="text-left md:text-right">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Renewal Status</p>
              <p className="text-lg font-black mt-0.5">
                {formatDaysLeft(getDaysLeft(subscriptions[0].renewalDate))}
              </p>
              <p className="text-[10px] font-bold opacity-50 uppercase">{new Date(subscriptions[0].renewalDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
           </div>
        </div>
      )}

      {/* Main Stats and Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[220px]">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield className="w-32 h-32" />
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center relative z-10 text-center md:text-left">
            <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-200 shrink-0">
              {customer.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{customer.fullName}</h1>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">{customer.leadSource}</span>
                {customer.orderCount && customer.orderCount > 1 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm animate-pulse">
                    <Star className="w-3 h-3 fill-amber-500" />
                    Repeat Client ({customer.orderCount} Orders)
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-300" />
                  <span className="text-sm font-semibold text-slate-600">{customer.email}</span>
                </div>
                {customer.linkedinUrl && (
                  <a 
                    href={customer.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm font-medium">LinkedIn Profile</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
               <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lifetime Value</p>
            <p className="text-4xl font-black text-slate-900">£{lifetimeValue.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 mt-2 italic">Total revenue generated</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {/* Subscriptions section */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Subscription Management
            </h2>
            
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium italic">No active subscriptions found</p>
                </div>
              ) : (
                subscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold group-hover:text-indigo-600 transition-colors shadow-sm">
                        £
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg">{sub.subscriptionType || `${sub.planDuration} Plan`}</div>
                        <div className="text-xs text-slate-500 font-medium">{sub.subscriptionType ? `${sub.planDuration} plan • ` : ''}Renewal: {new Date(sub.renewalDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <div className="font-black text-slate-900 text-xl">£{sub.price}</div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{sub.status}</span>
                      </div>
                      <button 
                        onClick={() => handleQuickRenew(sub)}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        title="One-Click Quick Renewal"
                      >
                         <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Product History Section */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-500" />
                Digital Product History
             </h2>
             
             {assignedCodes.length === 0 ? (
               <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                  <Tag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium italic">No historical digital codes found for this user contact info.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {assignedCodes.map(code => (
                   <div key={code.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600">
                           <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{code.productName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{code.duration} Plan • Claimed {new Date(code.assignedAt || code.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Activation Key</p>
                         <code className="text-xs font-bold text-indigo-600 break-all">{code.code}</code>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

          {/* Contact details with quick action */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-500" />
                Contact Information
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp Number</div>
                   <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-slate-900">{customer.whatsappNumber}</span>
                      <a 
                        href={`https://wa.me/${customer.whatsappNumber.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100"
                      >
                         <MessageSquare className="w-3.5 h-3.5" />
                         Open Chat
                      </a>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</div>
                   <div className="text-xl font-bold text-slate-900 truncate">{customer.email}</div>
                </div>
                <div className="space-y-4">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Market / Country</div>
                   <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-slate-300" />
                      {customer.country}
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer ID</div>
                   <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                       <Hash className="w-5 h-5 text-slate-300" />
                       {customer.id.replace('c_', '')}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Admin Settings & Timeline */}
        <div className="space-y-8">
          {/* Admin Loyalty Settings */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-24 h-24 text-indigo-400" />
             </div>
             
             <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Shield className="w-4 h-4 text-indigo-400" />
                   Loyalty Settings
                </h2>
                <button 
                  onClick={() => setIsEditingAdmin(!isEditingAdmin)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                >
                  {isEditingAdmin ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </button>
             </div>

             <div className="space-y-8 relative z-10">
                {isEditingAdmin ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Internal Admin Notes</label>
                      <textarea 
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Private notes about negotiations..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[100px] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Discount Tier</label>
                        <select 
                          value={discountTier}
                          onChange={(e) => setDiscountTier(e.target.value as any)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Bronze" className="text-slate-900">Bronze</option>
                          <option value="Silver" className="text-slate-900">Silver</option>
                          <option value="Gold" className="text-slate-900">Gold</option>
                          <option value="Platinum" className="text-slate-900">Platinum</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Fixed Price (£)</label>
                        <input 
                          type="number"
                          value={fixedPrice}
                          onChange={(e) => setFixedPrice(e.target.value)}
                          placeholder="e.g. 45"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveAdminSettings}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Apply VIP Settings
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Private Context</p>
                      <p className="text-sm font-medium text-slate-300 italic leading-relaxed">
                        {customer.internalNotes || "No internal admin notes saved for this client."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tier</p>
                          <p className="text-lg font-black text-indigo-400 capitalize">{customer.discountTier || 'Standard'}</p>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Legacy Price</p>
                          <p className="text-lg font-black text-emerald-400">
                             {customer.fixedPrice ? `£${customer.fixedPrice.toFixed(2)}` : 'Market'}
                          </p>
                       </div>
                    </div>
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Timeline Notes
              </h2>
              <button 
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors"
              >
                <Plus className={`w-5 h-5 transition-transform ${isAddingNote ? 'rotate-45' : ''}`} />
              </button>
            </div>

            {isAddingNote && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100"
              >
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type a new note..."
                  className="w-full bg-white border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[100px] mb-3"
                />
                <div className="flex justify-end gap-2">
                   <button onClick={() => setIsAddingNote(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancel</button>
                   <button 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                   >
                     Add Entry
                   </button>
                </div>
              </motion.div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 relative">
               {/* Timeline line */}
               <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100 z-0"></div>

              {(!customer.notes || (Array.isArray(customer.notes) && customer.notes.length === 0)) ? (
                <div className="text-center py-10 italic text-slate-400 text-sm">No history yet.</div>
              ) : (
                (Array.isArray(customer.notes) ? customer.notes : [{ id: '1', date: customer.createdAt, text: customer.notes as string }]).map((note: CustomerNote) => (
                  <div key={note.id} className="relative z-10 pl-8">
                     <div className="absolute left-0 top-[6px] w-4 h-4 rounded-full bg-white border-4 border-indigo-500"></div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </div>
                     <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-50">
                        {note.text}
                     </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Created</p>
               <p className="text-sm font-bold text-slate-900 mt-1">{new Date(customer.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer?.fullName}? This action cannot be undone and will remove all their records.`}
        confirmLabel="Delete Customer"
        isDestructive={true}
      />
    </div>
  );
}
