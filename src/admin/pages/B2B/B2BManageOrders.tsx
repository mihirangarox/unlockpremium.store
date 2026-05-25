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
  User,
  Zap,
  XCircle,
  Trash2,
  FileText,
  MessageSquare,
  Copy,
  ExternalLink,
  Edit,
  Save,
  Plus,
  UserPlus,
} from 'lucide-react';
import * as db from '../../services/db';
import { useToast } from '../../components/ui/Toast';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
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
  prefix?: string;
}> = ({ label, hint, value, onChange, id, prefix = '£' }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5"
    >
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
        {prefix}
      </span>
      <input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${prefix.length > 1 ? 'pl-12' : 'pl-7'} pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        placeholder="0.00"
      />
    </div>
    <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
  </div>
);

// ─── Add Seat Modal ───────────────────────────────────────────────────────────

interface AddSeatModalProps {
  isOpen: boolean;
  isSaving: boolean;
  defaultSalePrice?: number;
  defaultUsdtCost?: number;
  onClose: () => void;
  onConfirm: (repName: string, repEmail: string, salePrice: number, usdtCost: number) => Promise<void>;
}

const AddSeatModal: React.FC<AddSeatModalProps> = ({
  isOpen,
  isSaving,
  defaultSalePrice,
  defaultUsdtCost,
  onClose,
  onConfirm,
}) => {
  const [repName, setRepName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [salePrice, setSalePrice] = useState(defaultSalePrice?.toString() ?? '');
  const [usdtCost, setUsdtCost] = useState(defaultUsdtCost?.toString() ?? '');
  const [error, setError] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setRepName('');
      setRepEmail('');
      setSalePrice(defaultSalePrice?.toString() ?? '');
      setUsdtCost(defaultUsdtCost?.toString() ?? '');
      setError('');
    }
  }, [isOpen, defaultSalePrice, defaultUsdtCost]);

  const EST_USDT_TO_GBP = 0.78;
  const salePriceNum = parseFloat(salePrice || '0');
  const usdtCostNum = parseFloat(usdtCost || '0');
  const gbpCost = usdtCostNum * EST_USDT_TO_GBP;
  const profit = salePriceNum - gbpCost;

  const handleSubmit = async () => {
    if (!repEmail.trim() || !repEmail.includes('@')) {
      setError('Please enter a valid rep email address.');
      return;
    }
    const sp = parseFloat(salePrice);
    const cp = parseFloat(usdtCost);
    if (isNaN(sp) || sp <= 0) {
      setError('Please enter a valid sale price (must be > 0).');
      return;
    }
    if (isNaN(cp) || cp < 0) {
      setError('Please enter a valid USDT cost (0 or more).');
      return;
    }
    setError('');
    await onConfirm(repName.trim(), repEmail.trim(), sp, cp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Add New Seat</h3>
                <p className="text-sm text-slate-500 mt-0.5">Inject a rep mid-cycle with Pending status</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This seat will be added as <strong>Pending</strong>. Collect payment from the Manager before activating it.
            </p>
          </div>

          {/* Rep fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rep Name <span className="font-normal text-slate-400 normal-case">(optional)</span></label>
              <input
                type="text"
                value={repName}
                onChange={e => setRepName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rep LinkedIn Email *</label>
              <input
                type="email"
                value={repEmail}
                onChange={e => setRepEmail(e.target.value)}
                placeholder="e.g. john@company.com"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sale Price (£) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">USDT Cost *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={usdtCost}
                  onChange={e => setUsdtCost(e.target.value)}
                  className="w-full pl-3 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">USDT</span>
              </div>
            </div>
          </div>

          {/* Live profit preview */}
          {salePriceNum > 0 && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Revenue</div>
                <div className="text-sm font-black text-emerald-600">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(salePriceNum)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">GBP Cost</div>
                <div className="text-sm font-black text-slate-700">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(gbpCost)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Profit</div>
                <div className={`text-sm font-black ${profit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(profit)}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Add Seat
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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
  const [isOnDemand, setIsOnDemand] = useState(true); // Default true for B2B
  const [error, setError] = useState('');

  // 0.78 is a rough GBP/USDT exchange rate for live preview estimation
  const EST_USDT_TO_GBP = 0.78;
  const estimatedGbpCost = parseFloat(costPrice || '0') * EST_USDT_TO_GBP;
  const profit = parseFloat(salePrice || '0') - estimatedGbpCost;
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

          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setIsOnDemand(v => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                  isOnDemand ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  isOnDemand ? 'left-4' : 'left-0.5'
                }`} />
              </div>
              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                Purchase On-Demand
                <span className="ml-1.5 text-[10px] font-medium text-slate-400 normal-case">
                  (bypass stock inventory)
                </span>
              </span>
            </label>
            {isOnDemand && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium">
                  USDT will be deducted from your FIFO ledger immediately on approval. Bulk placeholder links will be generated automatically.
                </p>
              </div>
            )}
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
              id="modal-usdt-cost"
              label="USDT Cost / seat"
              hint="What you pay the supplier (USDT)"
              value={costPrice}
              onChange={setCostPrice}
              prefix="USDT"
            />
          </div>

          {/* Live totals */}
          {parseFloat(salePrice) > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Revenue', value: fmt(totalRevenue), color: 'text-slate-900' },
                { label: 'Est. Profit', value: fmt(totalProfit), color: totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600' },
                { label: 'Est. Margin', value: `${margin}%`, color: 'text-indigo-700' },
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

  // Add Seat Modal
  const [addSeatModal, setAddSeatModal] = useState(false);
  const [isAddingSeat, setIsAddingSeat] = useState(false);

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

  // New Parity States
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editedManagerName, setEditedManagerName] = useState('');
  const [editedManagerEmail, setEditedManagerEmail] = useState('');
  const [editedManagerWhatsapp, setEditedManagerWhatsapp] = useState('');
  
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || '');
  const [saveNoteStatus, setSaveNoteStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounced Internal Notes save
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (internalNotes !== (order.internalNotes || '')) {
        setSaveNoteStatus('saving');
        try {
          await db.saveBulkOrder({ ...order, internalNotes });
          setSaveNoteStatus('saved');
          setTimeout(() => setSaveNoteStatus('idle'), 2000);
          onOrderUpdated();
        } catch {
          setSaveNoteStatus('idle');
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [internalNotes, order]);

  // Seat Inline Editing State
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);
  const [editedSeatName, setEditedSeatName] = useState('');
  const [editedSeatEmail, setEditedSeatEmail] = useState('');

  const startEditingSeat = (seat: BulkOrderSeat) => {
    setEditingSeatId(seat.id);
    setEditedSeatName(seat.repName || '');
    setEditedSeatEmail(seat.repEmail || '');
  };

  const handleSaveSeatEdit = async (seatId: string) => {
    try {
      await db.updateBulkOrderSeat(seatId, {
        repName: editedSeatName,
        repEmail: editedSeatEmail
      });
      showToast("Seat updated successfully", "success");
      setEditingSeatId(null);
      loadSeats();
    } catch {
      showToast("Failed to update seat", "error");
    }
  };

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  const handleAddSeat = async (repName: string, repEmail: string, salePrice: number, usdtCost: number) => {
    setIsAddingSeat(true);
    try {
      await db.addSeatToBulkOrder(order.id, { repName, repEmail, salePrice, usdtCost });
      showToast(`New seat for ${repEmail} added successfully!`, 'success');
      setAddSeatModal(false);
      loadSeats();
      onOrderUpdated(); // refresh parent order totals in the list
    } catch (err) {
      showToast(`Failed to add seat: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsAddingSeat(false);
    }
  };

  const startEditingClient = () => {
    setEditedManagerName(order.managerName);
    setEditedManagerEmail(order.managerEmail);
    setEditedManagerWhatsapp(order.managerWhatsapp || '');
    setIsEditingClient(true);
  };

  const handleSaveClient = async () => {
    setIsSaving(true);
    try {
      await db.saveBulkOrder({
        ...order,
        managerName: editedManagerName,
        managerEmail: editedManagerEmail,
        managerWhatsapp: editedManagerWhatsapp,
      });
      setIsEditingClient(false);
      showToast("Client information updated", "success");
      onOrderUpdated();
    } catch {
      showToast("Failed to update client information", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateInvoice = () => {
    generateInvoicePDF({
      customerName: order.managerName,
      subscriptionType: order.productName || "Sales Navigator",
      planDuration: order.planDuration || "",
      startDate: order.startDate ? fmtDate(order.startDate) : "TBD",
      renewalDate: order.renewalDate ? fmtDate(order.renewalDate) : "TBD",
      amount: fmt(order.totalRevenue || 0),
      status: order.paymentStatus,
      email: order.managerEmail,
      whatsapp: order.managerWhatsapp || ""
    });
    showToast("Professional PDF Invoice generated!", "success");
  };

  const handleWhatsAppLink = () => {
    if (!order.managerWhatsapp) {
      showToast("No WhatsApp number provided for this order.", "error");
      return;
    }
    const text = `*INVOICE*\n-----------------------------\n*Customer:* ${order.managerName}\n*Subscription:* ${order.totalLicenses}x ${order.productName}\n*Total Amount:* ${fmt(order.totalRevenue)}\n*Status:* ${order.paymentStatus}\n\nThank you for your business!`;
    const cleanNumber = order.managerWhatsapp.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePaymentStatusChange = async (newStatus: BulkOrder['paymentStatus']) => {
    try {
      if (newStatus === 'Paid' && order.paymentStatus !== 'Paid') {
        await handleMarkPaid();
      } else {
        await db.saveBulkOrder({ ...order, paymentStatus: newStatus });
        showToast("Payment status updated", "success");
        onOrderUpdated();
      }
    } catch {
      showToast("Failed to update payment status", "error");
    }
  };

  const handleDateChange = async (field: 'startDate' | 'renewalDate', val: string) => {
    try {
      await db.saveBulkOrder({ ...order, [field]: val || undefined });
      showToast("Date updated", "success");
      onOrderUpdated();
    } catch {
      showToast("Failed to update date", "error");
    }
  };

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
      await db.markBulkOrderPaid(order.id);
      showToast('Order marked as Paid & Seats Activated!', 'success');
      await loadSeats();
      onOrderUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  // ── Approve order — set pricing on all pending seats ─────────────────────
  const handleApproveOrder = async (salePrice: number, costPrice: number) => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();

      // Update each pending seat with price, keeping status 'Pending' until paid
      await Promise.all(
        seats
          .filter((s) => s.status === 'Pending')
          .map((s) =>
            db.updateBulkOrderSeat(s.id, {
              salePrice,
              usdtCost: costPrice,
              // status remains 'Pending'
            })
          )
      );

      // Update the parent order aggregate pricing
      await db.saveBulkOrder({
        ...order,
        salePrice,
        usdtCost: costPrice,
        totalRevenue: salePrice * order.totalLicenses,
        totalCost: costPrice * order.totalLicenses,
        totalProfit: (salePrice - costPrice) * order.totalLicenses,
        // Status remains unchanged until Paid
        updatedAt: now,
      });

      showToast('Prices approved. Waiting for payment.', 'success');
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
            usdtCost: costPrice,
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
          
          <div className="w-px h-8 bg-slate-200 mx-2" />
          
          <button
            onClick={handleGenerateInvoice}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-indigo-600 font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF Invoice</span>
          </button>
          
          <button
            onClick={handleWhatsAppLink}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp Link</span>
          </button>
        </div>
      </div>

      {/* 2-Column Grid Layout matching RequestDetails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Client & Order Data */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Client Information
              </h3>
              {!isEditingClient && (
                <button
                  onClick={startEditingClient}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Edit Information
                </button>
              )}
            </div>

            {isEditingClient ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={editedManagerName}
                    onChange={(e) => setEditedManagerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <input
                      type="email"
                      value={editedManagerEmail}
                      onChange={(e) => setEditedManagerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editedManagerWhatsapp}
                      onChange={(e) => setEditedManagerWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingClient(false)}
                    className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClient}
                    disabled={isSaving}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Manager Name</label>
                  <div className="text-lg font-bold text-slate-900">{order.managerName}</div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <div className="font-medium text-slate-700 break-all">{order.managerEmail}</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp</label>
                    <div className="font-medium text-slate-700">{order.managerWhatsapp || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <CreditCard className="w-4 h-4" /> Subscription Request
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Product</label>
                  <div className="font-bold text-indigo-600">{order.productName || 'Sales Navigator'}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Licenses</label>
                  <div className="font-medium text-slate-700">{order.totalLicenses} seats</div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Revenue</label>
                  <div className="text-lg font-black text-emerald-600">{order.totalRevenue > 0 ? fmt(order.totalRevenue) : 'TBD'}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">USDT Cost</label>
                  <div className="text-lg font-black text-slate-900">{order.totalCost > 0 ? `${order.totalCost} USDT` : 'TBD'}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Margin</label>
                  <div className="text-lg font-black text-indigo-600">{order.totalRevenue > 0 ? `${((order.totalProfit / order.totalRevenue) * 100).toFixed(1)}%` : 'TBD'}</div>
                </div>
              </div>
              {order.notes && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Customer Notes</label>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 italic border border-slate-100">
                    "{order.notes}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Admin Processing Workflow */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col h-full">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4" /> Processing Workflow
          </h3>
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sale Price (£) / seat</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                  {order.salePrice > 0 ? fmt(order.salePrice) : 'Pending'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Payment Status *</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handlePaymentStatusChange(e.target.value as BulkOrder['paymentStatus'])}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Activation Date *</label>
                <input
                  type="date"
                  value={order.startDate ? order.startDate.split('T')[0] : ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Renewal Date *</label>
                <input
                  type="date"
                  value={order.renewalDate ? order.renewalDate.split('T')[0] : ''}
                  onChange={(e) => handleDateChange('renewalDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
                Internal Admin Notes
                {saveNoteStatus === 'saving' && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
                {saveNoteStatus === 'saved' && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Saved</span>}
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Private notes about pricing, negotiations, or client preferences..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Seats Active</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700">
                  {activeCount} / {order.totalLicenses}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Seats Pending</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-600">
                  {pendingCount}
                </div>
              </div>
            </div>

            {/* Action Buttons inside Workflow */}
            <div className="pt-6 border-t border-slate-100 flex flex-col gap-3 mt-auto">
              {pendingCount > 0 && (
                <button
                  onClick={() => setApprovalModal({ isOpen: true, mode: 'approve-order' })}
                  className="w-full flex justify-center items-center gap-2 px-4 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve & Set Pricing ({pendingCount} pending)
                </button>
              )}
              {order.paymentStatus !== 'Paid' && (
                <button
                  onClick={handleMarkPaid}
                  className="w-full flex justify-center items-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <CreditCard className="w-5 h-5" />
                  Mark Order as Paid
                </button>
              )}
              {order.status === 'Completed' && order.paymentStatus === 'Paid' && (
                <>
                  {/* Order Delivered Block */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      Order Delivered
                    </div>
                    <div className="text-sm text-emerald-700 ml-7">
                      Successfully delivered {order.totalLicenses} seats. Profit recorded in financial records.
                    </div>
                  </div>

                  {/* Delivered Codes Block */}
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex flex-col mt-4 relative group">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Delivered Codes ({order.totalLicenses})
                      </h4>
                      <button
                        onClick={() => {
                          const links = seats.filter(s => s.activationCode).map(s => s.activationCode).join('\n');
                          navigator.clipboard.writeText(links);
                          showToast("Copied all activation links!", "success");
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Copy All Links"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[10px] text-slate-600 break-all max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {seats.filter(s => s.activationCode).map((s, i) => `${i + 1}. ${s.activationCode}`).join('\n\n') || "No activation links generated yet."}
                    </div>
                    <button
                      onClick={handleWhatsAppLink}
                      className="mt-4 w-full flex justify-center items-center gap-2 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Re-open WhatsApp
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action bar for Search + Add Seat */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search seats by rep email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => setAddSeatModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Seat
        </button>
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
                    seat.salePrice != null && seat.usdtCost != null
                      ? seat.salePrice - seat.usdtCost // Note: local profit calculation may be inaccurate until backend writes real GBP cost
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {editingSeatId === seat.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editedSeatName}
                                  onChange={(e) => setEditedSeatName(e.target.value)}
                                  placeholder="Rep Name"
                                  className="w-full px-2 py-1 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <input
                                  type="email"
                                  value={editedSeatEmail}
                                  onChange={(e) => setEditedSeatEmail(e.target.value)}
                                  placeholder="Rep Email"
                                  className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <div className="flex items-center gap-1 mt-1">
                                  <button
                                    onClick={() => handleSaveSeatEdit(seat.id)}
                                    className="p-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                  >
                                    <Save className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSeatId(null)}
                                    className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group/edit">
                                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                  {seat.repName || seat.repEmail}
                                  <button
                                    onClick={() => startEditingSeat(seat)}
                                    className="opacity-0 group-hover/edit:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                </div>
                                {seat.repName && (
                                  <div className="text-xs text-slate-400 font-mono">{seat.repEmail}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
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
                        {seat.usdtCost != null ? seat.usdtCost + ' USDT' : <span className="text-slate-300">—</span>}
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

      {/* Add Seat modal */}
      <AnimatePresence>
        <AddSeatModal
          isOpen={addSeatModal}
          isSaving={isAddingSeat}
          defaultSalePrice={order.salePrice}
          defaultUsdtCost={order.usdtCost}
          onClose={() => setAddSeatModal(false)}
          onConfirm={handleAddSeat}
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
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [selectedOrder, setSelectedOrder] = useState<BulkOrder | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

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

  let filtered = orders.filter(
    (o) =>
      o.managerName.toLowerCase().includes(search.toLowerCase()) ||
      o.managerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  if (statusFilter !== 'All') {
    filtered = filtered.filter((o) => o.status === statusFilter);
  }

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'Newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'Oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'High Revenue':
        return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      case 'Low Revenue':
        return (a.totalRevenue || 0) - (b.totalRevenue || 0);
      default:
        return 0;
    }
  });

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkAction = async (action: 'Delete' | 'Cancel') => {
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} ${selectedIds.length} orders?`)) return;
    setIsProcessingBulk(true);
    try {
      if (action === 'Delete') {
        await Promise.all(selectedIds.map(id => db.deleteBulkOrder(id)));
        showToast(`Deleted ${selectedIds.length} orders`, 'success');
      } else if (action === 'Cancel') {
        await Promise.all(selectedIds.map(async (id) => {
          const order = orders.find(o => o.id === id);
          if (order) {
            await db.saveBulkOrder({ ...order, status: 'Cancelled', updatedAt: new Date().toISOString() });
          }
        }));
        showToast(`Cancelled ${selectedIds.length} orders`, 'success');
      }
      setSelectedIds([]);
      loadOrders();
    } catch {
      showToast(`Failed to ${action.toLowerCase()} orders`, 'error');
    } finally {
      setIsProcessingBulk(false);
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

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by manager name, email, or order ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Active">Partially Active</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="High Revenue">Highest Revenue</option>
              <option value="Low Revenue">Lowest Revenue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl p-4 flex items-center gap-6 shadow-2xl border border-white/10 min-w-[300px]"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-black text-sm">
                {selectedIds.length}
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-300">Orders Selected</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkAction('Cancel')}
                disabled={isProcessingBulk}
                className="px-4 py-2 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 text-amber-400" />
                Cancel Orders
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

      {/* Orders table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-380px)] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-12 bg-slate-50">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                </th>
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
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, order.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== order.id));
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        />
                      </td>
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
