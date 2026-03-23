import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, 
  CheckCircle2, Clock, X, Trash2, 
  ExternalLink, ShieldCheck, Tag, 
  DollarSign, Layers, Save, Copy, 
  Check, AlertCircle, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../../context/LocalizationContext';
import { useToast } from '../../components/ui/Toast';
import * as db from '../../services/db';
import { Product, DigitalCode, PlanDuration } from '../../types';

export function LiveStockManager() {
  const { formatCurrency, formatDate } = useLocalization();
  const { showToast } = useToast();
  const [stock, setStock] = useState<DigitalCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Assigned'>('All');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    duration: '1M' as PlanDuration,
    codesText: '',
    usdtCost: 0,
    vendorId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allStock, allProducts] = await Promise.all([
        db.getLiveStock(),
        db.getProducts()
      ]);
      setStock(allStock);
      setProducts(allProducts);
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

      const newCodes: DigitalCode[] = codes.map(codeString => ({
        id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: formData.productId,
        productName: selectedProduct?.name || 'Unknown Product',
        code: codeString,
        duration: formData.duration,
        costBasisUSDT: formData.usdtCost / codes.length,
        status: 'Available',
        createdAt: new Date().toISOString()
      }));

      await db.saveLiveStockBatch(newCodes);
      
      // Also log a transaction if USDT cost > 0
      if (formData.usdtCost > 0) {
        await db.saveUSDTTransaction({
          id: `tx_bulk_${Date.now()}`,
          type: 'Outbound',
          amount: formData.usdtCost,
          usdtRate: 1,
          date: new Date().toISOString().split('T')[0],
          note: `Bulk stock: ${selectedProduct?.name} (${codes.length} codes)`,
          status: 'Completed'
        });
      }

      showToast(`Successfully added ${codes.length} codes!`, "success");
      setIsAddModalOpen(false);
      setFormData({ productId: '', duration: '1M', codesText: '', usdtCost: 0, vendorId: '' });
      loadData();
    } catch (error) {
      console.error("Add stock failed:", error);
      showToast("Failed to add stock", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm("Delete this activation code?")) return;
    try {
      await db.deleteLiveStockCode(id);
      setStock(stock.filter(s => s.id !== id));
      showToast("Code deleted", "success");
    } catch (err) {
      showToast("Delete failed", "error");
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
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
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Stock</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.available} <span className="text-xs font-medium text-slate-400">Codes</span></p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assigned</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.assigned}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Value (USDT)</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.totalValue.toFixed(2)}</p>
         </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by product or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-900"
          />
        </div>
        <div className="flex gap-2">
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

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Activation Code/Link</th>
                <th className="px-6 py-4">Cost (USDT)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading live stock...</td></tr>
              ) : filteredStock.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No codes found matching filters.</td></tr>
              ) : filteredStock.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                        {item.duration}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <code className="bg-slate-50 px-2 py-1 rounded text-xs text-indigo-600 font-mono">
                          {item.status === 'Available' ? item.code : item.code.substring(0, 10) + '...'}
                        </code>
                        <button onClick={() => {
                          navigator.clipboard.writeText(item.code);
                          showToast("Copied to clipboard", "success");
                        }} className="p-1 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition">
                          <Copy className="w-3" />
                        </button>
                     </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-400">{item.costBasisUSDT.toFixed(2)}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                       item.status === 'Available' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                     }`}>
                        {item.status === 'Available' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {item.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteCode(item.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                    <select 
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                    >
                      <option value="1M">1 Month</option>
                      <option value="3M">3 Months</option>
                      <option value="6M">6 Months</option>
                      <option value="12M">12 Months</option>
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
                    <p className="text-[10px] font-bold text-slate-400">
                      Detected: {formData.codesText.split('\n').filter(l => l.trim()).length} Items
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">USDT Batch Cost (Total)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={formData.usdtCost || ''}
                      onChange={(e) => setFormData({ ...formData, usdtCost: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900"
                    />
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
