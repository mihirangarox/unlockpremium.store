import React, { useState, useEffect } from 'react';
import { Bitcoin, Plus, TrendingUp, History, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../../context/LocalizationContext';
import { useToast } from '../../components/ui/Toast';
import * as db from "../../services/db";

interface USDTTransaction {
  id: string;
  type: 'Inbound' | 'Outbound';
  amount: number;
  usdtRate: number; // USDT to Local Currency rate
  date: string;
  note: string;
  status: 'Completed' | 'Pending';
}

export function USDTPurchases() {
  const { formatCurrency, formatDate } = useLocalization();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<USDTTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTx, setNewTx] = useState<Partial<USDTTransaction>>({
    type: 'Inbound',
    amount: 0,
    usdtRate: 1,
    status: 'Completed',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await db.getUSDTTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load USDT transactions:", error);
      showToast("Sync failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = transactions.reduce((sum, tx) => 
    tx.type === 'Inbound' ? sum + tx.amount : sum - tx.amount, 0
  );

  const handleAddTransaction = async () => {
    if (!newTx.amount || newTx.amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    const tx: USDTTransaction = {
      ...newTx as USDTTransaction,
      id: `usdt_${Date.now()}`,
    };
    
    try {
      await db.saveUSDTTransaction(tx);
      setTransactions([tx, ...transactions]);
      setIsAddModalOpen(false);
      showToast("Transaction synced", "success");
    } catch (error) {
      console.error("Failed to save USDT transaction:", error);
      showToast("Sync error", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">USDT Wallet & Purchases</h2>
          <p className="text-slate-500 text-sm mt-1">Track cryptocurrency transactions and available balances.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Bitcoin className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-2">Total Balance</p>
            <h3 className="text-4xl font-black text-white flex items-baseline gap-2">
              {totalBalance.toFixed(2)} <span className="text-xl font-bold text-indigo-400">USDT</span>
            </h3>
            <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Available for purchases</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Inbound</p>
          <p className="text-3xl font-black text-slate-900">
            {transactions.filter(t => t.type === 'Inbound').reduce((s, t) => s + t.amount, 0).toFixed(2)} USDT
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Outbound</p>
          <p className="text-3xl font-black text-slate-900">
            {transactions.filter(t => t.type === 'Outbound').reduce((s, t) => s + t.amount, 0).toFixed(2)} USDT
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="font-bold text-slate-800">Transaction History</h3>
        </div>
        <div className="responsive-table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Est. Value</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      tx.type === 'Inbound' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {tx.type === 'Inbound' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{tx.amount.toFixed(2)} USDT</td>
                  <td className="px-6 py-4">1 USDT = {formatCurrency(tx.usdtRate)}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{formatCurrency(tx.amount * tx.usdtRate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(tx.date)}</td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{tx.note}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal Placeholder */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Add USDT Transaction</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNewTx({ ...newTx, type: 'Inbound' })}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                      newTx.type === 'Inbound' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    Inbound
                  </button>
                  <button 
                    onClick={() => setNewTx({ ...newTx, type: 'Outbound' })}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                      newTx.type === 'Outbound' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    Outbound
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount (USDT)</label>
                  <input 
                    type="number" 
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Exchange Rate (Local)</label>
                  <input 
                    type="number" 
                    value={newTx.usdtRate}
                    onChange={(e) => setNewTx({ ...newTx, usdtRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Note</label>
                  <input 
                    type="text" 
                    value={newTx.note}
                    onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold"
                  />
                </div>
                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddTransaction}
                    className="flex-2 py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    Confirm Transaction
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
