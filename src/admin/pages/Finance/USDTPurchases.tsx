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

  const stats = React.useMemo(() => {
    const inbound = transactions.filter(t => t.type === 'Inbound' && t.status === 'Completed');
    const outbound = transactions.filter(t => t.type === 'Outbound' && t.status === 'Completed');
    
    const totalInbound = inbound.reduce((sum, t) => sum + t.amount, 0);
    const totalOutbound = outbound.reduce((sum, t) => sum + t.amount, 0);
    const totalGbpSpent = inbound.reduce((sum, t) => sum + (t.gbpPaid || (t.amount * t.usdtRate)), 0);
    
    return {
      balance: totalInbound - totalOutbound,
      totalInbound,
      totalOutbound,
      totalGbpSpent,
      avgRate: totalInbound > 0 ? totalGbpSpent / totalInbound : 0
    };
  }, [transactions]);

  // Visual FIFO: Separation of active vs fully utilized
  const groupedTransactions = React.useMemo(() => {
    const active = transactions.filter(t => !t.isFullyUtilized && t.type === 'Inbound');
    // Manual Outbounds without parents are also "active" until they are fully consumed (though they have 0 remaining)
    const activeOutbound = transactions.filter(t => !t.parentId && t.type === 'Outbound');
    
    const completed = transactions.filter(t => t.isFullyUtilized && t.type === 'Inbound');

    const groups: { [key: string]: USDTTransaction[] } = {};
    if ([...active, ...activeOutbound].length > 0) groups['Active Inventory & Batches'] = [...active, ...activeOutbound];
    if (completed.length > 0) groups['Archived / Fully Utilized'] = completed;
    
    return groups;
  }, [transactions]);

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
      status: newTx.status || 'Completed',
      remainingAmount: newTx.type === 'Inbound' ? (newTx.amount || 0) : 0,
      gbpPaid: newTx.type === 'Inbound' ? (newTx.gbpPaid || 0) : 0,
      usdtReceived: newTx.type === 'Inbound' ? (newTx.amount || 0) : 0,
      gbpTotalSpent: newTx.type === 'Inbound' ? (newTx.gbpPaid || (newTx.amount * newTx.usdtRate)) : 0,
      isFullyUtilized: false,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await db.saveUSDTTransaction(tx);
      setTransactions([tx, ...transactions]);
      setIsAddModalOpen(false);
      setNewTx({ type: 'Inbound', amount: 0, usdtRate: 1, status: 'Completed', date: new Date().toISOString().split('T')[0] });
      showToast("Transaction added successfully", "success");
    } catch (error) {
      console.error("Add transaction failed:", error);
      showToast("Failed to add transaction", "error");
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen pb-24">
      {/* Floating Add Button */}
      <motion.button 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-colors group"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </motion.button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">USDT Wallet <span className="text-indigo-600">&</span> Purchases</h2>
          <p className="text-slate-500 text-sm mt-1">Track cryptocurrency transactions and available balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Bitcoin className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2">Total Balance</p>
            <h3 className="text-4xl font-black text-white flex items-baseline gap-2">
              {stats.balance.toFixed(2)} <span className="text-xl font-bold text-indigo-400">USDT</span>
            </h3>
            <div className="mt-6 flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" />
              <span>Available for purchases</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Net Value Strategy</p>
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              You've spent <span className="text-slate-900 font-black">{formatCurrency(stats.totalGbpSpent)}</span> to acquire <span className="text-slate-900 font-black">{stats.totalInbound.toFixed(2)} USDT</span>.
            </p>
            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">
              Avg Rate: {stats.avgRate.toFixed(4)} GBP/USDT
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Inbound</p>
          <p className="text-3xl font-black text-slate-900">
            {stats.totalInbound.toFixed(2)} <span className="text-sm font-bold text-slate-400 uppercase">USDT</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Outbound</p>
          <p className="text-3xl font-black text-slate-900">
            {stats.totalOutbound.toFixed(2)} <span className="text-sm font-bold text-slate-400 uppercase">USDT</span>
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
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === transactions.length && transactions.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4">Transaction / Batch</th>
                <th className="px-6 py-4">Investment & Progress</th>
                <th className="px-6 py-4">Unit Rate</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-600">
              {Object.entries(groupedTransactions).map(([label, txs]) => {
                // Separate Inbound (Parents) and Outbound-without-parents
                const parents = txs.filter(t => t.type === 'Inbound');
                const orphanedOutbound = txs.filter(t => t.type === 'Outbound' && !t.parentId);

                return (
                  <React.Fragment key={label}>
                    <tr className="bg-slate-50/30">
                      <td colSpan={6} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-50">
                        {label}
                      </td>
                    </tr>
                    
                    {/* Render Parents and their Children */}
                    {parents.map(parent => {
                      const children = transactions.filter(t => t.parentId === parent.id);
                      const usagePercent = parent.amount > 0 
                        ? ((parent.amount - (parent.remainingAmount || 0)) / parent.amount) * 100 
                        : 0;
                      const isFullyUtilized = parent.isFullyUtilized;

                      return (
                        <React.Fragment key={parent.id}>
                          {/* Parent Row */}
                          <tr className={`hover:bg-slate-50/30 transition-all group border-b border-slate-50 ${isFullyUtilized ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-6 text-center align-top">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.includes(parent.id)}
                                onChange={() => toggleSelectRow(parent.id)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-6 py-6 max-w-xs align-top">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                    <ArrowDownLeft className="w-2.5 h-2.5" />
                                    Inbound
                                  </span>
                                  {parent.binanceId && (
                                    <span className="text-[10px] font-bold text-slate-400">#{parent.binanceId}</span>
                                  )}
                                </div>
                                <div className="text-lg font-black text-slate-900 leading-tight">
                                  {parent.amount.toFixed(2)} <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">USDT</span>
                                </div>
                                <div className="text-slate-500 text-xs font-medium leading-relaxed italic pr-4">
                                  "{parent.note || 'No description provided'}"
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 align-top">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.1em]">
                                  <span className="text-slate-400">Usage Progress</span>
                                  <span className={isFullyUtilized ? 'text-indigo-600' : 'text-emerald-600'}>
                                    {isFullyUtilized ? 'Fully Utilized' : `${(parent.remainingAmount || 0).toFixed(2)} USDT Left`}
                                  </span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${usagePercent}%` }}
                                    className={`h-full ${isFullyUtilized ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-full transition-all duration-1000`}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-slate-400">Total Spent</span>
                                  <span className="text-indigo-600">{formatCurrency(parent.gbpTotalSpent || (parent.amount * parent.usdtRate))}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 align-top">
                              <div className="space-y-1">
                                <div className="text-xs font-black text-slate-900">
                                  {formatCurrency(parent.usdtRate)} <span className="text-[10px] text-slate-400 uppercase tracking-widest">/ USDT</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">Locked Cost Basis</p>
                              </div>
                            </td>
                            <td className="px-6 py-6 align-top">
                              <select
                                value={parent.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value as any;
                                  await db.saveUSDTTransaction({ ...parent, status: newStatus });
                                  setTransactions(transactions.map(t => t.id === parent.id ? { ...t, status: newStatus } : t));
                                  showToast(`Batch marked as ${newStatus}`, "success");
                                }}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase text-white shadow-sm border-none cursor-pointer focus:ring-4 focus:ring-slate-100 ${
                                  isFullyUtilized ? 'bg-indigo-600' : (parent.status === 'Completed' ? 'bg-emerald-600' : 'bg-slate-500')
                                }`}
                              >
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                              </select>
                            </td>
                            <td className="px-6 py-6 text-right align-top">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>

                          {/* Children (Outbound consumption) */}
                          {children.map(child => (
                            <tr key={child.id} className="bg-slate-50/20 group border-b border-slate-50/50">
                              <td className="px-6 py-4 text-center">
                                <span className="text-slate-300">└─</span>
                              </td>
                              <td className="px-6 py-4 pl-0" colSpan={4}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                      <ArrowUpRight className="w-2.5 h-2.5" />
                                      Outbound
                                    </span>
                                    <div className="text-xs font-bold text-slate-600">
                                      {child.note.replace('Auto-deduction: ', '')}
                                    </div>
                                    <div className="text-xs font-black text-rose-600">
                                      -{child.amount.toFixed(2)} USDT
                                    </div>
                                  </div>
                                  
                                  <button 
                                    onClick={() => {
                                      const search = child.note.includes(': ') ? child.note.split(': ')[1] : '';
                                      window.location.href = `/unlock-world-26/manage-stock?search=${encodeURIComponent(search)}`;
                                    }}
                                    className="px-4 py-2 bg-white text-indigo-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-2 group/btn"
                                  >
                                    <Eye className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                    View Source Codes
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Delete Allocation',
                                      message: 'This will remove the transaction log but won\'t restore balance to the batch. Use with caution.',
                                      isDanger: true,
                                      onConfirm: async () => {
                                        await db.deleteUSDTTransaction(child.id);
                                        setTransactions(prev => prev.filter(t => t.id !== child.id));
                                        setConfirmModal(p => ({ ...p, isOpen: false }));
                                        showToast("Allocation log removed", "success");
                                      }
                                    });
                                  }}
                                  className="p-2 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {/* Render Orphaned Outbounds */}
                    {orphanedOutbound.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/30 transition-all group border-b border-slate-50">
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(tx.id)}
                            onChange={() => toggleSelectRow(tx.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                              <ArrowUpRight className="w-2.5 h-2.5" />
                              Manual Outbound
                            </span>
                          </div>
                          <div className="text-sm font-black text-slate-900">{tx.amount.toFixed(2)} USDT</div>
                          <div className="text-slate-500 text-[10px] font-medium truncate max-w-[200px] mt-1">{tx.note}</div>
                        </td>
                        <td colSpan={2} className="px-6 py-4">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">General Deduction</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-3 py-1 bg-slate-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{tx.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => db.deleteUSDTTransaction(tx.id)} className="p-2 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className={`p-8 flex items-center justify-between ${newTx.type === 'Inbound' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Add Transaction</h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Manual Entry & FIFO Log</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Type Toggle */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block text-center">Transaction Direction</label>
                  <div className="flex p-1.5 bg-slate-100 rounded-3xl gap-2">
                    <button 
                      onClick={() => setNewTx({ ...newTx, type: 'Inbound' })}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        newTx.type === 'Inbound' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Inbound (Replenish)
                    </button>
                    <button 
                      onClick={() => setNewTx({ ...newTx, type: 'Outbound' })}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        newTx.type === 'Outbound' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Outbound (Usage)
                    </button>
                  </div>
                </div>

                {newTx.type === 'Inbound' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Amount Paid (GBP)</label>
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</div>
                          <input 
                            type="number" 
                            placeholder="0.00"
                            value={newTx.gbpPaid || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const rate = newTx.amount ? val / newTx.amount : 0;
                              setNewTx({ ...newTx, gbpPaid: val, usdtRate: rate });
                            }}
                            className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-3xl font-black text-2xl text-slate-900 transition-all outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Amount Received (USDT)</label>
                        <div className="relative group">
                          <input 
                            type="number" 
                            placeholder="0.00"
                            value={newTx.amount || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const rate = val > 0 ? (newTx.gbpPaid || 0) / val : 0;
                              setNewTx({ ...newTx, amount: val, usdtRate: rate });
                            }}
                            className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-3xl font-black text-2xl text-slate-900 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Auto-rate Message */}
                    <div className="p-4 bg-indigo-50/50 rounded-2xl flex items-center justify-between border border-indigo-100/50">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Effective Rate</span>
                      </div>
                      <div className="text-indigo-900 font-black">
                        1 USDT = {formatCurrency(newTx.usdtRate || 0)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Amount to Deduct (USDT)</label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={newTx.amount || ''}
                        onChange={(e) => setNewTx({ ...newTx, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-rose-500/20 focus:bg-white rounded-3xl font-black text-2xl text-slate-900 transition-all outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Binance P2P ID (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 20421394..."
                      value={newTx.binanceId || ''}
                      onChange={(e) => setNewTx({ ...newTx, binanceId: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Date</label>
                    <input 
                      type="date" 
                      value={newTx.date}
                      onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Internal Note</label>
                  <textarea 
                    placeholder="Describe this transaction..."
                    value={newTx.note || ''}
                    onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                    rows={2}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddTransaction}
                    className={`flex-[2] py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs text-white shadow-xl transition-all hover:translate-y-[-2px] ${
                      newTx.type === 'Inbound' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'
                    }`}
                  >
                    Complete Transaction
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
