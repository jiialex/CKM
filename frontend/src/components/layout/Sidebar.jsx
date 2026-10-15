import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, ShieldCheck, ScrollText,
  Key, ShieldAlert, Settings,
  ChevronLeft, ChevronRight, Bell, Sun, Moon, LogOut, User
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/dashboard' },
  { icon: <Users size={18} />, label: 'Users', path: '/dashboard/users' },
  { icon: <ShieldCheck size={18} />, label: 'Approvals', path: '/dashboard/approvals' },
  { icon: <Key size={18} />, label: 'Certificates', path: '/dashboard/CertificateManagementDashboard' },
  { icon: <ScrollText size={18} />, label: 'Audit Logs', path: '/dashboard/logs' },

  { icon: <ShieldAlert size={18} />, label: 'Threats', path: '/dashboard/threats' },
  { icon: <Bell size={18} />, label: 'Notifications', path: '/dashboard/AdminNotifications' },
  { icon: <Settings size={18} />, label: 'Settings', path: '/dashboard/settings' },
];

export const DashboardWrapper = ({ title, subtitle, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isDark, toggleTheme, preferences } = useTheme();
  const user = useAuthStore((state) => state.user);

  const initial = preferences?.displayName?.trim()?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'O';

  return (
    <div className="app-shell flex min-h-screen transition-colors duration-300">
      {/* Sidebar Component Boundary Frame */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div className="min-w-0 flex-1 flex flex-col">
        {/* NEW TOP RIGHT CONTROLS HEADER MATRIX */}
        <header className="sticky top-0 z-40 bg-app-surface/80 backdrop-blur border-b border-app-border select-none">
          <div className="flex flex-col gap-4 px-4 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Left Context: Module Descriptions */}
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-app-heading truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-xs text-app-muted max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Right Context: Relocated Utility Action Controls */}
            <div className="flex items-center justify-end gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border bg-app-surface-muted/50 shadow-xs">
                
                {/* Theme Toggle Utility */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-app-muted hover:bg-app-surface-strong transition-colors cursor-pointer"
                  title="Toggle Display Theme"
                >
                  {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-app-primary" />}
                </button>

                <span className="w-[1px] h-4 bg-app-border" />

                {/* Live Notification Desk Trigger */}
                <button
                  onClick={() => navigate('/dashboard/notifications')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    pathname === '/dashboard/notifications'
                      ? 'bg-app-primary/10 text-app-primary'
                      : 'text-app-muted hover:bg-app-surface-strong'
                  }`}
                  title="Notifications Alert Deck"
                >
                  <Bell size={15} />
                </button>

                <span className="w-[1px] h-4 bg-app-border" />

                {/* Account Operator Workspace Bubble */}
                <div
                  onClick={() => navigate('/dashboard/settings')}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden text-white cursor-pointer transition-transform active:scale-95 ${
                    pathname === '/dashboard/settings'
                      ? 'ring-2 ring-app-primary ring-offset-2 ring-offset-app-surface'
                      : 'bg-app-primary hover:opacity-90'
                  }`}
                  title="User Profile Settings"
                >
                  {user?.username || preferences?.displayName ? initial : <User size={12} />}
                </div>

              </div>
            </div>

          </div>
        </header>

        <main className="px-4 pb-8 md:px-8 flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function Sidebar({ collapsed, setCollapsed, unreadNotificationCount = 0 }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  const { preferences } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const displayName = useMemo(() => {
    return preferences?.displayName?.trim() || user?.username || 'Operator';
  }, [preferences?.displayName, user?.username]);

  const initial = displayName.charAt(0).toUpperCase() || 'O';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const theme = {
    sidebarBg: "bg-app-sidebar-bg",
    contentBg: "bg-app-sidebar-active",
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 250 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`h-screen sticky top-0 flex flex-col justify-between pt-6 pb-4 z-50 select-none font-sans antialiased shrink-0 ${theme.sidebarBg} text-app-sidebar-text transition-colors duration-300`}
    >
      <div>
        {/* BRAND LOGO CONTEXT LAYER */}
        <div className="flex items-center justify-between px-5 mb-8 h-10">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-app-primary rounded-md flex items-center justify-center font-black text-xs text-white shadow-sm">
                P
              </div>
              <span className="font-bold text-white tracking-tight text-sm">
                PKI<span className="text-app-accent font-semibold text-xs tracking-wider uppercase ml-0.5"> CKM</span>
              </span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? "Expand Side Panel" : "Collapse Side Panel"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* COMPONENT NAVIGATION WORKSPACE TABS */}
        <nav className="space-y-[3px] pl-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center rounded-l-2xl cursor-pointer transition-all duration-150 group ${
                  collapsed ? 'justify-center py-3.5 pr-3 pl-3' : 'gap-3 pl-5 py-3'
                } ${
                  isActive
                    ? `${theme.contentBg} text-app-primary font-semibold translate-x-[1px]`
                    : 'text-app-sidebar-text/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className={`absolute right-0 -top-4 w-4 h-4 pointer-events-none ${theme.contentBg}`}>
                    <div className={`w-full h-full rounded-br-2xl ${theme.sidebarBg}`} />
                  </div>
                )}

                <div className={isActive ? 'text-app-primary' : 'text-app-sidebar-text/70 group-hover:text-slate-200'}>
                  {item.icon}
                </div>

                {!collapsed && (
                  <span className="text-xs tracking-wide">{item.label}</span>
                )}

                {item.label === 'Notifications' && unreadNotificationCount > 0 && !collapsed && (
                  <span className="ml-auto mr-4 bg-app-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {unreadNotificationCount}
                  </span>
                )}

                {isActive && (
                  <div className={`absolute right-0 -bottom-4 w-4 h-4 pointer-events-none ${theme.contentBg}`}>
                    <div className={`w-full h-full rounded-tr-2xl ${theme.sidebarBg}`} />
                  </div>
                )}

                {collapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-gray-950 text-white text-[10px] font-medium tracking-wide rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                    {item.label} {item.label === 'Notifications' && unreadNotificationCount > 0 ? `(${unreadNotificationCount})` : ''}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* COMPONENT BOUNDARY FOOTER PROFILE STRIP */}
      <div className="px-3 flex flex-col gap-2">
        {!collapsed && (
          <div className="p-3 mx-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] uppercase tracking-wider shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-white truncate">{displayName}</p>
              <p className="text-[9px] font-mono text-slate-400 truncate">{user?.role || 'Secure Operator'}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-xl text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all active:scale-[0.98] cursor-pointer ${
            collapsed ? 'justify-center py-3.5 px-0 w-full' : 'px-5 py-3 w-full'
          }`}
          title="Terminate Infrastructure Session"
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout Session</span>}
        </button>
      </div>
    </motion.aside>
  );
}