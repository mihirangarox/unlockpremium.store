import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  BarChart3, Users, Settings, Package, 
  MessageSquare, LayoutDashboard, Database, 
  ChevronRight, LogOut, Moon, Sun, Monitor,
  Box, CreditCard, HelpCircle, FileText, Zap,
  BellRing, History, PieChart, ChevronLeft, Inbox, Wallet,
  Shield, User
} from "lucide-react";
import { cn } from "../../utils/cn";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db as firestore } from "../../services/firebase";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  mobileOpen?: boolean;
  onLogout: () => void;
}

interface NavGroup {
  label: string;
  items: { name: string; href: string; icon: any; badge?: number }[];
}

export function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, onLogout }: SidebarProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const q = query(collection(firestore, "requests"), where("status", "==", "Pending"));
        const snap = await getCountFromServer(q);
        setPendingCount(snap.data().count);
      } catch {
        // silently fail — not critical
      }
    };
    fetchPending();
  }, []);

  const navGroups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/unlock-world-26", icon: LayoutDashboard },
      ],
    },
    {
      label: "Content",
      items: [
        { name: "Blog Posts", href: "/unlock-world-26/posts", icon: FileText },
        { name: "Testimonials", href: "/unlock-world-26/testimonials", icon: MessageSquare },
      ],
    },
    {
      label: "Sales Pipeline",
      items: [
        { name: "Incoming Requests", href: "/unlock-world-26/requests", icon: Inbox, badge: pendingCount },
      ],
    },
    {
      label: "Store Management",
      items: [
        { name: "Products Catalog", href: "/unlock-world-26/products", icon: Box },
        { name: "Manage Stock", href: "/unlock-world-26/manage-stock", icon: Package },
        { name: "Vendors", href: "/unlock-world-26/vendors", icon: Users },
      ],
    },
    {
      label: "Finance",
      items: [
        { name: "USDT Wallet", href: "/unlock-world-26/finance/usdt", icon: Wallet },
      ],
    },
    {
      label: "CRM",
      items: [
        { name: "Customers", href: "/unlock-world-26/customers", icon: Users },
        { name: "Subscriptions", href: "/unlock-world-26/subscriptions", icon: CreditCard },
        { name: "Renewal History", href: "/unlock-world-26/history", icon: History },
        { name: "Reminders", href: "/unlock-world-26/reminders", icon: BellRing },
      ],
    },
    {
      label: "System",
      items: [
        { name: "Reports", href: "/unlock-world-26/reports", icon: PieChart },
        { name: "Settings", href: "/unlock-world-26/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50 md:sticky md:block",
        isCollapsed ? "w-20" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className={cn("p-5 flex items-center justify-between border-b border-slate-800/60", isCollapsed && "px-4 justify-center")}>
        {!isCollapsed ? (
          <div className="animate-in fade-in duration-500 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20 shrink-0">
              C
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">CRM<span className="text-indigo-400">Sync</span></h1>
              <span className="text-[9px] font-black tracking-widest text-indigo-400/70 uppercase">Admin Panel</span>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg mx-auto shadow-lg shadow-indigo-500/20">
            C
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 mt-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 mb-1">
                {group.label}
              </p>
            )}
            {isCollapsed && <div className="border-t border-slate-800/50 mt-2 mb-2" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/unlock-world-26"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all group relative",
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                      )
                    }
                  >
                    <Icon className={cn("h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110", !isCollapsed && "mr-3")} />
                    {!isCollapsed && (
                      <span className="flex-1 animate-in slide-in-from-left-2 duration-300">{item.name}</span>
                    )}
                    {/* Badge */}
                    {!isCollapsed && item.badge != null && item.badge > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    {isCollapsed && item.badge != null && item.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900" />
                    )}
                    {/* Collapsed tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
                        {item.name}
                        {item.badge != null && item.badge > 0 && (
                          <span className="ml-1.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/50 relative">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all mb-4"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Profile Popover Menu */}
        {showProfileMenu && (
          <div className={cn(
            "absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-white/5 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-2 duration-200 z-[100] backdrop-blur-xl",
            isCollapsed && "left-20 right-auto w-56 bottom-4 mb-0"
          )}>
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin Control</p>
            </div>
            <button 
              onClick={() => { setShowProfileMenu(false); navigate('/unlock-world-26/settings'); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <User className="w-4 h-4" /> Edit Profile
            </button>
            <button 
              onClick={() => { setShowProfileMenu(false); navigate('/unlock-world-26/settings'); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <Shield className="w-4 h-4" /> Security
            </button>
            <div className="h-px bg-white/5 my-1 mx-2" />
            <button 
              onClick={() => {
                setShowProfileMenu(false);
                onLogout();
              }} 
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}

        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={cn(
            "flex items-center w-full p-2 rounded-2xl hover:bg-slate-800 transition-all text-left",
            isCollapsed && "justify-center",
            showProfileMenu && "bg-slate-800"
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-inner shadow-indigo-400 shrink-0">
            AD
          </div>
          {!isCollapsed && (
            <div className="ml-3 animate-in fade-in duration-300 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white truncate">Admin User</p>
                <ChevronRight className={cn("w-3 h-3 text-slate-600 transition-transform", showProfileMenu && "-rotate-90")} />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Strategic Tier</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
