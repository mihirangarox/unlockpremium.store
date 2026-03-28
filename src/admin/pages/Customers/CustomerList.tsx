import { useState, useEffect } from "react";
import { Search, Filter, Plus, User, Mail, Phone, MoreHorizontal, Trash2, Calendar, MessageCircle, ExternalLink, Check, X, Download, AlertCircle, CheckCircle2, ShieldCheck, Star, GitMerge } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import * as db from "../../services/db";
import { useToast } from "../../components/ui/Toast";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { getDaysLeft } from "../../utils/dateUtils";
import type { Customer, Subscription } from "../../types/index";
import { m, AnimatePresence } from "framer-motion";

export function CustomerList() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Merge state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState<Customer | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Customer | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  // Search persistence with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (searchTerm !== current) {
        if (searchTerm) {
          setSearchParams({ search: searchTerm }, { replace: true });
        } else {
          setSearchParams({}, { replace: true });
        }
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, searchParams, setSearchParams]);

  useEffect(() => {
    (async () => {
      const [customersData, subscriptionsData] = await Promise.all([
        db.getCustomers(),
        db.getSubscriptions()
      ]);
      setCustomers(customersData);
      setSubscriptions(subscriptionsData);
    })();
  }, []);

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-indigo-50 text-indigo-600 ring-indigo-100',
      'bg-emerald-50 text-emerald-600 ring-emerald-100',
      'bg-amber-50 text-amber-600 ring-amber-100',
      'bg-rose-50 text-rose-600 ring-rose-100',
      'bg-purple-50 text-purple-600 ring-purple-100',
      'bg-cyan-50 text-cyan-600 ring-cyan-100',
      'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source?.toUpperCase()) {
      case 'WHATSAPP': return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'REDDIT': return 'bg-orange-50 text-orange-700 ring-orange-100';
      case 'ORGANIC': return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'LINKEDIN': return 'bg-indigo-50 text-indigo-700 ring-indigo-100';
      default: return 'bg-slate-50 text-slate-600 ring-slate-100';
    }
  };

  const initiateDelete = (id: string, name: string) => {
    setCustomerToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (customerToDelete) {
        // Single delete
        await db.deleteCustomer(customerToDelete.id);
        setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
        showToast(`${customerToDelete.name} deleted successfully`, "success");
      } else if (selectedIds.length > 0) {
        // Bulk delete
        await Promise.all(selectedIds.map(id => db.deleteCustomer(id)));
        setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)));
        showToast(`Deleted ${selectedIds.length} customers`, "success");
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Deletion failed:", error);
      showToast("Failed to delete records", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  };

  const getCustomerStatus = (customerId: string) => {
    const sub = subscriptions.find(s => s.customerId === customerId);
    if (!sub) return { label: 'No Subscription', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
    
    if (sub.status === 'Cancelled') return { label: 'Cancelled', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
    
    const daysLeft = getDaysLeft(sub.renewalDate);
    
    if (daysLeft < 0 || sub.status === 'Expired') {
      return { label: 'Expired', color: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' };
    }
    if (daysLeft <= 7) {
      return { label: 'Due Soon', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
    }
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.whatsappNumber.includes(searchTerm);
    
    // Source filter
    const matchesSource = sourceFilter === "All" || c.leadSource === sourceFilter;
    
    // Status filter
    const status = getCustomerStatus(c.id);
    const matchesStatus = statusFilter === "All" || status.label === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "All") {
      const createdDate = new Date(c.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      if (dateFilter === "7d") matchesDate = diffDays <= 7;
      if (dateFilter === "30d") matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesSource && matchesStatus && matchesDate;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) return;

    try {
      await Promise.all(selectedIds.map(id => db.deleteCustomer(id)));
      setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      showToast(`Deleted ${selectedIds.length} customers`, "success");
    } catch (err) {
      showToast("Failed to delete some customers", "error");
    }
  };

  const isPotentialDuplicate = (customer: Customer) => {
    return customers.find(c => 
      c.id !== customer.id && 
      (c.fullName.toLowerCase() === customer.fullName.toLowerCase() || 
       c.email.toLowerCase() === customer.email.toLowerCase() && c.email !== '' ||
       c.whatsappNumber === customer.whatsappNumber && c.whatsappNumber !== '')
    );
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget) return;
    setIsMerging(true);
    try {
      await db.mergeCustomers(mergeSource.id, mergeTarget.id);
      setCustomers(prev => prev.filter(c => c.id !== mergeSource.id));
      showToast(`${mergeSource.fullName} merged into ${mergeTarget.fullName}`, "success");
      setIsMergeModalOpen(false);
    } catch (error) {
      showToast("Merge failed", "error");
    } finally {
      setIsMerging(false);
      setMergeSource(null);
      setMergeTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Customers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your customer database and lead sources.</p>
        </div>
        <Link 
          to="/customers/new" 
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="p-4 border-b border-slate-50 flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                className="bg-transparent border-none text-xs focus:ring-0 font-bold text-slate-600 appearance-none cursor-pointer pr-6"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="All">All Sources</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Direct">Direct</option>
                <option value="Organic">Organic</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                className="bg-transparent border-none text-xs focus:ring-0 font-bold text-slate-600 appearance-none cursor-pointer pr-6"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="No Subscription">No Plan</option>
                <option value="Expired">Expired</option>
                <option value="Due Soon">Due Soon</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select 
                className="bg-transparent border-none text-xs focus:ring-0 font-bold text-slate-600 appearance-none cursor-pointer pr-6"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="All">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="w-12 px-6 py-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-10" />
                    <p className="font-medium italic">No customers found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                  filteredCustomers.map((customer) => {
                    const status = getCustomerStatus(customer.id);
                    const sub = subscriptions.find(s => s.customerId === customer.id);
                    const isSelected = selectedIds.includes(customer.id);
                    const isDuplicate = isPotentialDuplicate(customer);
                    
                    return (
                      <tr 
                        key={customer.id} 
                        className={`hover:bg-indigo-50/30 transition-all group ${isSelected ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleSelect(customer.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ring-1 ring-inset uppercase ${getAvatarColor(customer.fullName)}`}>
                              {customer.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link to={`/unlock-world-26/customers/${customer.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                                  {customer.fullName}
                                </Link>
                                {isDuplicate && (
                                  <button 
                                    onClick={() => {
                                      setMergeSource(customer);
                                      setMergeTarget(isDuplicate);
                                      setIsMergeModalOpen(true);
                                    }}
                                    className="p-1 hover:bg-amber-100 rounded-md transition-colors"
                                    title={`Merge duplicate with ${isDuplicate.fullName}`}
                                  >
                                    <GitMerge className="w-3.5 h-3.5 text-amber-600" />
                                  </button>
                                )}
                                {customer.orderCount && customer.orderCount > 1 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black" title={`${customer.orderCount} Orders`}>
                                    <ShieldCheck className="w-3 h-3" />
                                    {customer.orderCount}
                                  </span>
                                )}
                                {customer.orderCount && customer.orderCount >= 5 && (
                                  <span title="VIP Customer (5+ Orders)">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                                  </span>
                                )}
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight mt-1 ${getSourceBadgeColor(customer.leadSource)} ring-1 ring-inset`}>
                                {customer.leadSource}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {sub ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-700">{sub.planDuration} Plan</div>
                                <div className="text-[10px] font-medium text-slate-400">Renews {new Date(sub.renewalDate).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ) : (
                            <Link 
                              to={`/unlock-world-26/customers/${customer.id}`} 
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors px-2 py-1 bg-indigo-50 rounded-md ring-1 ring-indigo-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Assign Plan
                            </Link>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <a 
                              href={`mailto:${customer.email}`}
                              className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm hover:ring-1 hover:ring-slate-200 transition-all"
                              title={customer.email}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                            <a 
                              href={`https://wa.me/${customer.whatsappNumber.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-white hover:text-emerald-600 hover:shadow-sm hover:ring-1 hover:ring-slate-200 transition-all"
                              title={customer.whatsappNumber}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link 
                              to={`/unlock-world-26/customers/${customer.id}/edit`}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                              title="Edit"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => initiateDelete(customer.id, customer.fullName)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Bulk Action Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <m.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-30 ring-1 ring-white/10"
            >
              <div className="flex items-center gap-2 pr-6 border-r border-white/10">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                  {selectedIds.length}
                </div>
                <span className="text-sm font-medium text-slate-300">Selected</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-2 hover:text-rose-400 transition-colors text-sm font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button 
                  className="flex items-center gap-2 hover:text-indigo-400 transition-colors text-sm font-bold"
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Full Name,Email,WhatsApp,Source\n"
                      + customers.filter(c => selectedIds.includes(c.id)).map(c => `${c.fullName},${c.email},${c.whatsappNumber},${c.leadSource}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="flex items-center gap-2 hover:text-slate-400 transition-colors text-sm font-bold ml-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        isOpen={isMergeModalOpen}
        onClose={() => {
          setIsMergeModalOpen(false);
          setMergeSource(null);
          setMergeTarget(null);
        }}
        onConfirm={handleMerge}
        title="Merge Customer Profiles"
        message={mergeSource && mergeTarget ? `Are you sure you want to merge ${mergeSource.fullName} into ${mergeTarget.fullName}? All history will be moved and ${mergeSource.fullName} will be deleted.` : ""}
        confirmLabel={isMerging ? "Merging..." : "Merge Records"}
        isDestructive={false}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={customerToDelete ? "Delete Customer" : "Delete Multiple Customers"}
        message={
          customerToDelete 
            ? `Are you sure you want to delete ${customerToDelete.name}? This action cannot be undone.` 
            : `Are you sure you want to delete ${selectedIds.length} selected customers? This action cannot be undone.`
        }
        confirmLabel={customerToDelete ? "Delete Customer" : `Delete ${selectedIds.length} Customers`}
        isDestructive={true}
      />
    </div>
  );
}
