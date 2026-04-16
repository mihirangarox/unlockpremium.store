import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, 
  CheckCircle2, Clock, X, Trash2, 
  ExternalLink, ShieldCheck, Tag, 
  DollarSign, Layers, Save, Copy, 
  Check, AlertCircle, List, Edit2, UserPlus, HelpCircle,
  History as HistoryIcon, Wallet, ArrowRight, AlertTriangle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../../context/LocalizationContext';
import { useToast } from '../../components/ui/Toast';
import * as db from '../../services/db';
import { Product, DigitalCode, PlanDuration, Vendor } from '../../types';

interface ScopedStockItem extends DigitalCode {
  // Any extra fields if needed
}

export function ManageStock() {
  const { formatCurrency, formatDate } = useLocalization();
  const { showToast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<DigitalCode[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection & Filtering
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Reserved' | 'Assigned'>('All');
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  
  // Editing SKU Price
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Add Stock Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    duration: '',
    codesText: '',
    vendorId: '',
    cost: '',
    costType: 'unit' as 'unit' | 'total',
    isExternal: false
  });
  const [isAdding, setIsAdding] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // New: Custom Modals
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    isDanger: false,
    onConfirm: () => {}
  });

  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    userId: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [allProducts, allStock, allVendors, allTxs] = await Promise.all([
        db.getProducts(),
        db.getLiveStock(),
        db.getVendors(),
        db.getUSDTTransactions()
      ]);
      setProducts(allProducts);
      setStock(allStock);
      setVendors(allVendors);

      // Calc wallet balance
      const balance = allTxs.reduce((sum, tx) => 
        tx.type === 'Inbound' ? sum + tx.amount : sum - tx.amount, 0
      );
      setWalletBalance(balance);
      
      // Select first product by default if none selected
      if (!selectedProductId && allProducts.length > 0) {
        setSelectedProductId(allProducts[0].id);
      }

      // One-time background sync for all products to cleanup legacy counts
      allProducts.forEach(async (p) => {
        try {
          await db.syncInventoryFromLiveStock(p.id);
        } catch (e) {
          console.error(`Sync failed for ${p.id}`, e);
        }
      });
    } catch (error) {
      console.error("Failed to load data:", error);
      showToast("Sync failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Computed Inventory View (Top Section)
  const inventorySummary = useMemo(() => {
    return products.map(product => {
      const productCodes = stock.filter(s => s.productId === product.id && s.status === 'Available');
      const inStockCount = productCodes.length;
      
      // GBP Profit Tracking
      const totalGBPCost = productCodes.reduce((sum, s) => sum + (s.gbpPurchaseCost || 0), 0);
      const avgGBPCost = inStockCount > 0 ? totalGBPCost / inStockCount : 0;
      
      const sellingPrice = product.price || 0;
      // Margin calculated in GBP for accurate P2P reflection
      const margin = sellingPrice > 0 ? ((sellingPrice - avgGBPCost) / sellingPrice) * 100 : 0;
      
      return {
        ...product,
        inStockCount,
        totalInventoryValue: totalGBPCost, // Show in GBP
        avgCost: avgGBPCost,
        margin,
        isLowStock: inStockCount <= 5 // Threshold
      };
    });
  }, [products, stock]);

  // Filtered Ledger (Bottom Section)
  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchesProduct = !selectedProductId || item.productId === selectedProductId;
      const matchesSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      return matchesProduct && matchesSearch && matchesStatus;
    });
  }, [stock, selectedProductId, searchQuery, filterStatus]);

  // Handlers
  const handleUpdatePrice = async (productId: string, newPrice: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const updatedProduct = { ...product, price: newPrice };
      await db.saveProduct(updatedProduct);
      setProducts(products.map(p => p.id === productId ? updatedProduct : p));
      showToast("Price updated", "success");
      setEditingPriceProductId(null);
    } catch (err) {
      showToast("Failed to update price", "error");
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.codesText.trim() || !formData.vendorId || !formData.cost) {
      showToast("Please fill all mandatory fields", "error");
      return;
    }

    setIsAdding(true);
    try {
      const selectedProduct = products.find(p => p.id === formData.productId);
      const codes = formData.codesText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const inputCost = parseFloat(formData.cost) || 0;
      const totalUSDTBatchCost = formData.costType === 'unit' ? (inputCost * codes.length) : inputCost;

      let unitCostGBP = 0;
      let unitCostUSDT = totalUSDTBatchCost / codes.length;

      if (formData.isExternal) {
        // Bypass wallet - use latest market rate for GBP cost basis
        const latestRate = await db.getLatestUSDTRate();
        unitCostGBP = unitCostUSDT * latestRate;
        
        // Optional: We could log this as a 'Manual' transaction in the future if needed
      } else {
        // Standard Wallet flow
        if (totalUSDTBatchCost > walletBalance) {
          showToast(`Insufficient USDT balance. Needed: ${totalUSDTBatchCost.toFixed(2)}`, "error");
          setIsAdding(false);
          return;
        }

        // Consume USDT using FIFO
        const allocations = await db.consumeUSDT(totalUSDTBatchCost, `Purchase of ${codes.length} x ${selectedProduct?.name}`);
        
        // Calculate average GBP cost for this batch
        const totalGBPCost = allocations.reduce((sum, a) => sum + (a.amount * a.rate), 0);
        unitCostGBP = totalGBPCost / codes.length;
      }

      // Create Codes
      const newCodes: DigitalCode[] = codes.map(codeString => ({
        id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: formData.productId,
        productName: selectedProduct?.name || 'Unknown',
        code: codeString,
        duration: formData.duration as PlanDuration,
        costBasisUSDT: unitCostUSDT,
        gbpPurchaseCost: unitCostGBP, // Anchored GBP cost
        vendorId: formData.vendorId,
        status: 'Available',
        createdAt: new Date().toISOString()
      }));

      await db.saveLiveStockBatch(newCodes);
      
      // 4. Sync inventory count and avg cost (including GBP)
      await db.syncInventoryFromLiveStock(formData.productId);
      
      showToast(`Added ${codes.length} codes successfully`, "success");
      setIsAddModalOpen(false);
      setFormData({ productId: '', duration: '', codesText: '', vendorId: '', cost: '', costType: 'unit', isExternal: false });
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to add stock", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedStockIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Bulk Delete Codes',
      message: `Are you sure you want to permanently delete ${selectedStockIds.length} codes? This will update the inventory counts in the master table.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          await Promise.all(selectedStockIds.map(id => db.deleteLiveStockCode(id)));
          
          // Sync all affected products
          if (selectedProductId) {
            await db.syncInventoryFromLiveStock(selectedProductId);
          }
          
          setStock(prev => prev.filter(s => !selectedStockIds.includes(s.id)));
          setSelectedStockIds([]);
          showToast("Bulk deletion completed", "success");
        } catch (err) {
          showToast("Bulk delete failed", "error");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Release one or many Reserved codes back to Available
  const handleReleaseCode = async (codeId: string) => {
    try {
      await db.updateLiveStockCode(codeId, {
        status: 'Available',
        assignedToRequestId: undefined,
        assignedToSubscriptionId: undefined,
        assignedAt: undefined,
      });
      if (selectedProductId) await db.syncInventoryFromLiveStock(selectedProductId);
      setStock(prev => prev.map(s => s.id === codeId ? { ...s, status: 'Available', assignedToRequestId: undefined, assignedAt: undefined } : s));
      showToast('Released to Available', 'success');
    } catch (err) {
      showToast('Failed to release code', 'error');
    }
  };

  const handleBulkRelease = () => {
    if (selectedStockIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Release Reserved Codes',
      message: `Release ${selectedStockIds.length} selected code(s) back to Available? They will be orderable again.`,
      isDanger: false,
      onConfirm: async () => {
        try {
          await Promise.all(selectedStockIds.map(id => db.updateLiveStockCode(id, {
            status: 'Available',
            assignedToRequestId: undefined,
            assignedToSubscriptionId: undefined,
            assignedAt: undefined,
          })));
          if (selectedProductId) await db.syncInventoryFromLiveStock(selectedProductId);
          setStock(prev => prev.map(s => selectedStockIds.includes(s.id) ? { ...s, status: 'Available', assignedToRequestId: undefined, assignedAt: undefined } : s));
          setSelectedStockIds([]);
          showToast(`${selectedStockIds.length} codes released to Available`, 'success');
        } catch (err) {
          showToast('Bulk release failed', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkAssign = () => {
    if (selectedStockIds.length === 0) return;
    setAssignModal({ isOpen: true, userId: '' });
  };

  const executeBulkAssign = async () => {
    if (!assignModal.userId.trim()) {
      showToast("Please enter a User ID", "error");
      return;
    }

    try {
      await Promise.all(selectedStockIds.map(id => db.updateLiveStockCode(id, { 
        status: 'Assigned',
        assignedToRequestId: assignModal.userId,
        assignedAt: new Date().toISOString()
      })));

      if (selectedProductId) {
        await db.syncInventoryFromLiveStock(selectedProductId);
      }

      setStock(prev => prev.map(s => selectedStockIds.includes(s.id) ? { 
        ...s, 
        status: 'Assigned', 
        assignedToRequestId: assignModal.userId, 
        assignedAt: new Date().toISOString() 
      } : s));
      
      setSelectedStockIds([]);
      setAssignModal({ isOpen: false, userId: '' });
      showToast("Assigned successfully", "success");
    } catch (err) {
      showToast("Bulk assignment failed", "error");
    }
  };

  const toggleSelectAll = () => {
    if (selectedStockIds.length === filteredStock.length) {
      setSelectedStockIds([]);
    } else {
      setSelectedStockIds(filteredStock.map(s => s.id));
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Manage Stock</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Unified inventory control & real-time digital fulfillment.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadAllData}
            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl transition shadow-sm"
          >
            <HistoryIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add Inventory Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total SKUs</p>
          <p className="text-2xl font-black text-slate-900">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items In Vault</p>
          <p className="text-2xl font-black text-slate-900">{stock.filter(s => s.status === 'Available').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Value</p>
          <p className="text-2xl font-black text-indigo-600">
            {formatCurrency(stock.reduce((sum, s) => sum + (s.status === 'Available' ? s.costBasisUSDT : 0), 0))}
          </p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
          <p className="text-2xl font-black text-rose-600">{inventorySummary.filter(i => i.isLowStock).length}</p>
        </div>
      </div>

      {/* Master Section: Product Summary */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Inventory Summary (Master)</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">READ-ONLY COMPUTED VIEW</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">In Stock</th>
                <th className="px-6 py-4">Avg Cost (GBP)</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Margin (GBP)</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {inventorySummary.map(item => (
                <tr 
                  key={item.id} 
                  onClick={() => setSelectedProductId(item.id)}
                  className={`cursor-pointer transition-all hover:bg-indigo-50/30 group ${selectedProductId === item.id ? 'bg-indigo-50/50' : ''}`}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${selectedProductId === item.id ? 'bg-indigo-600' : 'bg-transparent'}`} />
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-tight">{item.subscriptionType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black ${item.isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                        {item.inStockCount}
                      </span>
                      {item.isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-400">
                    {formatCurrency(item.avgCost)}
                  </td>
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    {editingPriceProductId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdatePrice(item.id, parseFloat(tempPrice));
                            if (e.key === 'Escape') setEditingPriceProductId(null);
                          }}
                          className="w-20 px-2 py-1 bg-white border border-indigo-200 rounded text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button onClick={() => handleUpdatePrice(item.id, parseFloat(tempPrice))} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 group/edit cursor-text"
                        onClick={() => {
                          setEditingPriceProductId(item.id);
                          setTempPrice(item.price?.toString() || '0');
                        }}
                      >
                        <span className="font-black text-slate-900">{formatCurrency(item.price || 0)}</span>
                        <Edit2 className="w-3 h-3 text-slate-300 group-hover/edit:text-indigo-600 transition-colors" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`font-black px-3 py-1 rounded-full text-xs ${
                      item.margin < 10 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {item.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <ArrowRight className={`w-4 h-4 transition-transform ${selectedProductId === item.id ? 'translate-x-1 text-indigo-600' : 'text-slate-200 group-hover:text-slate-400'}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Section: Live Stock Ledger */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/10 gap-4">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
              Live Stock Ledger {selectedProductId && `- ${products.find(p => p.id === selectedProductId)?.name}`}
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-100/50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 w-48 transition-all"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Assigned">Assigned</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Header */}
        <AnimatePresence>
          {selectedStockIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-slate-900 flex items-center justify-between"
            >
              <span className="text-white text-[10px] font-black uppercase tracking-wider">{selectedStockIds.length} Codes Selected</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleBulkRelease}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-500 transition"
                >
                  Release → Available
                </button>
                <button 
                  onClick={handleBulkAssign}
                  className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-400 transition"
                >
                  Bulk Assign
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-rose-400 transition"
                >
                  Bulk Delete
                </button>
                <button onClick={() => setSelectedStockIds([])} className="p-1.5 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedStockIds.length === filteredStock.length && filteredStock.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4">Activation Code/Link</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-slate-400">USDT Cost</th>
                <th className="px-6 py-4">GBP Cost</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Added On</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Layers className="w-12 h-12 mb-4" />
                      <p className="font-bold">No codes found for this product</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStock.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${selectedStockIds.includes(item.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedStockIds.includes(item.id)}
                      onChange={() => setSelectedStockIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                      className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-50 px-2 py-1 rounded text-xs text-indigo-600 font-mono tracking-tight">
                        {item.code.length > 25 ? item.code.substring(0, 25) + '...' : item.code}
                      </code>
                      <button onClick={() => {
                        navigator.clipboard.writeText(item.code);
                        showToast("Copied", "success");
                      }} className="p-1 text-slate-300 hover:text-indigo-600">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.duration}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      item.status === 'Available' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-slate-400 text-white shadow-sm'
                    }`}>
                      {item.status === 'Available' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-400">
                    {item.costBasisUSDT?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">
                    {formatCurrency(item.gbpPurchaseCost || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 uppercase font-bold">
                      {vendors.find(v => v.id === item.vendorId)?.name || 'Direct'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Release button — only for Reserved codes */}
                      {item.status === 'Reserved' && (
                        <button
                          title="Release back to Available"
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            title: 'Release Code',
                            message: `Release this code back to Available stock? It will be orderable again.`,
                            isDanger: false,
                            onConfirm: async () => {
                              await handleReleaseCode(item.id);
                              setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            }
                          })}
                          className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Digital Code',
                            message: `Delete this code permanently? This will update the inventory count for ${item.productName}.`,
                            isDanger: true,
                            onConfirm: async () => {
                              try {
                                await db.deleteLiveStockCode(item.id);
                                await db.syncInventoryFromLiveStock(item.productId);
                                setStock(prev => prev.filter(s => s.id !== item.id));
                                showToast("Deleted successfully", "success");
                              } catch (e) {
                                showToast("Failed to delete", "error");
                              }
                              setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            }
                          });
                        }}
                        className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
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

      {/* Add Stock Modal - Enhanced with mandatory fields */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-10 relative overflow-hidden"
            >
              {/* Background gradient hint */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <Plus className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Add New Stock</h3>
                  <p className="text-sm text-slate-500 font-medium">Digital asset vault replenishment.</p>
                </div>
              </div>

              <form onSubmit={handleAddStock} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target SKU (Mandatory)</label>
                    <select 
                      required
                      value={formData.productId}
                      onChange={(e) => {
                         const pId = e.target.value;
                         const prod = products.find(p => p.id === pId);
                         const firstDur = prod?.pricing && prod.pricing.length > 0 ? `${prod.pricing[0].durationMonths}M` : '1M';
                         setFormData({ ...formData, productId: pId, duration: firstDur });
                      }}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                    >
                      <option value="">Select Product...</option>
                      {products.filter(p => p.isActive).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Duration</label>
                    <select 
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                    >
                      {formData.productId ? products.find(p => p.id === formData.productId)?.pricing?.map(tier => (
                        <option key={tier.durationMonths} value={`${tier.durationMonths}M`}>{tier.durationMonths} Months</option>
                      )) : <option value="">Select SKU First</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Buying Price (USDT)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input 
                          required
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          className="w-full pl-10 pr-4 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 font-black text-emerald-700"
                        />
                      </div>
                      <select 
                        value={formData.costType}
                        onChange={(e) => setFormData({ ...formData, costType: e.target.value as any })}
                        className="px-3 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-500 outline-none"
                      >
                        <option value="unit">Per Unit</option>
                        <option value="total">Total Batch</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Linked Vendor (Mandatory)</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <select 
                        required
                        value={formData.vendorId}
                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                      >
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Upload (One code per line)</label>
                  <textarea 
                    required
                    placeholder="Enter links or codes here..."
                    rows={5}
                    value={formData.codesText}
                    onChange={(e) => setFormData({ ...formData, codesText: e.target.value })}
                    className="w-full px-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 font-mono text-sm text-slate-900"
                  />
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      Detected {formData.codesText.split('\n').filter(l => l.trim()).length} Codes
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Available Wallet Balance</span>
                    </div>
                    <span className={`text-sm font-black ${walletBalance <= 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                      {walletBalance.toFixed(2)} USDT
                    </span>
                  </div>

                  {/* New: External Purchase Toggle */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, isExternal: !prev.isExternal }))}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      formData.isExternal 
                        ? 'bg-amber-50 border-amber-200 shadow-sm' 
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${formData.isExternal ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${formData.isExternal ? 'text-amber-900' : 'text-slate-500'}`}>External Purchase</p>
                        <p className="text-[10px] text-slate-400 font-medium">Bypass CRM wallet balance check</p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.isExternal ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isExternal ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)} 
                      className="flex-1 py-5 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                    >
                      Discard
                    </button>
                    <button 
                      type="submit" 
                      disabled={
                        isAdding || 
                        (!formData.isExternal && (
                          walletBalance <= 0 || 
                          (formData.costType === 'unit' ? parseFloat(formData.cost) * formData.codesText.split('\n').filter(l => l.trim()).length : parseFloat(formData.cost)) > walletBalance
                        ))
                      }
                      className="flex-[2] py-5 px-10 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all active:translate-y-[0px] disabled:bg-slate-200 disabled:translate-y-0 disabled:shadow-none"
                    >
                      {isAdding ? (
                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Complete Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmModal.isDanger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-4 text-white rounded-2xl font-black shadow-lg transition-all hover:translate-y-[-2px] ${confirmModal.isDanger ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Assign Modal */}
      <AnimatePresence>
        {assignModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <UserPlus className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Bulk Assign</h3>
                  <p className="text-xs text-slate-500 font-medium">Link {selectedStockIds.length} codes to a user.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target User/Request ID</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Enter ID (e.g. req_123 or user_abc)"
                    value={assignModal.userId}
                    onChange={(e) => setAssignModal({ ...assignModal, userId: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setAssignModal({ isOpen: false, userId: '' })}
                    className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeBulkAssign}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:translate-y-[-2px] transition-all active:translate-y-0"
                  >
                    Assign Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
