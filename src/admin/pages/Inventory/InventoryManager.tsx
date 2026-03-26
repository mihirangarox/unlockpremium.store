import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, ArrowRight, ShieldCheck, Tag, DollarSign, Layers, X, History as HistoryIcon, Wallet, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../../context/LocalizationContext';
import { useToast } from '../../components/ui/Toast';
import * as db from '../../services/db';
import { Product, Vendor, InventoryLog } from '../../types';

interface InventoryItem extends Product {
  stockCount: number;
  lowStockThreshold: number;
  costPrice: number; // For profit calculations
}

export function InventoryManager() {
  const { formatCurrency } = useLocalization();
  const { showToast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [restockData, setRestockData] = useState({
    quantity: 1,
    vendorId: '',
    usdtCost: 0,
    note: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const [products, items, allVendors] = await Promise.all([
        db.getProducts(),
        db.getInventoryItems(),
        db.getVendors()
      ]);
      setVendors(allVendors);
      const inventoryMap = new Map(items.map(i => [i.id, i]));
      
      const enriched = products.map(p => {
        const inv = inventoryMap.get(p.id);
        return {
          ...p,
          stockCount: inv?.stockCount ?? 0,
          lowStockThreshold: inv?.lowStockThreshold ?? 5,
          costPrice: inv?.costPrice ?? (p.price * 0.5) // Default 50% margin if not set
        };
      });
      setInventory(enriched);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      showToast("Sync failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRestock = (product: InventoryItem) => {
    setSelectedProduct(product);
    setRestockData({
      quantity: 10,
      vendorId: vendors[0]?.id || '',
      usdtCost: 0,
      note: `Stock update for ${product.name}`
    });
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      // 1. Create Inventory Log
      const log: InventoryLog = {
        id: `log_${Date.now()}`,
        productId: selectedProduct.id,
        vendorId: restockData.vendorId,
        quantityAdded: restockData.quantity,
        usdtCost: restockData.usdtCost,
        localCurrencyRate: 1, // Simplified for now
        date: new Date().toISOString(),
        note: restockData.note
      };
      await db.saveInventoryLog(log);

      // 2. Update Inventory Stock Count
      const newStock = selectedProduct.stockCount + restockData.quantity;
      await db.saveInventoryItem({
        id: selectedProduct.id,
        stockCount: newStock,
        lowStockThreshold: selectedProduct.lowStockThreshold,
        costPrice: selectedProduct.costPrice
      });

      // 3. Create Outbound Finance Transaction if USDT cost > 0
      if (restockData.usdtCost > 0) {
        await db.saveUSDTTransaction({
          id: `tx_${Date.now()}`,
          type: 'Outbound',
          amount: restockData.usdtCost,
          usdtRate: 1,
          date: new Date().toISOString().split('T')[0],
          note: `Restock cost: ${selectedProduct.name}`,
          status: 'Completed'
        });
      }

      showToast("Inventory restocked successfully", "success");
      setIsRestockModalOpen(false);
      loadInventory();
    } catch (err) {
      console.error("Restock failed:", err);
      showToast("Sync failed", "error");
    }
  };

  const quickSale = async (item: InventoryItem) => {
    if (item.stockCount <= 0) return;
    const newStock = item.stockCount - 1;
    
    try {
      await db.saveInventoryItem({
        id: item.id,
        stockCount: newStock,
        lowStockThreshold: item.lowStockThreshold,
        costPrice: item.costPrice
      });
      setInventory(inventory.map(i => i.id === item.id ? { ...i, stockCount: newStock } : i));
    } catch (err) {
      showToast("Failed to update stock", "error");
    }
  };

  const updateItemSettings = async (item: InventoryItem, updates: Partial<InventoryItem>) => {
    try {
      const updated = { ...item, ...updates };
      await db.saveInventoryItem({
        id: item.id,
        stockCount: updated.stockCount,
        lowStockThreshold: updated.lowStockThreshold,
        costPrice: updated.costPrice
      });
      setInventory(inventory.map(i => i.id === item.id ? updated : i));
      showToast("Inventory settings updated", "success");
    } catch (err) {
      showToast("Failed to save changes", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Inventory Management</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor stock levels, costs, and product availability.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={loadInventory}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
              title="Refresh Sync"
            >
              <HistoryIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-amber-600" />
               <span className="text-xs font-bold text-amber-700">
                 {inventory.filter(i => i.stockCount <= i.lowStockThreshold).length} Low Stock Alerts
               </span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total SKUs</p>
            <p className="text-2xl font-black text-slate-900">{inventory.length}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Items</p>
            <p className="text-2xl font-black text-slate-900">{inventory.reduce((sum, i) => sum + i.stockCount, 0)}</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Value</p>
            <p className="text-2xl font-black text-indigo-600">
              {formatCurrency(inventory.reduce((sum, i) => sum + (i.stockCount * i.costPrice), 0))}
            </p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Potential Revenue</p>
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(inventory.reduce((sum, i) => sum + (i.stockCount * i.price), 0))}
            </p>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="responsive-table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">In Stock</th>
                <th className="px-6 py-4">Unit Cost</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Margin</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {inventory.map(item => {
                const isLow = item.stockCount <= item.lowStockThreshold;
                const margin = ((item.price - item.costPrice) / item.price) * 100;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tight">{item.subscriptionType}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                          <Layers className="w-3 h-3" />
                          {item.category}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <span className={`font-black text-lg ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                            {item.stockCount}
                          </span>
                          {isLow && <ShieldCheck className="w-4 h-4 text-amber-500" />}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="group/edit relative flex items-center gap-1">
                        <span className="pb-0.5">{formatCurrency(0).replace(/[0-9.,\s]/g, '')}</span>
                        <input 
                          type="number"
                          step="0.01"
                          defaultValue={item.costPrice}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== item.costPrice) {
                              updateItemSettings(item, { costPrice: val });
                            }
                          }}
                          className="w-16 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-medium text-slate-600 outline-none transition"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4">
                       <span className="text-emerald-600 font-bold">+{margin.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => quickSale(item)}
                           disabled={item.stockCount <= 0}
                           className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30"
                           title="Quick Deduct (-1)"
                         >
                           <Layers className="w-4 h-4 rotate-180" />
                         </button>
                         <button 
                           onClick={() => handleOpenRestock(item)}
                           className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                         >
                           <Plus className="w-3 h-3" />
                           Restock
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isRestockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 relative"
            >
              <button onClick={() => setIsRestockModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Restock Product</h3>
                  <p className="text-sm text-slate-500">{selectedProduct?.name}</p>
                </div>
              </div>

              <form onSubmit={handleRestockSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity to Add</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={restockData.quantity}
                      onChange={(e) => setRestockData({ ...restockData, quantity: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">USDT Cost (Total)</label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="number" 
                        step="0.01"
                        value={restockData.usdtCost}
                        onChange={(e) => setRestockData({ ...restockData, usdtCost: parseFloat(e.target.value) })}
                        className="w-full pl-11 pr-4 py-3 bg-emerald-50/30 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor</label>
                  <select 
                    value={restockData.vendorId}
                    onChange={(e) => setRestockData({ ...restockData, vendorId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none text-slate-900"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note</label>
                  <input 
                    type="text" 
                    value={restockData.note}
                    onChange={(e) => setRestockData({ ...restockData, note: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-900"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsRestockModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold">Cancel</button>
                  <button type="submit" className="flex-2 py-4 px-8 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-100 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    Complete Restock
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
