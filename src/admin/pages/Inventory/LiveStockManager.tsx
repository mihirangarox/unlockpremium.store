import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, 
  CheckCircle2, Clock, X, Trash2, 
  ExternalLink, ShieldCheck, Tag, 
  DollarSign, Layers, Save, Copy, 
  Check, AlertCircle, List, Edit2, UserPlus, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../../context/LocalizationContext';
import { useToast } from '../../components/ui/Toast';
import * as db from '../../services/db';
import { Product, DigitalCode, PlanDuration, Vendor } from '../../types';

interface USDTTransaction {
  id: string;
  type: 'Inbound' | 'Outbound';
  amount: number;
  usdtRate: number;
  date: string;
  note: string;
  status: 'Completed' | 'Pending';
}

export function LiveStockManager() {
  const { formatCurrency, formatDate } = useLocalization();
  const { showToast } = useToast();
  const [stock, setStock] = useState<DigitalCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inboundTxs, setInboundTxs] = useState<USDTTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Assigned'>('All');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    duration: '',
    codesText: '',
    selectedTxId: '', // Legacy / Optional
    vendorId: '',
    cost: '',
    costType: 'unit' as 'unit' | 'total'
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editField, setEditField] = useState<'code' | 'cost'>('code');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterProduct, setFilterProduct] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allStock, allProducts, allTxs, allVendors] = await Promise.all([
        db.getLiveStock(),
        db.getProducts(),
        db.getUSDTTransactions(),
        db.getVendors()
      ]);
      setStock(allStock);
      setProducts(allProducts);
      setInboundTxs(allTxs.filter((tx: USDTTransaction) => tx.type === 'Inbound'));
      setVendors(allVendors);
    } catch (error) {
      console.error("Failed to load live stock:", error);
      showToast("Sync failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.codesText.trim()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsAdding(true);
    try {
      const selectedProduct = products.find(p => p.id === formData.productId);
      const codes = formData.codesText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (codes.length === 0) throw new Error("No codes provided");

      const inputCost = parseFloat(formData.cost) || 0;
      const unitCost = formData.costType === 'unit' ? inputCost : (inputCost / codes.length);

      const newCodes: DigitalCode[] = codes.map(codeString => ({
        id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: formData.productId,
        productName: selectedProduct?.name || 'Unknown Product',
        code: codeString,
        duration: formData.duration as PlanDuration,
        costBasisUSDT: unitCost,
        vendorId: formData.vendorId,
        status: 'Available',
        createdAt: new Date().toISOString()
      }));

      await db.saveLiveStockBatch(newCodes);

      showToast(`Successfully added ${codes.length} codes!`, "success");
      setIsAddModalOpen(false);
      setFormData({ productId: '', duration: '', codesText: '', selectedTxId: '', vendorId: '', cost: '', costType: 'unit' });
      loadData();
    } catch (error) {
      console.error("Add stock failed:", error);
      showToast("Failed to add stock", "error");
    } finally {
      setIsAdding(false);
    }
  };


  const handleStartEdit = (item: DigitalCode, field: 'code' | 'cost') => {
    setEditingId(item.id);
    setEditField(field);
    setEditValue(field === 'code' ? item.code : item.costBasisUSDT.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const updatedItem = stock.find(s => s.id === editingId);
      if (!updatedItem) return;

      const updates = editField === 'code' 
        ? { code: editValue } 
        : { costBasisUSDT: parseFloat(editValue) || 0 };

      await db.updateLiveStockCode(editingId, updates);
      
      setStock(stock.map(s => s.id === editingId ? { ...s, ...updates } : s));
      showToast("Updated successfully", "success");
      setEditingId(null);
    } catch (err) {
      showToast("Update failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStock.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStock.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteCode = async () => {
    if (!deleteConfirmId) return;
    try {
      await db.deleteLiveStockCode(deleteConfirmId);
      setStock(stock.filter(s => s.id !== deleteConfirmId));
      showToast("Code deleted", "success");
    } catch (err) {
      showToast("Delete failed", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => db.deleteLiveStockCode(id)));
      setStock(stock.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      showToast(`${selectedIds.length} codes deleted`, "success");
    } catch (err) {
      showToast("Bulk delete failed", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async (status: 'Available' | 'Assigned') => {
    try {
      await Promise.all(selectedIds.map(id => db.updateLiveStockCode(id, { status })));
      setStock(stock.map(s => selectedIds.includes(s.id) ? { ...s, status } : s));
      setSelectedIds([]);
      showToast(`Updated ${selectedIds.length} codes to ${status}`, "success");
    } catch (err) {
      showToast("Bulk update failed", "error");
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesProduct = filterProduct === 'All' || item.productId === filterProduct;
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const stats = {
    available: stock.filter(s => s.status === 'Available').length,
    assigned: stock.filter(s => s.status === 'Assigned').length,
    totalValue: stock.reduce((sum, s) => sum + (s.status === 'Available' ? s.costBasisUSDT : 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Live Stock Update</h2>
          <p className="text-slate-500 text-sm mt-1">Manage digital activation codes and automated fulfillment.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Inventory Stock
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Stock</p>
            </div>
            <p className="text-xl font-black text-slate-900">{stats.available} <span className="text-[10px] font-medium text-slate-400">Codes</span></p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Assigned</p>
            </div>
            <p className="text-xl font-black text-slate-900">{stats.assigned}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-1.5 bg-amber-50 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory Value (USDT)</p>
            </div>
            <p className="text-xl font-black text-slate-900">{stats.totalValue.toFixed(2)}</p>
         </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-900"
          />
        </div>
        <div className="flex gap-2">
           <select 
             value={filterProduct}
             onChange={(e) => setFilterProduct(e.target.value)}
             className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-100 focus:border-slate-200 transition-all outline-none"
           >
             <option value="All">All Products</option>
             {Array.from(new Set(stock.map(s => s.productId))).map(pId => (
               <option key={pId} value={pId}>
                 {stock.find(s => s.productId === pId)?.productName}
               </option>
             ))}
           </select>
           {['All', 'Available', 'Assigned'].map((status) => (
             <button 
               key={status}
               onClick={() => setFilterStatus(status as any)}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                 filterStatus === status 
                   ? 'bg-slate-900 text-white shadow-md' 
                   : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-200'
               }`}
             >
               {status}
             </button>
           ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="flex items-center justify-between bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold">{selectedIds.length} items selected</span>
              <div className="h-4 w-px bg-slate-700" />
              <button 
                onClick={() => handleBulkStatusUpdate('Available')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
              >
                Mark Available
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('Assigned')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition"
              >
                Mark Assigned
              </button>
            </div>
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredStock.length && filteredStock.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Activation Code/Link</th>
                <th className="px-6 py-3">Cost (USDT)</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading live stock...</td></tr>
              ) : filteredStock.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No codes found matching filters.</td></tr>
              ) : filteredStock.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors group ${selectedIds.includes(item.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <div className="font-bold text-slate-900 leading-tight">{item.productName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{item.duration}</div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                     <div className="flex items-center gap-2">
                        {editingId === item.id && editField === 'code' ? (
                          <div className="flex items-center gap-1">
                            <input 
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="bg-white border border-indigo-200 px-2 py-1 rounded text-xs text-indigo-600 font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none w-48"
                            />
                            <button onClick={handleSaveEdit} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 hover:bg-rose-50 text-rose-600 rounded">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <code 
                              onClick={() => handleStartEdit(item, 'code')}
                              className="bg-slate-50 px-2 py-1 rounded text-xs text-indigo-600 font-mono cursor-pointer hover:bg-indigo-50 transition"
                            >
                              {item.status === 'Available' ? item.code : item.code.substring(0, 10) + '...'}
                            </code>
                            <button onClick={() => {
                              navigator.clipboard.writeText(item.code);
                              showToast("Copied to clipboard", "success");
                            }} className="p-1 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition">
                              <Copy className="w-3" />
                            </button>
                          </>
                        )}
                     </div>
                  </td>
                  <td className="px-6 py-3">
                    {editingId === item.id && editField === 'cost' ? (
                      <div className="flex items-center gap-1">
                        <input 
                          autoFocus
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-white border border-indigo-200 px-2 py-1 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none w-20"
                        />
                        <button onClick={handleSaveEdit} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 hover:bg-rose-50 text-rose-600 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleStartEdit(item, 'cost')}
                        className="font-bold text-slate-400 cursor-pointer hover:text-slate-600 transition decoration-dotted underline-offset-4 hover:underline"
                      >
                        {item.costBasisUSDT.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                     <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                       item.status === 'Available' 
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' 
                        : 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                     }`}>
                        {item.status === 'Available' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {item.status}
                     </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEdit(item, 'code')}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition" 
                        title="Edit Code"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition" title="Assign to Customer">
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {(deleteConfirmId || isBulkDeleting) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-slate-500 mb-8">
                {isBulkDeleting 
                  ? `Are you sure you want to delete ${selectedIds.length} activation codes? This action cannot be undone.`
                  : "Are you sure you want to delete this activation code? This action cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setDeleteConfirmId(null); setIsBulkDeleting(false); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => isBulkDeleting ? confirmBulkDelete() : handleDeleteCode()}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-2xl p-8 relative"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Plus className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add Inventory Stock</h3>
                  <p className="text-sm text-slate-500">Add new activation links or codes to your digital vault.</p>
                </div>
              </div>

              <form onSubmit={handleAddStock} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product</label>
                    <select 
                      required
                      value={formData.productId}
                      onChange={(e) => {
                         const pId = e.target.value;
                         const prod = products.find(p => p.id === pId);
                         const firstDur = prod?.pricing && prod.pricing.length > 0 ? `${prod.pricing[0].durationMonths}M` : '1M';
                         setFormData({ ...formData, productId: pId, duration: firstDur });
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                    >
                      <option value="">Select Product...</option>
                      {products.filter(p => p.isActive).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                    <select 
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                    >
                      {formData.productId ? products.find(p => p.id === formData.productId)?.pricing?.map(tier => (
                        <option key={tier.durationMonths} value={`${tier.durationMonths}M`}>{tier.durationMonths} Months</option>
                      )) : <option value="">Select Product First</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Cost (USDT)</label>
                    <div className="flex gap-2">
                      <input 
                        required
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900"
                      />
                      <select 
                        value={formData.costType}
                        onChange={(e) => setFormData({ ...formData, costType: e.target.value as any })}
                        className="px-3 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="unit">Per Unit</option>
                        <option value="total">Total Batch</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor / Source</label>
                    <select 
                      value={formData.vendorId}
                      onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                    >
                      <option value="">Select Vendor...</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation Code / Link (One per line)</label>
                  <textarea 
                    required
                    placeholder="Enter link or code here...&#10;One code per line for bulk addition."
                    rows={6}
                    value={formData.codesText}
                    onChange={(e) => setFormData({ ...formData, codesText: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm text-slate-900"
                  />
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-bold text-slate-400">
                        Detected: {formData.codesText.split('\n').filter(l => l.trim()).length} Items
                      </p>
                      <div className="h-3 w-px bg-slate-200" />
                      <p className="text-[10px] font-bold text-indigo-600">
                        Total Investment: {(() => {
                          const count = formData.codesText.split('\n').filter(l => l.trim()).length;
                          const cost = parseFloat(formData.cost) || 0;
                          return (formData.costType === 'unit' ? (count * cost) : cost).toFixed(2);
                        })()} USDT
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 opacity-50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legacy Funding Source (Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <select 
                      value={formData.selectedTxId}
                      onChange={(e) => setFormData({ ...formData, selectedTxId: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900 appearance-none text-xs"
                    >
                      <option value="">N/A</option>
                      {inboundTxs.map(tx => (
                        <option key={tx.id} value={tx.id}>
                          {tx.amount.toFixed(2)} USDT - {tx.date}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isAdding}
                    className="flex-2 py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                  >
                    {isAdding ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Add to Stock
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
