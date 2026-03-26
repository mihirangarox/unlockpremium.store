import React, { useState, useEffect } from 'react';
import { 
  Bitcoin, Plus, TrendingUp, History, Wallet, 
  ArrowUpRight, ArrowDownLeft, Trash2, Edit3, 
  Eye, CheckCircle2, Clock, XCircle, AlertCircle,
  MoreVertical, Download, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../../context/LocalizationContext';
import { useToast } from '../../components/ui/Toast';
import * as db from "../../services/db";
import { USDTTransaction } from "../../types";

export function USDTPurchases() {
  const { formatCurrency, formatDate } = useLocalization();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<USDTTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Editing Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<USDTTransaction | null>(null);
  
  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });
  
  // Add Modal (Legacy or quick add)
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

  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: { [key: string]: USDTTransaction[] } = {};
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sorted.forEach(tx => {
      const dateStr = tx.date?.split('T')[0] || new Date().toISOString().split('T')[0];
      let label = formatDate(dateStr);
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (dateStr === today) label = "Today";
      else if (dateStr === yesterday) label = "Yesterday";
      
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });
    
    return groups;
  }, [transactions, formatDate]);

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800">Transaction History</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-20 bg-indigo-600 p-4 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-4 text-white">
                <button 
                  onClick={() => setSelectedIds([])}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                <span className="font-bold">{selectedIds.length} Transactions Selected</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete Transactions',
                      message: `Are you sure you want to delete ${selectedIds.length} transactions? This action cannot be undone.`,
                      isDanger: true,
                      onConfirm: async () => {
                        try {
                          await Promise.all(selectedIds.map(id => db.deleteUSDTTransaction(id)));
                          setTransactions(prev => prev.filter(t => !selectedIds.includes(t.id)));
                          setSelectedIds([]);
                          showToast(`Successfully deleted ${selectedIds.length} transactions`, "success");
                        } catch (error) {
                          console.error("Bulk delete failed:", error);
                          showToast("Failed to delete some transactions", "error");
                        }
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      }
                    });
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
                <button 
                  onClick={() => {
                    const selectedRows = transactions.filter(t => selectedIds.includes(t.id));
                    const headers = ["ID", "Type", "Amount", "Rate", "GBP Spent", "Date", "Status", "Note"];
                    const rows = selectedRows.map(t => [
                      t.id, 
                      t.type, 
                      t.amount.toFixed(2), 
                      t.usdtRate.toFixed(2), 
                      t.type === 'Inbound' ? (t.gbpTotalSpent || t.amount * t.usdtRate).toFixed(2) : '-',
                      t.date, 
                      t.status, 
                      t.note || ''
                    ]);
                    
                    const csvContent = [
                      headers,
                      ...rows
                    ].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", `usdt_transactions_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast("Exported to CSV", "success");
                  }}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-indigo-50"
                >
                  Export Selected
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="responsive-table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === transactions.length && transactions.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Remaining</th>
                <th className="px-6 py-4">Rate (GBP)</th>
                <th className="px-6 py-4">GBP Spent</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-600">
              {Object.entries(groupedTransactions).map(([label, txs]) => (
                <React.Fragment key={label}>
                  <tr className="bg-slate-50/30">
                    <td colSpan={9} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-50">
                      {label}
                    </td>
                  </tr>
                  {txs.map(tx => {
                    const statusConfig = {
                      'Completed': { bg: 'bg-emerald-500', icon: <CheckCircle2 className="w-3 h-3" /> },
                      'Pending': { bg: 'bg-amber-500', icon: <Clock className="w-3 h-3" /> },
                      'Failed': { bg: 'bg-rose-500', icon: <XCircle className="w-3 h-3" /> }
                    };
                    const status = tx.isFullyUtilized ? 'Fully Utilized' : tx.status;
                    const isFullyUtilized = tx.isFullyUtilized;

                    return (
                      <tr 
                        key={tx.id} 
                        className={`hover:bg-slate-50/30 transition-colors group ${isFullyUtilized ? 'opacity-40' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(tx.id)}
                            onChange={() => toggleSelectRow(tx.id)}
                            className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            tx.type === 'Inbound' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {tx.type === 'Inbound' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{tx.amount.toFixed(2)} USDT</td>
                        <td className="px-6 py-4">
                          {tx.type === 'Inbound' ? (
                            <span className={`font-bold ${isFullyUtilized ? 'text-slate-400' : 'text-emerald-600'}`}>
                              {tx.remainingAmount?.toFixed(2)} USDT
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tx.usdtRate > 10 ? (
                            <div className="flex items-center gap-1 text-amber-600 hover:text-amber-700 cursor-help" title="Unusually high exchange rate">
                              <AlertCircle className="w-3 h-3" />
                              1 USDT = {formatCurrency(tx.usdtRate)}
                            </div>
                          ) : (
                            `1 USDT = ${formatCurrency(tx.usdtRate)}`
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">
                          {tx.type === 'Inbound' ? formatCurrency(tx.gbpTotalSpent || (tx.amount * tx.usdtRate)) : '-'}
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          {tx.note?.startsWith('Restock cost:') ? (
                            <a 
                              href={`/admin/manage-stock?search=${tx.note.split(': ')[1]}`}
                              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors group/link"
                            >
                              <span className="truncate">{tx.note}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          ) : (
                            <div 
                              onClick={() => {
                                setEditingTx(tx);
                                setIsDrawerOpen(true);
                              }}
                              className="flex items-center gap-2 group/note cursor-pointer hover:text-indigo-600 transition-colors"
                            >
                              <span className="truncate">{tx.note || '(No note)'}</span>
                              <Edit3 className="w-3 h-3 opacity-0 group-hover/note:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={tx.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value as any;
                              await db.saveUSDTTransaction({ ...tx, status: newStatus });
                              setTransactions(transactions.map(t => t.id === tx.id ? { ...t, status: newStatus } : t));
                              showToast(`Status updated to ${newStatus}`, "success");
                            }}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm border-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 ${
                              isFullyUtilized ? 'bg-slate-400' : (statusConfig[tx.status as keyof typeof statusConfig]?.bg || 'bg-slate-500')
                            }`}
                          >
                            <option value="Completed" className="bg-white text-slate-900">Completed</option>
                            <option value="Pending" className="bg-white text-slate-900">Pending</option>
                            <option value="Failed" className="bg-white text-slate-900">Failed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTx(tx);
                                setIsDrawerOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Edit Transaction"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete"
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Delete Transaction',
                                  message: 'Are you sure you want to delete this transaction?',
                                  isDanger: true,
                                  onConfirm: async () => {
                                    try {
                                      await db.deleteUSDTTransaction(tx.id);
                                      setTransactions(prev => prev.filter(t => t.id !== tx.id));
                                      showToast("Transaction deleted", "success");
                                    } catch (error) {
                                      showToast("Delete failed", "error");
                                    }
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  }
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Edit Drawer */}
      <AnimatePresence>
        {isDrawerOpen && editingTx && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                <div>
                  <h3 className="text-xl font-bold">Edit Transaction</h3>
                  <p className="text-slate-400 text-xs mt-1">ID: {editingTx.id}</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Transaction Type</label>
                  <div className="flex gap-2">
                    {['Inbound', 'Outbound'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setEditingTx({ ...editingTx, type: type as any })}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                          editingTx.type === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount (USDT)</label>
                    <input 
                      type="number" 
                      value={editingTx.amount}
                      onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Exchange Rate</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={editingTx.usdtRate}
                        onChange={(e) => setEditingTx({ ...editingTx, usdtRate: parseFloat(e.target.value) })}
                        className={`w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900 ${editingTx.usdtRate > 10 ? 'ring-2 ring-amber-500' : ''}`}
                      />
                      {editingTx.usdtRate > 10 && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>

                {editingTx.usdtRate > 10 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="font-bold">Unusually High Rate</p>
                      <p className="opacity-80">This rate (1 USDT = {formatCurrency(editingTx.usdtRate)}) is significantly outside the normal range. Please verify.</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Status</label>
                  <select 
                    value={editingTx.status}
                    onChange={(e) => setEditingTx({ ...editingTx, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Note</label>
                  <textarea 
                    value={editingTx.note}
                    onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900 resize-none"
                    placeholder="Enter transaction details..."
                  />
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await db.saveUSDTTransaction(editingTx);
                      setTransactions(transactions.map(t => t.id === editingTx.id ? editingTx : t));
                      setIsDrawerOpen(false);
                      showToast("Changes saved successfully", "success");
                    } catch (error) {
                      showToast("Failed to save changes", "error");
                    }
                  }}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
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
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Exchange Rate (Local)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={newTx.usdtRate}
                      onChange={(e) => setNewTx({ ...newTx, usdtRate: parseFloat(e.target.value) })}
                      className={`w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900 ${(newTx.usdtRate || 0) > 10 ? 'ring-2 ring-amber-500' : ''}`}
                    />
                    {(newTx.usdtRate || 0) > 10 && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Note</label>
                  <input 
                    type="text" 
                    value={newTx.note}
                    onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900"
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
    </div>
  );
}
