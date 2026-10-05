import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Sun, Moon, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

export default function AuthHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Custom global theme contexts linked directly into the structural state
  const { isDark, toggleTheme, preferences } = useTheme();
  const user = useAuthStore((state) => state.user);

  // State to track the unread notification metric badge
  const [unreadCount, setUnreadCount] = useState(0);

  // Dynamic initialization metrics for profile nodes
  const displayName = useMemo(() => {
    return preferences?.displayName?.trim() || user?.username || 'Operator';
  }, [preferences?.displayName, user?.username]);

  const initial = displayName.charAt(0).toUpperCase() || 'O';

  // Fetch unread count from the global administrative notifications endpoint
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications');
        const payload = Array.isArray(response.data) ? response.data : [];
        
        // Adjust condition based on your backend entity property (e.g., !item.isRead or !item.read)
        const unreadItems = payload.filter(item => item.read === false || item.isRead === false);
        setUnreadCount(unreadItems.length);
      } catch (err) {
        console.error("Failed to sync live alert telemetry badge counters:", err);
      }
    };

    fetchUnreadCount();
    // Optional: Setup a polling interval if you want this to update live without page refreshes
    const interval = setInterval(fetchUnreadCount, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [pathname]); // Refresh count contextually when the operator changes view matrices

  // Explicit operational toggle handler ensuring synchronization with document classList
  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <header className="sticky top-0 z-40 bg-app-surface/80 backdrop-blur border-b border-app-border mb-6 select-none transition-colors duration-300">
      <div className="flex flex-col gap-4 px-4 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left Side: Dynamic Page Titles */}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-app-heading truncate transition-colors">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-app-muted max-w-2xl transition-colors">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Side: Reallocated Utility Action Controls */}
        <div className="flex items-center justify-end gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border bg-app-surface-muted/50 shadow-sm transition-colors duration-300">
            
            {/* Functional Theme Toggle Utility */}
            <button
              onClick={handleThemeToggle}
              className="p-1.5 rounded-lg text-app-muted hover:bg-app-surface-strong transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Operational Mode" : "Switch to Dark Cryptographic Mode"}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-app-primary" />}
            </button>

            <span className="w-[1px] h-4 bg-app-border transition-colors" />

            {/* Live Notification Desk Trigger Redirecting to Admin Ledger View */}
            <button
              onClick={() => navigate('/dashboard/AdminNotifications')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                pathname === '/dashboard/AdminNotifications'
                  ? 'bg-app-primary/10 text-app-primary'
                  : 'text-app-muted hover:bg-app-surface-strong'
              }`}
              title="Global Administrative Notifications Desk"
            >
              <Bell size={15} />
              
              {/* Telemetry Count Indicator Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white animate-pulse ring-2 ring-app-surface transition-all">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <span className="w-[1px] h-4 bg-app-border transition-colors" />

            {/* Built-in Account Operator Workspace Bubble */}
            <div
              onClick={() => navigate('/dashboard/settings')}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden text-white cursor-pointer transition-all active:scale-95 ${
                pathname === '/dashboard/settings'
                  ? 'ring-2 ring-app-primary ring-offset-2 ring-offset-app-surface'
                  : 'bg-app-primary hover:opacity-90'
              }`}
              title="Profile Infrastructure Settings"
            >
              {user?.username || preferences?.displayName ? initial : <User size={12} />}
            </div>

          </div>
        </div>

      </div>
    </header>
  );
}