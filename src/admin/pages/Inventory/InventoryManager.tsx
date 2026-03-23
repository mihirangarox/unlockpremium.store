import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, ArrowRight, ShieldCheck, Tag, DollarSign, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocalization } from '../../../context/LocalizationContext';
import { useToast } from '../../components/ui/Toast';
import * as db from '../../services/db';
import { Product } from '../../types';

interface InventoryItem extends Product {
  stockCount: number;
  lowStockThreshold: number;
  costPrice: number; // For profit calculations
}

export function InventoryManager() {
  const { formatCurrency } = useLocalization();
  const { showToast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const [products, items] = await Promise.all([
        db.getProducts(),
        db.getInventoryItems()
      ]);
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

  const updateStock = async (id: string, newStock: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const updatedItem = { ...item, stockCount: newStock };
    
    try {
      await db.saveInventoryItem({
        id: item.id,
        stockCount: newStock,
        lowStockThreshold: item.lowStockThreshold,
        costPrice: item.costPrice
      });
      setInventory(inventory.map(i => i.id === id ? updatedItem : i));
      showToast(`Stock updated: ${newStock}`, "success");
    } catch (error) {
      console.error("Failed to update stock:", error);
      showToast("Sync error", "error");
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
                <th className="px-6 py-4 text-right">Actions</th>
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
                    <td className="px-6 py-4">{formatCurrency(item.costPrice)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4">
                       <span className="text-emerald-600 font-bold">+{margin.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => updateStock(item.id, item.stockCount + 10)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Restock +10"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateStock(item.id, Math.max(0, item.stockCount - 1))}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Quick Sale -1"
                          >
                            <ArrowRight className="w-4 h-4 rotate-90" />
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
    </div>
  );
}
