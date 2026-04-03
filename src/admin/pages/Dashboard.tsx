import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, Activity, AlertCircle, FileText, PoundSterling, Percent, ChevronRight, Send, Bell } from "lucide-react";
import * as db from "../services/db";
import type { Customer, Subscription, RenewalHistory, USDTTransaction, Reminder } from "../types/index";
import { motion } from "framer-motion";
import { getDaysLeft, formatDaysLeft, getDaysLeftColorClass } from "../utils/dateUtils";
import { useToast } from "../components/ui/Toast";
import { useLocalization } from "../../context/LocalizationContext";

function StatCard({ title, value, icon, bgColor, color, subValue, onClick }: { title: string, value: string, icon: React.ReactNode, bgColor: string, color: string, subValue?: React.ReactNode, onClick?: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group transition-all ${onClick ? 'cursor-pointer hover:border-indigo-200' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        {subValue && <div className="mt-1">{subValue}</div>}
      </div>
      <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
        <div className={color}>{icon}</div>
      </div>
    </motion.div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { formatCurrency, formatDate, formatTime } = useLocalization();
  const [stats, setStats] = useState({
    activeCustomers: 0,
    dueToday: 0,
    dueThisWeek: 0,
    expired: 0,
    totalRevenue: 0,
    netProfit: 0,
    monthlyMomentum: 0,
    cashOnHand: 0,
    renewalRate: 0,
  });

  const [upcoming, setUpcoming] = useState<{sub: Subscription, customer: Customer | undefined}[]>([]);
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Run background automation scan (silent) — generates renewal reminders
        const { automation } = await import("../services/automation");
        await automation.checkAndGenerateReminders();

        // NOTE: Discord reports (Daily Pulse, Morning Action Centre, Weekly Compass)
        // are now handled exclusively by Firebase Cloud Functions on a fixed schedule.
        // Do NOT trigger them here to avoid duplicate Discord messages.
        const now = new Date();

        const [customers, subs, history, usdtTx, allReminders] = await Promise.all([
          db.getCustomers(),
          db.getSubscriptions(),
          db.getRenewalHistory(),
          db.getUSDTTransactions(),
          db.getReminders()
        ]);

        const getSubStatus = (renewalDate: string): string => {
          const daysLeft = getDaysLeft(renewalDate);
          if (daysLeft < 0) return 'Expired';
          if (daysLeft === 0) return 'Due Today';
          if (daysLeft <= 7) return 'Due Soon';
          return 'Active';
        };

        // 1. CASH-BASIS METRICS (Renewal History resolved with real costs)
        const resolvedHistory = await Promise.all(history.map(async h => {
          const financials = await db.findStockCostForTransaction(h);
          return { ...h, resolvedCost: financials.cost, resolvedProfit: financials.profit };
        }));

        const totalRevenue = resolvedHistory.reduce((sum, h) => sum + (h.amount || 0), 0);
        const netProfit = resolvedHistory.reduce((sum, h) => sum + h.resolvedProfit, 0);

        // 2. CASH ON HAND
        const totalSpentOnUSDT = usdtTx
          .filter(tx => tx.type === 'Inbound' && tx.status === 'Completed')
          .reduce((sum, tx) => sum + (tx.gbpPaid || tx.gbpTotalSpent || 0), 0);
        
        const cashOnHand = totalRevenue - totalSpentOnUSDT;

        // 3. PROJECTED MRR
        const monthlyMomentum = subs
          .filter(s => getSubStatus(s.renewalDate) !== 'Expired')
          .reduce((sum, s) => {
            const months = (s as any).durationMonths || 1;
            return sum + (s.price / months);
          }, 0);

        const activeCustomers = customers.filter(c => {
          const customerSubs = subs.filter(s => s.customerId === c.id);
          const hasActiveSub = customerSubs.some(s => getSubStatus(s.renewalDate) !== 'Expired');
          return c.status === 'Active' || hasActiveSub;
        }).length;

        const dueToday = subs.filter(s => getSubStatus(s.renewalDate) === 'Due Today').length;
        const expiredCount = subs.filter(s => getSubStatus(s.renewalDate) === 'Expired').length;
        const activeCount = subs.filter(s => getSubStatus(s.renewalDate) !== 'Expired').length;
        
        const renewalRateValue = activeCount + expiredCount > 0 
          ? Math.round((activeCount / (activeCount + expiredCount)) * 100) 
          : 0;

        const dueThisWeek = subs.filter(s => getSubStatus(s.renewalDate) === 'Due Soon').length;

        setStats({
          activeCustomers,
          dueToday,
          dueThisWeek,
          expired: expiredCount,
          totalRevenue,
          netProfit,
          monthlyMomentum,
          cashOnHand,
          renewalRate: renewalRateValue,
        });

        setPendingRemindersCount(allReminders.filter(r => r.status === 'Pending').length);

        const customerMap = new Map(customers.map(c => [c.id, c]));
        const upcomingSubs = subs
          .filter(s => {
            const status = getSubStatus(s.renewalDate);
            return status === 'Due Soon' || status === 'Due Today';
          })
          .map(sub => ({ sub, customer: customerMap.get(sub.customerId) }))
          .sort((a, b) => new Date(a.sub.renewalDate).getTime() - new Date(b.sub.renewalDate).getTime())
          .slice(0, 5);

        setUpcoming(upcomingSubs);
      } catch (error) {
        console.error("Dashboard data load failed:", error);
        showToast("Failed to refresh dashboard items", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSendReminder = (customer: Customer, sub: Subscription) => {
    const phone = customer.whatsappNumber.replace(/[^0-9]/g, '');
    const daysLeft = getDaysLeft(sub.renewalDate);
    const message = encodeURIComponent(`Hi ${customer.fullName}, your ${sub.subscriptionType} plan is renewing ${daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}. Price: ${formatCurrency(sub.price)}. Would you like to keep it active?`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    showToast(`Reminder sent to ${customer.fullName}`, "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Overview of your business and pending renewals.</p>
        </div>
        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
          Last updated: {formatTime(new Date())}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(Math.round(stats.totalRevenue))} 
          subValue={<span className="text-xs text-slate-400 font-medium">Total Cash Received</span>}
          icon={<PoundSterling className="h-6 w-6" />} 
          bgColor="bg-indigo-50" 
          color="text-indigo-600" 
        />

        <StatCard 
          title="Net Profit" 
          value={formatCurrency(Math.round(stats.netProfit))} 
          subValue={<span className="text-xs text-slate-400 font-medium">Immediate Margin</span>}
          icon={<Activity className="h-6 w-6" />} 
          bgColor="bg-emerald-50" 
          color="text-emerald-600" 
        />

        <StatCard 
          title="Projected Momentum" 
          value={formatCurrency(Math.round(stats.monthlyMomentum))} 
          subValue={<span className="text-xs text-slate-400 font-medium">MRR / Growth</span>}
          icon={<Activity className="h-6 w-6" />} 
          bgColor="bg-blue-50" 
          color="text-blue-600" 
        />

        <StatCard 
          title="Cash Balance" 
          value={formatCurrency(Math.round(stats.cashOnHand))} 
          subValue={<span className="text-xs text-slate-400 font-medium">Available for restock</span>}
          icon={<PoundSterling className="h-6 w-6" />} 
          bgColor="bg-slate-50" 
          color="text-slate-600" 
        />
        
        <StatCard 
          title="Active Customers" 
          value={String(stats.activeCustomers)} 
          subValue={<span className="text-xs text-slate-400 font-medium">Growing Community</span>}
          icon={<Users className="h-6 w-6" />} 
          bgColor="bg-slate-50" 
          color="text-slate-600" 
        />

        <StatCard 
          title="Action Centre" 
          value={String(stats.dueToday + stats.dueThisWeek)} 
          subValue={
            pendingRemindersCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Bell size={10} /> {pendingRemindersCount} Pending Reminders
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">{stats.dueToday} today, {stats.dueThisWeek} soon</span>
            )
          }
          onClick={() => navigate('/reminders')}
          icon={<AlertCircle className="h-6 w-6" />} 
          bgColor={pendingRemindersCount > 0 ? "bg-indigo-50" : "bg-amber-50"}
          color={pendingRemindersCount > 0 ? "text-indigo-600" : "text-amber-600"} 
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Upcoming Renewals</h3>
            <button 
              onClick={() => navigate('/subscriptions')}
              className="text-sm text-indigo-600 font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="responsive-table-container">
            <table className="w-full text-sm text-left align-middle border-collapse">
              <thead className="bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Subscription</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Renewal</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Days Left</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcoming.map((item) => {
                  const daysLeft = getDaysLeft(item.sub.renewalDate);
                  return (
                    <tr key={item.sub.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.customer?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{item.customer?.country}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight bg-indigo-50 text-indigo-700">
                          {item.sub.subscriptionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(item.sub.renewalDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getDaysLeftColorClass(daysLeft)}`}>
                          {formatDaysLeft(daysLeft)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.customer && (
                            <button 
                              onClick={() => handleSendReminder(item.customer!, item.sub)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm"
                              title="Send WhatsApp Reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send Reminder
                            </button>
                          )}
                          <button 
                            onClick={() => navigate(`/customers/${item.sub.customerId}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {upcoming.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium italic">No upcoming renewals found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Health Overview</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time</span>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Renewal Health</span>
                <span className="text-lg font-black text-emerald-600">{stats.renewalRate}%</span>
              </div>
              <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.renewalRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-emerald-500 h-full rounded-full" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Retention</div>
                <div className="text-xl font-black text-indigo-600">{stats.renewalRate > 0 ? 'Good' : 'N/A'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100/50">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Pending Action</div>
                <div className="text-xl font-black text-amber-600">{pendingRemindersCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50">
            <p className="text-xs text-slate-400 leading-relaxed italic text-center">
              * Background Engine synchronized @ {formatTime(new Date())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
