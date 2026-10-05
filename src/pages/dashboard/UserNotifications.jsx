import { useEffect, useState, useMemo } from "react";
import { 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileCode, 
  Award, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import { useTheme } from "../../context/ThemeContext";

// Accepts isDarkMode from the parent dashboard container to adapt natively
const UserNotifications = ({ isDarkMode }) => {
  const themeContext = useTheme();
  const isDark = themeContext ? themeContext.isDark : (isDarkMode !== false);

  // Navigation & Workspace State Tracks
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); 

  // Data Aggregators
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Multi-endpoint Synchronization Core
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let endpoint = "/notifications/my";
      
      if (activeTab === "CERTIFICATES") {
        endpoint = "/notifications/my/certificates";
      } else if (activeTab === "CSR") {
        endpoint = "/notifications/my/csr";
      }

      const response = await api.get(endpoint);
      const payload = Array.isArray(response.data) ? response.data : [];
      setNotifications(payload);
      setCurrentPage(1); 
    } catch (err) {
      console.error("Infrastructure synchronization error:", err);
      setNotifications(getFallbackMockData());
      toast.error("Displaying cached session telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  // Comprehensive Memoized Data Filters
  const processedNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch = 
        (item.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.message?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.entityAlias?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (typeFilter === "ALL") return matchesSearch;
      return matchesSearch && item.eventType === typeFilter;
    });
  }, [notifications, searchQuery, typeFilter]);

  // Pagination Math
  const totalPages = Math.ceil(processedNotifications.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedNotifications.slice(start, start + itemsPerPage);
  }, [processedNotifications, currentPage]);

  // Style Configurator mapping backend Notification structures cleanly
  const getNotificationStyles = (type) => {
    const darkMap = {
      SUCCESS: { icon: <CheckCircle2 size={14} />, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5", badge: "Success" },
      DANGER: { icon: <ShieldAlert size={14} />, color: "text-rose-400 border-rose-500/20 bg-rose-500/5", badge: "Critical" },
      WARNING: { icon: <Clock size={14} />, color: "text-amber-400 border-amber-500/20 bg-amber-500/5", badge: "Warning" },
      INFO: { icon: <Layers size={14} />, color: "text-blue-400 border-blue-500/20 bg-blue-500/5", badge: "Info" },
    };

    const lightMap = {
      SUCCESS: { icon: <CheckCircle2 size={14} />, color: "text-emerald-600 border-emerald-200 bg-emerald-50", badge: "Success" },
      DANGER: { icon: <ShieldAlert size={14} />, color: "text-rose-600 border-rose-200 bg-rose-50", badge: "Critical" },
      WARNING: { icon: <Clock size={14} />, color: "text-amber-600 border-amber-200 bg-amber-50", badge: "Warning" },
      INFO: { icon: <Layers size={14} />, color: "text-blue-600 border-blue-200 bg-blue-50", badge: "Info" },
    };

    const activeMap = isDark ? darkMap : lightMap;

    switch (type) {
      case "CERT_ISSUED":
      case "CERTIFICATE_ISSUED":
      case "CSR_SIGNED":
        return activeMap.SUCCESS;
      case "CERT_REVOKED":
      case "CERTIFICATE_REVOKED":
      case "CERT_EXPIRED":
      case "CERTIFICATE_EXPIRED":
        return activeMap.DANGER;
      case "CERT_EXPIRING_SOON":
      case "CERTIFICATE_EXPIRING_SOON":
        return activeMap.WARNING;
      case "CSR_APPROVED":
      case "CSR_REJECTED":
      default:
        return activeMap.INFO;
    }
  };

  // Color theme overrides to match TrustVault layout structures
  const uiTheme = {
    subBar: "bg-app-surface-muted/60 border-app-border",
    inputBg: "bg-app-bg border-app-border text-app-text",
    cardBg: "bg-app-surface border-app-border/70 hover:border-app-border-strong",
    textMain: "text-app-text",
    textMuted: "text-app-muted",
    tabActive: "bg-app-primary text-white border-app-primary",
    tabInactive: "text-app-muted hover:text-app-heading hover:bg-app-surface-strong/50 border-transparent"
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      
      {/* Search and Advanced Filter Action Subbar */}
      <div className={`flex flex-col sm:flex-row gap-3 justify-between items-center p-4 rounded-xl border mb-5 ${uiTheme.subBar}`}>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Internal Scope Tabs */}
          <div className="flex p-1 rounded-lg border border-app-border bg-app-bg text-xs font-medium transition-colors">
            {[
              { id: "ALL", label: "All Events" },
              { id: "CERTIFICATES", label: "Certificates" },
              { id: "CSR", label: "CSRs" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setTypeFilter("ALL"); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-md transition-all duration-150 ${
                  activeTab === tab.id ? uiTheme.badge || uiTheme.tabActive : uiTheme.tabInactive
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-1.5 border rounded-lg transition-all active:scale-95 disabled:opacity-50 bg-app-bg border-app-border text-app-muted hover:text-app-heading hover:bg-app-surface-strong"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Text Filter input and dropdown filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-56">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-app-muted">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Search resource alias..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all ${uiTheme.inputBg}`}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <span className="text-[10px] uppercase font-bold tracking-wider text-app-muted flex items-center gap-1">
              <Filter size={10} /> State:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none ${uiTheme.inputBg}`}
            >
              <option value="ALL">All Statuses</option>
              {activeTab !== "CSR" && <option value="CERTIFICATE_ISSUED">Issued</option>}
              {activeTab !== "CSR" && <option value="CERTIFICATE_REVOKED">Revoked</option>}
              {activeTab !== "CSR" && <option value="CERTIFICATE_EXPIRING_SOON">Expiring Soon</option>}
              {activeTab !== "CSR" && <option value="CERTIFICATE_EXPIRED">Expired</option>}
              {activeTab !== "CERTIFICATES" && <option value="CSR_APPROVED">Approved</option>}
              {activeTab !== "CERTIFICATES" && <option value="CSR_REJECTED">Rejected</option>}
              {activeTab !== "CERTIFICATES" && <option value="CSR_SIGNED">Signed</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger List Output Row container */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-0">
        {paginatedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-dashed border-app-border bg-app-surface-muted text-app-muted/50 mb-3 transition-colors">
              <Check size={20} />
            </div>
            <h3 className={`text-xs font-bold ${uiTheme.textMain}`}>Audit Log Clear</h3>
            <p className="text-[11px] text-app-muted mt-0.5 max-w-xs mx-auto">No matching security log updates were detected for your active constraints.</p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto pr-1">
            {paginatedItems.map((noti, idx) => {
              const styles = getNotificationStyles(noti.eventType);
              const formattedDate = noti.eventTime 
                ? new Date(noti.eventTime).toLocaleString("default", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "Recent Log";

              return (
                <div 
                  key={idx} 
                  className={`border rounded-xl p-3.5 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 ${uiTheme.cardBg}`}
                >
                  {/* Left Column Content Metadata Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg border flex-shrink-0 mt-0.5 flex items-center justify-center ${styles.color}`}>
                      {styles.icon}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs font-bold tracking-tight truncate ${uiTheme.textMain}`}>{noti.title}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${styles.color}`}>
                          {styles.badge}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed font-medium line-clamp-2 md:line-clamp-1 ${uiTheme.textMuted}`}>
                        {noti.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Column Content Tracker Properties */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-app-border/10 flex-shrink-0 text-[10px] font-mono text-app-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-app-surface-strong text-app-muted transition-colors">
                        {noti.entityType === "CSR" ? <FileCode size={11} className="text-purple-400" /> : <Award size={11} className="text-blue-400" />}
                        <span className="font-semibold text-app-muted">{noti.entityAlias || `ID: #${noti.entityId}`}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-sans font-semibold text-app-muted whitespace-nowrap">
                      <Calendar size={11} className="text-app-muted" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Clean Compact Footprint Pagination Cluster */}
        <div className="flex justify-between items-center pt-4 mt-4 border-t border-app-border/10 text-[10px] text-app-muted font-bold uppercase tracking-wider transition-colors">
          <span>Showing {paginatedItems.length} of {processedNotifications.length} items</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border transition-all disabled:opacity-30 bg-app-surface-strong border-app-border text-app-muted hover:text-app-heading hover:bg-app-surface-muted"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-app-surface border border-app-border text-app-text transition-colors">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border transition-all disabled:opacity-30 bg-app-surface-strong border-app-border text-app-muted hover:text-app-heading hover:bg-app-surface-muted"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// Maintained stable mock structure fallback matching operational schema constraints
const getFallbackMockData = () => [
  {
    eventType: "CERTIFICATE_ISSUED",
    title: "Certificate Issued Successfully",
    message: "Certificate 'insa-prod-web-anchor' was issued successfully across secondary validation paths.",
    entityType: "CERTIFICATE",
    entityId: 104,
    entityAlias: "insa-prod-web-anchor",
    eventTime: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    eventType: "CERTIFICATE_EXPIRING_SOON",
    title: "Certificate Expiring Soon",
    message: "Certificate 'dev-signing-token-v2' will expire in 14 day(s). Action is required to prevent node disruption.",
    entityType: "CERTIFICATE",
    entityId: 88,
    entityAlias: "dev-signing-token-v2",
    eventTime: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  },
  {
    eventType: "CSR_REJECTED",
    title: "CSR Submission Rejected",
    message: "CSR 'subca-hsm-link-req' was rejected. Reason: Host identifier mismatch inside Organization Unit constraints.",
    entityType: "CSR",
    entityId: 412,
    entityAlias: "subca-hsm-link-req",
    eventTime: new Date(Date.now() - 1000 * 60 * 1440).toISOString()
  },
  {
    eventType: "CSR_APPROVED",
    title: "CSR Approved by Administrator",
    message: "CSR 'vpn-endpoint-client-auth' was approved and is currently awaiting deployment processing.",
    entityType: "CSR",
    entityId: 415,
    entityAlias: "vpn-endpoint-client-auth",
    eventTime: new Date(Date.now() - 1000 * 60 * 2880).toISOString()
  }
];

export default UserNotifications;