import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, SearchX, Calendar, ChevronRight, CheckCircle2, XCircle, Clock, ArrowUpDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as db from "../../services/db";
import { useLocalization } from "../../../context/LocalizationContext";
import type { IntakeRequest, RequestStatus } from "../../types/index";

export function RequestList() {
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatDate } = useLocalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("All");
  const [contactFilter, setContactFilter] = useState<"All" | "WhatsApp" | "Email" | "Reddit">("All");
  const [sortBy, setSortBy] = useState<"date" | "plan">("date");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [groupByContact, setGroupByContact] = useState(false);
  const [ageFilter, setAgeFilter] = useState<"All" | "7d">("All");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await db.getRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.whatsappNumber.includes(searchTerm) ||
      req.whatsappNumber.slice(-4).includes(searchTerm) ||
      (req.subscriptionType && req.subscriptionType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Default hiding Archived and Spam
    const matchesStatus = statusFilter === "All" 
      ? (req.status !== "Archived" && req.status !== "Spam")
      : req.status === statusFilter;
      
    const matchesContact = contactFilter === "All" || req.preferredContact === contactFilter;
    
    const matchesAge = ageFilter === "All" || (
      new Date().getTime() - new Date(req.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000
    );
    
    return matchesSearch && matchesStatus && matchesContact && matchesAge;
  }).sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
    } else {
      const planA = a.subscriptionType || "";
      const planB = b.subscriptionType || "";
      return sortDirection === "desc" ? planB.localeCompare(planA) : planA.localeCompare(planB);
    }
  });

  // Grouping logic
  const displayRequests = groupByContact ? (() => {
    const groups: Record<string, IntakeRequest[]> = {};
    filteredRequests.forEach(req => {
      const key = req.whatsappNumber || req.email || req.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(req);
    });
    return Object.values(groups).map(group => ({
      ...group[0],
      groupCount: group.length,
      groupIds: group.map(r => r.id)
    }));
  })() : filteredRequests;

  const toggleSort = (field: "date" | "plan") => {
    if (sortBy === field) {
      setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRequests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkAction = async (action: "Reject" | "Spam" | "Archive" | "Delete") => {
    if (selectedIds.length === 0) return;
    
    const confirmMsg = action === "Delete" 
      ? `Permanently delete ${selectedIds.length} requests? This cannot be undone.`
      : `Mark ${selectedIds.length} requests as ${action}?`;
      
    if (!window.confirm(confirmMsg)) return;

    setIsProcessingBulk(true);
    try {
      if (action === "Delete") {
        await Promise.all(selectedIds.map(id => db.deleteRequest(id)));
      } else {
        const statusMap = { Reject: "Rejected", Spam: "Spam", Archive: "Archived" };
        const newStatus = (statusMap as any)[action] as RequestStatus;
        
        const updates = selectedIds.map(id => {
          const req = requests.find(r => r.id === id);
          if (!req) return Promise.resolve();
          return db.saveRequest({ ...req, status: newStatus, updatedAt: new Date().toISOString() });
        });
        await Promise.all(updates);
      }
      await loadRequests();
      setSelectedIds([]);
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleDeleteRequest = async (id: string, isApproved: boolean) => {
    if (isApproved) {
      if (!window.confirm("This request is already APPROVED. Are you sure you want to delete it? This data is important for your sales records.")) {
        return;
      }
    } else {
      if (!window.confirm("Permanently delete this request?")) return;
    }

    try {
      await db.deleteRequest(id);
      await loadRequests();
      if (selectedIds.includes(id)) {
        setSelectedIds(prev => prev.filter(i => i !== id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const checkDuplicate = (request: IntakeRequest) => {
    const contact = request.whatsappNumber || request.email;
    if (!contact) return false;
    
    return requests.some(r => 
      r.id !== request.id && 
      (r.whatsappNumber === request.whatsappNumber || r.email === request.email) &&
      Math.abs(new Date(r.createdAt).getTime() - new Date(request.createdAt).getTime()) < 24 * 60 * 60 * 1000
    );
  };

  const totalReqs = requests.length;
  const pendingReqs = requests.filter(r => r.status === "Pending").length;
  const approvedReqs = requests.filter(r => r.status === "Approved").length;
  const conversionRate = totalReqs > 0 ? Math.round((approvedReqs / totalReqs) * 100) : 0;

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/10';
      case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/10';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-500/10';
      case 'Spam': return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'Archived': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'Pending': return <Clock className="w-3.5 h-3.5" />;
      case 'Approved': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Rejected': return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Incoming Requests</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">The "Waiting Room" for your revenue. Process requests and clean up spam.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGroupByContact(!groupByContact)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
              groupByContact 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20' 
              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {groupByContact ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {groupByContact ? 'Grouped by Contact' : 'Individual View'}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Requests</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{totalReqs}</div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Pending</span>
            <div className="text-3xl font-black text-amber-900 mt-2">{pendingReqs}</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Approved</span>
            <div className="text-3xl font-black text-emerald-900 mt-2">{approvedReqs}</div>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-200 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Conversion</span>
            <div className="text-3xl font-black text-indigo-900 mt-2">{conversionRate}%</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, WhatsApp (or last 4 digits)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
            />
          </div>
          <div className="flex-[1] min-w-[140px]">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Archived">Archived</option>
                <option value="Spam">Spam</option>
              </select>
            </div>
          </div>
          <div className="flex-[1] min-w-[140px]">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
              >
                <option value="All">All Time</option>
                <option value="7d">Older than 7 days</option>
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => handleBulkAction('Archive')}
              className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
            >
              Archive Rejected
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl p-4 flex items-center gap-6 shadow-2xl border border-white/10 min-w-[400px]"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-black text-sm">
                {selectedIds.length}
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-300">Requests Selected</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkAction('Reject')}
                disabled={isProcessingBulk}
                className="px-4 py-2 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Reject
              </button>
              <button 
                onClick={() => handleBulkAction('Spam')}
                disabled={isProcessingBulk}
                className="px-4 py-2 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-2"
              >
                <Filter className="w-4 h-4 text-amber-400" />
                Spam
              </button>
              <button 
                onClick={() => handleBulkAction('Archive')}
                disabled={isProcessingBulk}
                className="px-4 py-2 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-indigo-400" />
                Archive
              </button>
              <button 
                onClick={() => handleBulkAction('Delete')}
                disabled={isProcessingBulk}
                className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-900/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete Forever
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 w-12 bg-slate-50">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === displayRequests.length && displayRequests.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition group bg-slate-50" onClick={() => toggleSort("date")}>
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className={`w-3.5 h-3.5 ml-2 ${sortBy === 'date' ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-500'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">Name & Contact</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition group bg-slate-50" onClick={() => toggleSort("plan")}>
                  <div className="flex items-center">
                    Requested Subscription
                    <ArrowUpDown className={`w-3.5 h-3.5 ml-2 ${sortBy === 'plan' ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-500'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="font-medium">Loading requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <SearchX className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-900 text-lg">No requests found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  displayRequests.map((request) => {
                    const isDuplicate = checkDuplicate(request);
                    const isGroup = (request as any).groupCount > 1;
                    
                    return (
                      <motion.tr 
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`hover:bg-slate-50/80 transition-colors group ${selectedIds.includes(request.id) ? 'bg-indigo-50/30' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(request.id)}
                            onChange={(e) => handleSelect(request.id, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleSelect(request.id, !selectedIds.includes(request.id))}>
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm font-bold text-slate-900">
                              <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              {formatDate(request.createdAt)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium ml-5 italic">
                              {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-slate-900">{request.fullName}</div>
                            {isDuplicate && !isGroup && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-0.5">
                                <Filter className="w-2.5 h-2.5" />
                                Duplicate
                              </span>
                            )}
                            {isGroup && (
                              <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded text-[9px] font-black uppercase tracking-tighter shadow-sm">
                                { (request as any).groupCount } Requests
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <span className="font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase">
                              {request.preferredContact}
                            </span>
                            <span className="font-mono">
                              {request.preferredContact === 'WhatsApp' ? request.whatsappNumber :
                               request.preferredContact === 'Email' ? request.email :
                               request.redditUsername}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900 tracking-tight">{request.subscriptionType}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wider text-[10px] opacity-60 italic">{request.subscriptionPeriod} plan</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black border tracking-wide shadow-sm ${getStatusColor(request.status)}`}>
                            <span className="mr-1.5">{getStatusIcon(request.status)}</span>
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link 
                              to={`/admin/requests/${request.id}`}
                              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                              title="Review Details"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                            <button 
                              onClick={() => handleDeleteRequest(request.id, request.status === 'Approved')}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                          
                          <Link 
                            to={`/admin/requests/${request.id}`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group-hover:hidden"
                          >
                            Review
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
