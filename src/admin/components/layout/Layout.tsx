import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { IdleTimer } from "../auth/IdleTimer";

interface LayoutProps {
  onLogout: () => void;
}

export function Layout({ onLogout }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <IdleTimer onIdle={onLogout}>
      <div className="flex bg-slate-50 min-h-screen overflow-hidden">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          mobileOpen={mobileOpen} 
          onLogout={onLogout}
        />
        
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-slate-50 transition-all duration-300",
          isCollapsed ? "md:pl-0" : "md:pl-0"
        )}>
          <Topbar onMenuClick={() => setMobileOpen(!mobileOpen)} />
          
          <main className="flex-1 overflow-x-hidden p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </IdleTimer>
  );
}
