import { useState, useEffect, useMemo } from "react";
import { 
  Search, AlertCircle, CheckCircle2, 
  Clock, XCircle, ArrowUpDown, 
  Edit, User, CreditCard, Send,
  Trash2, MoreHorizontal, Zap, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as db from "../../services/db";
import { useToast } from "../../components/ui/Toast";
import { useLocalization } from "../../../context/LocalizationContext";
import { getDaysLeft, formatDaysLeft, getDaysLeftColorClass } from "../../utils/dateUtils";
import type { Customer, Subscription } from "../../types/index";
import { motion, AnimatePresence } from "framer-motion";
import { generateInvoicePDF } from "../../utils/invoiceGenerator";
import { FileText } from "lucide-react";

interface SubWithCustomer {
  sub: Subscription;
  customer: Customer | undefined;
}

const CUSTOMER_COLORS = [
  'bg-blue-50 text-blue-600 ring-blue-100',
  'bg-emerald-50 text-emerald-600 ring-emerald-100',
  'bg-violet-50 text-violet-600 ring-violet-100',
  'bg-amber-50 text-amber-600 ring-amber-100',
  'bg-rose-50 text-rose-600 ring-rose-100',
  'bg-indigo-50 text-indigo-600 ring-indigo-100',
  'bg-cyan-50 text-cyan-600 ring-cyan-100',
];

const getCustomerColor = (name: string = '') => {
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return CUSTOMER_COLORS[hash % CUSTOMER_COLORS.length];
};

type SortField = 'renewalDate' | 'price' | 'customerName';
type SortOrder = 'asc' | 'desc';

export function Subscriptions() {
  const { showToast } = useToast();
  const { formatCurrency, formatDate } = useLocalization();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubWithCustomer[]>([]);
  const [liveStock, setLiveStock] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [durationFilter, setDurationFilter] = useState<string>("All");
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('renewalDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modal state
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  console.log('Subscriptions loaded', subs.length, selectedSubId, setSelectedSubId);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const [allSubs, customers, stock] = await Promise.all([
        db.getSubscriptions(),
        db.getCustomers(),
        db.getLiveStock()
      ]);
      const customerMap = new Map(customers.map(c => [c.id, c]));
      const mapped = allSubs.map(sub => ({
        sub,
        customer: customerMap.get(sub.customerId) as Customer | undefined
      }));
      setSubs(mapped);
      setLiveStock(stock);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Helper for Status Derivation
  const getSubStatus = (renewalDate: string): 'Active' | 'Due Soon' | 'Due Today' | 'Expired' => {
    const daysLeft = getDaysLeft(renewalDate);
    if (daysLeft < 0) return 'Expired';
    if (daysLeft === 0) return 'Due Today';
    if (daysLeft <= 7) return 'Due Soon';
    return 'Active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
      case 'Due Soon': return 'bg-amber-100 text-amber-700 border-amber-200 font-bold';
      case 'Due Today': return 'bg-rose-500 text-white border-rose-600 font-bold shadow-sm shadow-rose-200';
      case 'Expired': return 'bg-slate-800 text-white border-slate-900 font-bold';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const getRelativeDate = (date: string) => {
    const days = getDaysLeft(date);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Expired Yesterday';
    if (days > 0 && days <= 7) return `In ${days} days`;
    if (days < 0 && days > -7) return `${Math.abs(days)} days ago`;
    return formatDate(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Due Soon': return <Clock className="w-3.5 h-3.5" />;
      case 'Due Today': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'Expired': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const counts = { active: 0, soon: 0, today: 0, expired: 0, mrr: 0 };
    subs.forEach(({ sub }) => {
      const status = getSubStatus(sub.renewalDate);
      if (status === 'Active') counts.active++;
      else if (status === 'Due Soon') counts.soon++;
      else if (status === 'Due Today') counts.today++;
      else if (status === 'Expired') counts.expired++;
      
      // Calculate MRR: price / (durationMonths || 1)
      counts.mrr += sub.price / (sub.durationMonths || 1);
    });
    return counts;
  }, [subs]);

  // Derived Filtering and Sorting
  const filteredAndSortedSubs = useMemo(() => {
    return subs
      .filter(item => {
        const matchesSearch = 
          item.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customer?.whatsappNumber?.includes(searchTerm);
        
        const status = getSubStatus(item.sub.renewalDate);
        const matchesStatus = statusFilter === "All" || status === statusFilter;
        const matchesType = typeFilter === "All" || item.sub.subscriptionType === typeFilter;
        const matchesDuration = durationFilter === "All" || item.sub.durationMonths?.toString() === durationFilter;

        return matchesSearch && matchesStatus && matchesType && matchesDuration;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'renewalDate') {
          comparison = new Date(a.sub.renewalDate).getTime() - new Date(b.sub.renewalDate).getTime();
        } else if (sortField === 'price') {
          comparison = a.sub.price - b.sub.price;
        } else if (sortField === 'customerName') {
          comparison = (a.customer?.fullName || "").localeCompare(b.customer?.fullName || "");
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [subs, searchTerm, statusFilter, typeFilter, durationFilter, sortField, sortOrder]);

  const urgentSubs = useMemo(() => {
    return subs.filter(item => {
      const status = getSubStatus(item.sub.renewalDate);
      return status === 'Due Today' || status === 'Expired';
    }).sort((a, b) => new Date(a.sub.renewalDate).getTime() - new Date(b.sub.renewalDate).getTime());
  }, [subs]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedSubs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedSubs.map(s => s.sub.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    setDeleteConfirmId('bulk');
  };

  const handleSingleDelete = (id: string) => {
    setIsBulkDeleting(false);
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      if (isBulkDeleting) {
        await Promise.all(selectedIds.map(id => db.deleteSubscription(id)));
        showToast(`Successfully deleted ${selectedIds.length} subscriptions`, "success");
        setSelectedIds([]);
      } else {
        await db.deleteSubscription(deleteConfirmId);
        showToast("Subscription deleted successfully", "success");
      }
      loadSubscriptions();
    } catch (error) {
      console.error("Delete failed:", error);
      showToast("Delete failed", "error");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleQuickRenew = async (item: SubWithCustomer) => {
    if (!item.customer) return;
    
    // Find matching available code
    const availableCodes = liveStock.filter(c => 
      c.productId === item.sub.productId && 
      c.duration === item.sub.planDuration &&
      c.status === 'Available'
    );

    if (availableCodes.length === 0) {
      showToast(`No available codes in stock for ${item.sub.subscriptionType} (${item.sub.planDuration})`, "error");
      return;
    }

    const confirmRenew = window.confirm(`Found ${availableCodes.length} codes in stock. Use one for ${item.customer.fullName}?`);
    if (!confirmRenew) return;

    try {
      const codeToUse = availableCodes[0];
      
      // Calculate new renewal date
      const monthsToAdd = parseInt(item.sub.planDuration || item.sub.durationMonths?.toString() || '1');
      const oldDate = new Date(item.sub.renewalDate);
      const newRenewalDate = new Date(oldDate.setMonth(oldDate.getMonth() + monthsToAdd)).toISOString();

      const updatedSub: Subscription = {
        ...item.sub,
        startDate: item.sub.renewalDate, // New start is old renewal
        renewalDate: newRenewalDate,
        activationCode: codeToUse.code,
        updatedAt: new Date().toISOString()
      };

      // 1. Save renewal history
      await db.saveRenewalHistory({
        id: `rh_${Date.now()}`,
        customerId: item.sub.customerId,
        subscriptionId: item.sub.id,
        oldPlan: item.sub.planDuration,
        newPlan: item.sub.planDuration,
        amount: item.sub.price,
        cost: codeToUse.gbpPurchaseCost || codeToUse.costBasisUSDT || 0,
        profit: item.sub.price - (codeToUse.gbpPurchaseCost || codeToUse.costBasisUSDT || 0),
        renewedOn: new Date().toISOString(),
        paymentMethod: 'Automatic (Stock)',
        notes: `Quick Renew used code: ${codeToUse.code}`,
        createdAt: new Date().toISOString()
      });

      // 2. Update subscription
      await db.saveSubscription(updatedSub);

      // 3. Update code status
      await db.updateLiveStockStatus(codeToUse.id, 'Assigned', item.sub.id);

      showToast(`Successfully renewed for ${item.customer.fullName}!`, "success");
      loadSubscriptions();
    } catch (error) {
      console.error("Quick renew failed:", error);
      showToast("Renewal failed", "error");
    }
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDownloadInvoice = (item: SubWithCustomer) => {
    if (!item.customer) {
      showToast("Customer not found for this subscription", "error");
      return;
    }

    generateInvoicePDF({
      customerName: item.customer.fullName,
      subscriptionType: item.sub.subscriptionType,
      planDuration: item.sub.planDuration || `${item.sub.durationMonths}M`,
      startDate: formatDate(item.sub.startDate),
      renewalDate: formatDate(item.sub.renewalDate),
      amount: formatCurrency(item.sub.price),
      status: item.sub.paymentStatus || 'Paid',
      email: item.customer.email,
      whatsapp: item.customer.whatsappNumber
    });
    showToast("Invoice generated!", "success");
  };

  const handleSendReminder = (item: SubWithCustomer) => {
    if (!item.customer) return;
    const phone = item.customer.whatsappNumber.replace(/[^0-9]/g, '');
    const daysLeft = getDaysLeft(item.sub.renewalDate);
    const message = encodeURIComponent(`Hi ${item.customer.fullName}, your ${item.sub.subscriptionType} plan is renewing ${daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}. Price: ${formatCurrency(item.sub.price)}. Would you like to keep it active?`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    showToast(`Reminder flow opened for ${item.customer.fullName}`, "info");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Subscriptions</h1>
        <p className="text-slate-500 text-sm">Track all active, upcoming, and expired customer subscriptions.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total MRR" value={metrics.mrr} isCurrency icon={<ArrowUpDown className="w-5 h-5 text-indigo-600" />} bgColor="bg-indigo-50" />
        <MetricCard title="Active Subs" value={metrics.active} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} bgColor="bg-emerald-50" />
        <MetricCard title="Due in 7 Days" value={metrics.soon} icon={<Clock className="w-5 h-5 text-amber-600" />} bgColor="bg-amber-50" />
        <MetricCard title="Due Today" value={metrics.today} icon={<AlertCircle className="w-5 h-5 text-rose-600" />} bgColor="bg-rose-50" />
        <MetricCard title="Expired" value={metrics.expired} icon={<XCircle className="w-5 h-5 text-slate-600" />} bgColor="bg-slate-50" />
      </div>

      {/* Attention Required Section */}
      <AnimatePresence>
        {urgentSubs.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 px-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest">Attention Required ({urgentSubs.length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentSubs.slice(0, 6).map(item => (
                <div key={item.sub.id} className="bg-white rounded-3xl p-4 border-2 border-rose-100 shadow-sm flex items-center justify-between group hover:border-rose-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ring-1 ${getCustomerColor(item.customer?.fullName)}`}>
                      {item.customer?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">{item.customer?.fullName}</span>
                      <span className={`text-[10px] font-black uppercase ${getSubStatus(item.sub.renewalDate) === 'Due Today' ? 'text-rose-500' : 'text-slate-600'}`}>
                        {getRelativeDate(item.sub.renewalDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleQuickRenew(item)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                      title="Quick Renew from Stock"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => handleSendReminder(item)}
                       className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search customers, email, or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900"
              />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect 
              value={typeFilter} 
              onChange={setTypeFilter} 
              options={["All", "Premium Career", "Premium Business", "Premium Company Page", "Recruiter Lite", "Sales Navigator Core", "Sales Navigator Advanced", "Sales Navigator Advanced Plus"]} 
              label="Type"
            />
            <FilterSelect 
              value={durationFilter} 
              onChange={setDurationFilter} 
              options={["All", "1", "2", "3", "6", "9", "12"]} 
              label="Duration"
              formatOption={(opt) => opt === 'All' ? 'All Durations' : `${opt} month${opt !== '1' ? 's' : ''}`}
            />
            <FilterSelect 
              value={statusFilter} 
              onChange={setStatusFilter} 
              options={["All", "Active", "Due Soon", "Due Today", "Expired"]} 
              label="Status"
            />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-100">
              <tr className="bg-slate-50/50 text-slate-400">
                <th className="px-6 py-4 w-12">
                   <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                      checked={selectedIds.length === filteredAndSortedSubs.length && filteredAndSortedSubs.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => handleToggleSort('customerName')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
                    Customer
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest w-24 text-center">Dur.</th>
                <th className="px-6 py-4 w-32">
                  <button onClick={() => handleToggleSort('price')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
                    Price
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => handleToggleSort('renewalDate')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
                    Renewal
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredAndSortedSubs.map((item) => {
                  const daysLeft = getDaysLeft(item.sub.renewalDate);
                  const status = getSubStatus(item.sub.renewalDate);
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={item.sub.id} 
                      className={`hover:bg-slate-50/50 transition-colors group cursor-default ${selectedIds.includes(item.sub.id) ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                            checked={selectedIds.includes(item.sub.id)}
                            onChange={() => toggleSelect(item.sub.id)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => navigate(`/unlock-world-26/customers/${item.sub.customerId}`)}
                          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ring-1 ${getCustomerColor(item.customer?.fullName)}`}>
                            {item.customer?.fullName?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate text-sm">{item.customer?.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">{item.customer?.email}</span>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-slate-300" />
                          <span className="font-bold text-slate-600 text-xs truncate max-w-[120px]">{item.sub.subscriptionType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                          {item.sub.durationMonths}M
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900 text-sm">{formatCurrency(item.sub.price)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900">
                            {getRelativeDate(item.sub.renewalDate)}
                          </div>
                          <div className={`text-[10px] font-black uppercase tracking-tight ${getDaysLeftColorClass(daysLeft).split(' ')[0]}`}>
                            {formatDaysLeft(daysLeft)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            {status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {status === 'Due Today' && (
                            <button 
                              onClick={() => handleQuickRenew(item)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Quick Renew from Stock"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDownloadInvoice(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Download Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSendReminder(item)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Send WhatsApp Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <div className="h-4 w-px bg-slate-100 mx-1" />
                          <button 
                            onClick={() => navigate(`/unlock-world-26/customers/${item.sub.customerId}/edit`)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Edit Subscription"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSingleDelete(item.sub.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Subscription"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredAndSortedSubs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <CreditCard className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No subscriptions found</h3>
              <p className="text-slate-500 text-sm max-w-[280px] mt-1">
                Add a customer subscription to start tracking renewals.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center font-bold">
                {selectedIds.length}
              </div>
              <span className="font-bold text-sm">Subscriptions Selected</span>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                {isBulkDeleting 
                  ? `You are about to delete ${selectedIds.length} subscriptions. This action cannot be undone.`
                  : "Are you sure you want to delete this subscription? This will remove all associated history."}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Delete Sub"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ title, value, icon, bgColor, isCurrency }: { title: string, value: number, icon: React.ReactNode, bgColor: string, isCurrency?: boolean }) {
  const { formatCurrency } = useLocalization();
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{title}</p>
        <p className="text-2xl font-black text-slate-900 truncate">
          {isCurrency ? formatCurrency(value) : value}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options, label, formatOption }: { 
  value: string, 
  onChange: (val: string) => void, 
  options: string[], 
  label: string,
  formatOption?: (opt: string) => string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="py-1.5 pl-3 pr-8 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '0.75rem' }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{formatOption ? formatOption(opt) : opt}</option>
        ))}
      </select>
    </div>
  );
}
