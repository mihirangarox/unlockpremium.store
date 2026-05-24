/**
 * B2BManageOrders.tsx — Admin dashboard for B2B Bulk Orders
 *
 * Views:
 *  1. Master List   — table of all bulk_orders with quick pay-toggle
 *  2. Order Detail  — seat list sorted by renewalDate with approval
 *                     workflow (custom salePrice / costPrice input) and
 *                     multi-select "Bulk Renew Selected" action
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Package,
  TrendingUp,
  CreditCard,
  Check,
  Info,
} from 'lucide-react';
import * as db from '../../services/db';
import { useToast } from '../../components/ui/Toast';
import type { BulkOrder, BulkOrderSeat } from '../../types/index';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const daysUntil = (iso?: string): number | null => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── PaymentStatus badge ──────────────────────────────────────────────────────

const PayBadge: React.FC<{ status: BulkOrder['paymentStatus'] }> = ({ status }) => {
  const map: Record<BulkOrder['paymentStatus'], string> = {
    Paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
    Partial: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border uppercase tracking-wide ${map[status]}`}
    >
      {status}
    </span>
  );
};

// ─── OrderStatus badge ────────────────────────────────────────────────────────

const OrderStatusBadge: React.FC<{ status: BulkOrder['status'] }> = ({ status }) => {
  const map: Record<BulkOrder['status'], string> = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Partially Active': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Completed: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border uppercase tracking-wide ${map[status]}`}
    >
      {status}
    </span>
  );
};

// ─── Seat status badge ────────────────────────────────────────────────────────

const SeatBadge: React.FC<{ status: BulkOrderSeat['status'] }> = ({ status }) => {
  const map: Record<BulkOrderSeat['status'], string> = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Expired: 'bg-red-50 text-red-700 border-red-200',
    Cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border uppercase tracking-wide ${map[status]}`}
    >
      {status}
    </span>
  );
};

// ─── Price input field ────────────────────────────────────────────────────────

const PriceInput: React.FC<{
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}> = ({ label, hint, value, onChange, id }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5"
    >
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
        £
      </span>
      <input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="0.00"
      />
    </div>
    <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
  </div>
);

// ─── Approval / Price Modal ───────────────────────────────────────────────────

interface ApprovalModalProps {
  title: string;
  description: string;
  seats: number;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (salePrice: number, costPrice: number) => Promise<void>;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  title,
  description,
  seats,
  isOpen,
  isSaving,
  onClose,
  onConfirm,
}) => {
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [error, setError] = useState('');

  const profit = parseFloat(salePrice || '0') - parseFloat(costPrice || '0');
  const totalRevenue = parseFloat(salePrice || '0') * seats;
  const totalProfit = profit * seats;
  const margin =
    parseFloat(salePrice || '0') > 0
      ? ((profit / parseFloat(salePrice || '1')) * 100).toFixed(1)
      : '0';

  const handleConfirm = async () => {
    const sp = parseFloat(salePrice);
    const cp = parseFloat(costPrice);
    if (isNaN(sp) || sp <= 0) {
      setError('Please enter a valid sale price (must be > 0).');
      return;
    }
    if (isNaN(cp) || cp < 0) {
      setError('Please enter a valid cost price (0 or more).');
      return;
    }
    setError('');
    await onConfirm(sp, cp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Enter the prices you negotiated with this manager on WhatsApp.
              These are per-license amounts. The totals are calculated automatically.
            </p>
          </div>

          {/* Price inputs */}
          <div className="grid grid-cols-2 gap-4">
            <PriceInput
              id="modal-sale-price"
              label="Sale Price / seat"
              hint="What the manager pays you"
              value={salePrice}
              onChange={setSalePrice}
            />
            <PriceInput
              id="modal-cost-price"
              label="Cost Price / seat"
              hint="What you pay the supplier"
              value={costPrice}
              onChange={setCostPrice}
            />
          </div>

          {/* Live totals */}
          {parseFloat(salePrice) > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Revenue', value: fmt(totalRevenue), color: 'text-slate-900' },
                { label: 'Profit', value: fmt(totalProfit), color: totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600' },
                { label: 'Margin', value: `${margin}%`, color: 'text-indigo-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className={`text-sm font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-400">× {seats} seats</p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-red-600 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm & Save
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Detail View ──────────────────────────────────────────────────────────────

const OrderDetailView: React.FC<{
  order: BulkOrder;
  onBack: () => void;
  onOrderUpdated: () => void;
}> = ({ order, onBack, onOrderUpdated }) => {
  const { showToast } = useToast();
  const [seats, setSeats] = useState<BulkOrderSeat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Modals
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    seatId?: string; // undefined = approve whole order level pricing
    mode: 'approve-order' | 'renew-seats';
  }>({ isOpen: false, mode: 'approve-order' });
  const [isSaving, setIsSaving] = useState(false);

  const loadSeats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await db.getBulkOrderSeats(order.id);
      // Sort by renewalDate ascending (earliest renewals first)
      data.sort((a, b) => {
        if (!a.renewalDate) return 1;
        if (!b.renewalDate) return -1;
        return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
      });
      setSeats(data);
    } catch {
      showToast('Failed to load seats', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  const filteredSeats = seats.filter(
    (s) =>
      s.repEmail.toLowerCase().includes(search.toLowerCase()) ||
      (s.repName && s.repName.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSeat = (id: string) =>
    setSelectedSeatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = (checked: boolean) =>
    setSelectedSeatIds(checked ? filteredSeats.map((s) => s.id) : []);

  // ── Mark order as Paid ────────────────────────────────────────────────────
  const handleMarkPaid = async () => {
    try {
      await db.saveBulkOrder({
        ...order,
        paymentStatus: 'Paid',
        updatedAt: new Date().toISOString(),
      });
      showToast('Order marked as Paid', 'success');
      onOrderUpdated();
    } catch {
      showToast('Failed to update payment status', 'error');
    }
  };

  // ── Approve order — set pricing on all pending seats ─────────────────────
  const handleApproveOrder = async (salePrice: number, costPrice: number) => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Update each pending seat with price + activation dates
      await Promise.all(
        seats
          .filter((s) => s.status === 'Pending')
          .map((s) =>
            db.updateBulkOrderSeat(s.id, {
              salePrice,
              costPrice,
              status: 'Active',
              startDate: now,
              renewalDate,
            })
          )
      );

      // Update the parent order aggregate pricing
      await db.saveBulkOrder({
        ...order,
        salePrice,
        costPrice,
        totalRevenue: salePrice * order.totalLicenses,
        totalCost: costPrice * order.totalLicenses,
        totalProfit: (salePrice - costPrice) * order.totalLicenses,
        status: 'Active',
        updatedAt: now,
      });

      showToast('Order approved and all seats activated!', 'success');
      setApprovalModal({ isOpen: false, mode: 'approve-order' });
      await loadSeats();
      onOrderUpdated();
    } catch {
      showToast('Approval failed. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Bulk renew selected seats ─────────────────────────────────────────────
  const handleBulkRenew = async (salePrice: number, costPrice: number) => {
    if (selectedSeatIds.length === 0) return;
    setIsSaving(true);
    try {
      const newRenewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await Promise.all(
        selectedSeatIds.map((id) =>
          db.updateBulkOrderSeat(id, {
            salePrice,
            costPrice,
            status: 'Active',
            renewalDate: newRenewalDate,
          })
        )
      );

      showToast(
        `${selectedSeatIds.length} seat${selectedSeatIds.length > 1 ? 's' : ''} renewed successfully`,
        'success'
      );
      setApprovalModal({ isOpen: false, mode: 'renew-seats' });
      setSelectedSeatIds([]);
      await loadSeats();
    } catch {
      showToast('Renewal failed. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const pendingCount = seats.filter((s) => s.status === 'Pending').length;
  const activeCount = seats.filter((s) => s.status === 'Active').length;

  return (
    <div className="space-y-6">

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">
            {order.managerName}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {order.managerEmail} · {order.totalLicenses} seats ·{' '}
            <span className="font-mono text-xs">{order.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge status={order.status} />
          <PayBadge status={order.paymentStatus} />
        </div>
      </div>

      {/* Order summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: order.totalRevenue > 0 ? fmt(order.totalRevenue) : 'TBD',
            sub: `${order.totalLicenses} × ${order.salePrice > 0 ? fmt(order.salePrice) : '?'}`,
            icon: TrendingUp,
            color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          },
          {
            label: 'Total Cost',
            value: order.totalCost > 0 ? fmt(order.totalCost) : 'TBD',
            sub: `${order.totalLicenses} × ${order.costPrice > 0 ? fmt(order.costPrice) : '?'}`,
            icon: CreditCard,
            color: 'bg-slate-50 border-slate-100 text-slate-700',
          },
          {
            label: 'Total Profit',
            value: order.totalProfit > 0 ? fmt(order.totalProfit) : 'TBD',
            sub:
              order.totalRevenue > 0
                ? `${((order.totalProfit / order.totalRevenue) * 100).toFixed(1)}% margin`
                : 'Pending pricing',
            icon: DollarSign,
            color: 'bg-indigo-50 border-indigo-100 text-indigo-700',
          },
          {
            label: 'Seats',
            value: `${activeCount}/${order.totalLicenses}`,
            sub: `${pendingCount} pending activation`,
            icon: Users,
            color: 'bg-amber-50 border-amber-100 text-amber-700',
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className={`rounded-2xl p-5 border flex flex-col gap-2 ${color.split(' ')[0]} ${color.split(' ')[1]}`}
          >
            <Icon className={`w-5 h-5 ${color.split(' ')[2]}`} />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-current opacity-60 mb-0.5">
                {label}
              </div>
              <div className="text-xl font-black text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by rep email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Approve all pending */}
        {pendingCount > 0 && (
          <button
            onClick={() => setApprovalModal({ isOpen: true, mode: 'approve-order' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve & Set Pricing ({pendingCount})
          </button>
        )}

        {/* Mark paid */}
        {order.paymentStatus !== 'Paid' && (
          <button
            onClick={handleMarkPaid}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <CreditCard className="w-4 h-4" />
            Mark as Paid
          </button>
        )}
      </div>

      {/* Seats table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-440px)] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedSeatIds.length === filteredSeats.length && filteredSeats.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Rep</th>
                <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">
                  Renewal Date ↑
                </th>
                <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Sale £</th>
                <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Cost £</th>
                <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Profit £</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-7 h-7 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading seats…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSeats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-sm font-medium">
                    No seats found.
                  </td>
                </tr>
              ) : (
                filteredSeats.map((seat, i) => {
                  const days = daysUntil(seat.renewalDate);
                  const isUrgent = days !== null && days <= 5 && days >= 0;
                  const isOverdue = days !== null && days < 0;
                  const profit =
                    seat.salePrice != null && seat.costPrice != null
                      ? seat.salePrice - seat.costPrice
                      : null;

                  return (
                    <motion.tr
                      key={seat.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`group hover:bg-slate-50/80 transition-colors ${
                        selectedSeatIds.includes(seat.id) ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedSeatIds.includes(seat.id)}
                          onChange={() => toggleSeat(seat.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400 font-bold">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-bold text-slate-900">
                          {seat.repName || seat.repEmail}
                        </div>
                        {seat.repName && (
                          <div className="text-xs text-slate-400 font-mono">{seat.repEmail}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <SeatBadge status={seat.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div
                          className={`text-sm font-bold ${
                            isOverdue
                              ? 'text-red-600'
                              : isUrgent
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {fmtDate(seat.renewalDate)}
                        </div>
                        {days !== null && (
                          <div
                            className={`text-[10px] font-bold mt-0.5 ${
                              isOverdue
                                ? 'text-red-500'
                                : isUrgent
                                ? 'text-amber-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {isOverdue
                              ? `${Math.abs(days)}d overdue`
                              : days === 0
                              ? 'Due today'
                              : `${days}d remaining`}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900">
                        {seat.salePrice != null ? fmt(seat.salePrice) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-700">
                        {seat.costPrice != null ? fmt(seat.costPrice) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold">
                        {profit != null ? (
                          <span className={profit >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                            {fmt(profit)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating bulk-renew bar */}
      <AnimatePresence>
        {selectedSeatIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl px-5 py-3.5 flex items-center gap-6 shadow-2xl border border-white/10"
          >
            <div className="flex items-center gap-3 pr-5 border-r border-white/10">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-black text-sm">
                {selectedSeatIds.length}
              </div>
              <span className="text-sm font-bold text-slate-300">Seats selected</span>
            </div>
            <button
              onClick={() => setApprovalModal({ isOpen: true, mode: 'renew-seats' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-900/30"
            >
              <RefreshCw className="w-4 h-4" />
              Bulk Renew Selected
            </button>
            <button
              onClick={() => setSelectedSeatIds([])}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval modal */}
      <AnimatePresence>
        <ApprovalModal
          isOpen={approvalModal.isOpen}
          title={
            approvalModal.mode === 'approve-order'
              ? 'Set Pricing & Approve Order'
              : `Renew ${selectedSeatIds.length} Seat${selectedSeatIds.length > 1 ? 's' : ''}`
          }
          description={
            approvalModal.mode === 'approve-order'
              ? 'Enter the negotiated prices for this batch. All pending seats will be activated.'
              : 'Enter the renewal pricing for the selected seats. Renewal date will be set to +30 days from today.'
          }
          seats={
            approvalModal.mode === 'approve-order' ? pendingCount : selectedSeatIds.length
          }
          isSaving={isSaving}
          onClose={() => setApprovalModal((p) => ({ ...p, isOpen: false }))}
          onConfirm={
            approvalModal.mode === 'approve-order' ? handleApproveOrder : handleBulkRenew
          }
        />
      </AnimatePresence>
    </div>
  );
};

// ─── Master List View ─────────────────────────────────────────────────────────

export function B2BManageOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<BulkOrder | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await db.getBulkOrders();
      setOrders(data);
    } catch {
      showToast('Failed to load bulk orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders.filter(
    (o) =>
      o.managerName.toLowerCase().includes(search.toLowerCase()) ||
      o.managerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleTogglePaid = async (order: BulkOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(order.id);
    const newStatus: BulkOrder['paymentStatus'] =
      order.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await db.saveBulkOrder({
        ...order,
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: newStatus } : o))
      );
      showToast(`Payment status → ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update payment status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + (o.totalRevenue || 0), 0);
  const totalProfit = orders.reduce((s, o) => s + (o.totalProfit || 0), 0);
  const totalSeats = orders.reduce((s, o) => s + o.totalLicenses, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => {
          setSelectedOrder(null);
          loadOrders();
        }}
        onOrderUpdated={() => {
          // Refresh the selected order data
          db.getBulkOrder(selectedOrder.id).then((updated) => {
            if (updated) setSelectedOrder(updated);
          });
          loadOrders();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            B2B Bulk Orders
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage team Sales Navigator licenses. Click any row to view seats and
            set pricing.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: String(orders.length), color: 'bg-white border-slate-200' },
            { label: 'Pending Approval', value: String(pendingOrders), color: 'bg-amber-50 border-amber-200' },
            { label: 'Total Seats', value: String(totalSeats), color: 'bg-indigo-50 border-indigo-200' },
            { label: 'Total Revenue', value: totalRevenue > 0 ? fmt(totalRevenue) : 'TBD', color: 'bg-emerald-50 border-emerald-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl p-5 border shadow-sm ${color}`}>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {label}
              </span>
              <div className="text-3xl font-black text-slate-900 mt-2">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by manager name, email, or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-380px)] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Seats</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Order Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="font-medium">Loading orders…</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-10 h-10 opacity-30" />
                        <p className="font-bold text-slate-600">No bulk orders yet</p>
                        <p className="text-sm">
                          Orders submitted via{' '}
                          <span className="font-mono text-indigo-500">/bulk-order</span>{' '}
                          will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      onClick={() => setSelectedOrder(order)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {fmtDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{order.managerName}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{order.managerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-sm font-black">
                            {order.activatedLicenses}/{order.totalLicenses}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        {/* Quick toggle button */}
                        <button
                          onClick={(e) => handleTogglePaid(order, e)}
                          disabled={togglingId === order.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {togglingId === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : order.paymentStatus === 'Paid' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {order.paymentStatus}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {order.totalRevenue > 0 ? fmt(order.totalRevenue) : (
                          <span className="text-slate-300 text-xs font-medium">Pending quote</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                          >
                            Open <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
