import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Plus,
  Key,
  FileText,
  ShieldCheck,
  FileCode,
  Ban,
  Settings,
  Lock as LockIcon,
  Upload,
  BarChart3,
  Bell,
  Sun,
  Moon,
  LogOut,
  User
} from "lucide-react";

import KeyTable from "../../components/keys/KeyTable";
import GenerateKeyModal from "../../components/keys/GenerateKeyModal";
import ImportKeyModal from "../../components/keys/ImportKeyModal";

import CSRManagement from "../../components/csr/CSRManagement";
import CSRSigningDashboard from "../../pages/dashboard/CSRSigningDashboard";
import CertificatesTab from "./CertificatesTab";
import CRLDashboard from "./CRLDashboard";
import SettingsPage from "./SettingsPage";
import ReportsDashboard from "./ReportsDashboard"; 
import UserNotifications from "./UserNotifications"; 

import { getMyKeys } from "../../services/keys";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios"; 
import { useTheme } from "../../context/ThemeContext";

export default function KeyManagement() {
  const { isDark, toggleTheme } = useTheme();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Keys Management");
  
  // Total notifications tracked on server vs how many the client has acknowledged
  const [totalNotificationsCount, setTotalNotificationsCount] = useState(0);
  const [lastReadCount, setLastReadCount] = useState(() => {
    return parseInt(localStorage.getItem("trustvault_last_read_noti_count") || "0", 10);
  });

  const user = useAuthStore((s) => s.user);
  const logoutUser = useAuthStore((s) => s.logout); 
  const role = user?.role;
  const caType = user?.caType; 

  const isRootOperator = role === "CA_OPERATOR" && caType === "ROOT";
  const isIntermediateOperator = role === "CA_OPERATOR" && caType === "INTERMEDIATE";
  const isEndUser = role === "USER";

  // Compute live unread metric on the fly
  const unreadNotificationCount = Math.max(0, totalNotificationsCount - lastReadCount);

  // Telemetry Fetch: Keys Ledger
  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await getMyKeys();
      setKeys(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cryptographic keys");
    } finally {
      setLoading(false);
    }
  };

  // Telemetry Fetch: Sync notification array length
  const fetchNotificationMetrics = async () => {
    try {
      const response = await api.get("/notifications/my");
      if (Array.isArray(response.data)) {
        const currentTotal = response.data.length;
        setTotalNotificationsCount(currentTotal);
        
        // If the user happens to already be sitting on the Notifications tab while a new one comes in,
        // automatically bump the read marker so it doesn't pop up an unread badge out of nowhere.
        if (activeTab === "Notifications") {
          setLastReadCount(currentTotal);
          localStorage.setItem("trustvault_last_read_noti_count", currentTotal.toString());
        }
      }
    } catch (err) {
      console.error("Failed to parse notifications telemetry context: ", err);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchNotificationMetrics();
    
    const backgroundTrack = setInterval(fetchNotificationMetrics, 45000);
    return () => clearInterval(backgroundTrack);
  }, [activeTab]); // Triggers check adjustment instantly during local view toggling

  useEffect(() => {
    if (activeTab === "Notifications" && totalNotificationsCount > lastReadCount) {
      setLastReadCount(totalNotificationsCount);
      localStorage.setItem("trustvault_last_read_noti_count", totalNotificationsCount.toString());
    }
  }, [activeTab, totalNotificationsCount]);

 
  const handleSystemLogout = async () => {
    try {
      await api.post("/auth/logout").catch(() => {}); 
    } catch {
      console.warn("Server context session already cleared or unreached.");
    } finally { // <--- Fixed the spelling mistake here
      localStorage.removeItem("trustvault_last_read_noti_count"); // Clear user metrics cache
      logoutUser(); 
      toast.success("Infrastructure session terminated successfully.");
    }
  };

  const navItems = [
    { icon: <Key size={18} />, label: "Keys Management" },
    ...(isIntermediateOperator || isEndUser ? [{ icon: <FileText size={18} />, label: "CSRs" }] : []),
    ...(isRootOperator || isIntermediateOperator ? [{ icon: <ShieldCheck size={18} />, label: "Signing" }] : []),
    { icon: <FileCode size={18} />, label: "Certificates" },
    ...(isRootOperator || isIntermediateOperator ? [{ icon: <Ban size={18} />, label: "CRLs" }] : []),
    { icon: <BarChart3 size={18} />, label: "Reports" }, 
    { icon: <Bell size={18} />, label: "Notifications" }, 
    { icon: <Settings size={18} />, label: "Settings" },
  ];

  const theme = {
    sidebarBg: "bg-app-sidebar-bg",
    contentBg: "bg-app-sidebar-active",
    paneBg: "bg-app-surface",
    textMain: "text-app-text",
    textMuted: "text-app-muted"
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans antialiased select-none ${theme.contentBg} ${theme.textMain}`}>
      
      {/* Sidebar Section */}
      <aside className={`w-60 flex flex-col justify-between pt-8 pb-4 relative z-20 ${theme.sidebarBg} text-app-sidebar-text`}>
        <div>
          <div className="px-7 mb-10 flex items-center gap-3">
            <div className="w-7 h-7 bg-app-primary rounded-md flex items-center justify-center font-black text-sm text-white shadow-sm">
              T
            </div>
            <span className="font-semibold text-white tracking-wide text-md">TrustVault PKI</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-[2px] pl-4">
            {navItems.map((item) => {
              const isActive = activeTab === item.label;
              return (
                <div
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`relative flex items-center gap-3 pl-5 py-3.5 rounded-l-2xl cursor-pointer transition-all duration-150 group ${
                    isActive
                      ? `${theme.contentBg} text-app-primary font-semibold translate-x-[1px]`
                      : "text-app-sidebar-text/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <div className={`absolute right-0 -top-4 w-4 h-4 pointer-events-none ${theme.contentBg}`}>
                      <div className={`w-full h-full rounded-br-2xl ${theme.sidebarBg}`} />
                    </div>
                  )}

                  {item.icon}
                  <span className="text-sm tracking-wide">{item.label}</span>

                  {/* Sidebar Notification Counter Badge */}
                  {item.label === "Notifications" && unreadNotificationCount > 0 && (
                    <span className="ml-auto mr-4 bg-app-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm animate-fade-in">
                      {unreadNotificationCount}
                    </span>
                  )}

                  {isActive && (
                    <div className={`absolute right-0 -bottom-4 w-4 h-4 pointer-events-none ${theme.contentBg}`}>
                      <div className={`w-full h-full rounded-tr-2xl ${theme.sidebarBg}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="px-4">
          <button 
            onClick={handleSystemLogout}
            className="flex items-center gap-3 px-5 py-3 w-full rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all active:scale-[0.98]"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Primary Content Stage */}
      <main className="flex-1 p-7 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Uniform Top Controls Cluster Row */}
        <div className="flex items-center justify-between w-full mb-6 z-10">
          <div className="flex items-center gap-2">
            <LockIcon size={14} className="text-app-primary/70" />
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>HSM Protected Domain</span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-app-border bg-app-surface-muted/50 shadow-sm transition-colors duration-300">
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-full transition-colors hover:bg-app-surface-strong text-app-primary"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>

            <span className="w-[1px] h-4 bg-app-border" />

            {/* Notification Control Button */}
            <button 
              onClick={() => setActiveTab("Notifications")}
              className={`p-1.5 rounded-full relative transition-colors ${
                activeTab === "Notifications" 
                  ? "bg-app-primary/10 text-app-primary" 
                  : "hover:bg-app-surface-strong text-app-muted"
              }`}
            >
              <Bell size={15} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-app-primary rounded-full flex items-center justify-center font-bold text-[8px] text-white px-0.5 shadow-sm border border-app-surface">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            <span className="w-[1px] h-4 bg-app-border" />

            {/* Profile Action Bubble */}
            <div 
              onClick={() => setActiveTab("Settings")}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden text-white cursor-pointer transition-transform active:scale-95 ${
                activeTab === "Settings" ? "ring-2 ring-app-primary ring-offset-2 ring-offset-app-surface" : ""
              } bg-app-primary hover:opacity-90`} 
              title={user?.name || "Profile Configurations"}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={12} />}
            </div>
          </div>
        </div>

        {/* Content Sheet Window */}
        <div className={`flex-1 rounded-2xl p-7 flex flex-col shadow-sm border border-app-border overflow-hidden ${theme.paneBg} transition-colors duration-300`}>
          
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-dashed border-slate-500/10">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-app-heading transition-colors">
                {activeTab}
              </h2>
              <p className={`text-xs mt-0.5 ${theme.textMuted} transition-colors`}> Manage lifecycle state operations and records.</p>
            </div>

            {activeTab === "Keys Management" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 bg-app-surface-muted hover:bg-app-surface-strong text-app-text border border-app-border"
                >
                  <Upload size={14} />
                  Import Key
                </button>

                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center gap-1.5 bg-app-primary hover:bg-app-primary-hover px-4 py-2 rounded-lg text-xs font-medium text-white transition-all active:scale-95 shadow-sm shadow-app-primary/10"
                >
                  <Plus size={15} />
                  New Key
                </button>
              </div>
            )}
          </div>

          {/* Router Core Windows */}
          <div className="flex-1 overflow-y-auto min-h-0 container-view">
            {activeTab === "Keys Management" ? (
              <KeyTable data={keys} loading={loading} onRefresh={fetchKeys} />
            ) : activeTab === "CSRs" ? (
              <CSRManagement />
            ) : activeTab === "Signing" ? (
              <CSRSigningDashboard />
            ) : activeTab === "Certificates" ? (
              <CertificatesTab />
            ) : activeTab === "CRLs" ? (
              <CRLDashboard />
            ) : activeTab === "Reports" ? (
              <ReportsDashboard />
            ) : activeTab === "Notifications" ? (
              <UserNotifications />
            ) : activeTab === "Settings" ? (
              <SettingsPage />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                {activeTab} module workspace coming soon...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Global Application Modals Container */}
      <AnimatePresence>
        {showGenerateModal && (
          <GenerateKeyModal onClose={() => setShowGenerateModal(false)} onRefresh={fetchKeys} />
        )}
        {showImportModal && (
          <ImportKeyModal onClose={() => setShowImportModal(false)} onRefresh={fetchKeys} />
        )}
      </AnimatePresence>
    </div>
  );
}
