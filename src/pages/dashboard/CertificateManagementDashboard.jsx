import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  Download,
  Layers,
  CheckCircle,
  Ban,
  Clock,
  ChevronRight,
  ShieldAlert,
  Calendar,
  ChevronDown,
  CornerDownRight,
  FileText,
  Lock,
  Link2
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios"; // Adjust path to your base Axios instance

export default function CertificateDashboard() {
  // Data States
  const [certificates, setCertificates] = useState([]);
  const [revokedCertificates, setRevokedCertificates] = useState([]);
  const [expiredCertificates, setExpiredCertificates] = useState([]);
  const [expiringSoonCertificates, setExpiringSoonCertificates] = useState([]);
  
  // UI & UX States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  
  // Chain Tree UI Trackers
  const [expandedChains, setExpandedChains] = useState({}); // { certId: [ chainObj1, chainObj2 ] }
  const [loadingChains, setLoadingChains] = useState({});

  // Fetch data aggregated across matching Spring Boot API endpoints
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [allCerts, revoked, expired, expiring] = await Promise.all([
        api.get("/certificates").then(res => res.data).catch(() => []),
        api.get("/certificates/revoked").then(res => res.data).catch(() => []),
        api.get("/certificates/expired").then(res => res.data).catch(() => []),
        api.get("/certificates/expiring-soon").then(res => res.data).catch(() => [])
      ]);

      setCertificates(allCerts);
      setRevokedCertificates(revoked);
      setExpiredCertificates(expired);
      setExpiringSoonCertificates(expiring);
    } catch (err) {
      toast.error("Failed to sync certificate registry data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Safe Extraction Utility for Common Name (CN)
  const extractCommonName = (cert) => {
    if (!cert) return "Unknown Subject CN";
    if (cert.commonName) return cert.commonName;
    if (cert.subject) {
      const match = cert.subject.match(/CN=([^,]+)/i);
      if (match && match[1]) return match[1];
    }
    return "Unknown Subject CN";
  };

  // Compute metrics based on structural data arrays returned by backend endpoints
  const metrics = useMemo(() => ({
    total: certificates.length,
    active: certificates.filter(c => c.status === "ACTIVE" || (!c.status && String(c.serialNumber))).length,
    revoked: revokedCertificates.length,
    expired: expiredCertificates.length,
    expiring: expiringSoonCertificates.length
  }), [certificates, revokedCertificates, expiredCertificates, expiringSoonCertificates]);

  // Master Filter & Search routing matching table expectations
  const filteredCertificates = useMemo(() => {
    let sourceList = [...certificates];
    if (activeCategory === "REVOKED") sourceList = revokedCertificates;
    if (activeCategory === "EXPIRED") sourceList = expiredCertificates;
    if (activeCategory === "EXPIRING") sourceList = expiringSoonCertificates;
    if (activeCategory === "ACTIVE") {
      sourceList = certificates.filter(c => c.status === "ACTIVE");
    }

    return sourceList.filter(cert =>
      cert.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.serialNumber?.toString().includes(searchQuery)
    );
  }, [activeCategory, certificates, revokedCertificates, expiredCertificates, expiringSoonCertificates, searchQuery]);

  // Fetches and handles showing chain verification path inside rows
  const handleToggleChainVerify = async (id) => {
    // If already expanded, close it
    if (expandedChains[id]) {
      const updatedChains = { ...expandedChains };
      delete updatedChains[id];
      setExpandedChains(updatedChains);
      return;
    }

    try {
      setLoadingChains(prev => ({ ...prev, [id]: true }));
      
      // Check cryptographic verify validation status
      const verifyRes = await api.get(`/certificates/${id}/verify`);
      if (verifyRes.data === true || verifyRes.data?.isValid || verifyRes.data?.status === "ACTIVE") {
        toast.success("Path Cryptographic validation: Valid Chain");
      } else {
        toast.error("Path validation warning: Broken or unverified chain signatures");
      }

      // Fetch chain array sequence hierarchy list from API
      const chainRes = await api.get(`/certificates/${id}/chain`);
      
      setExpandedChains(prev => ({
        ...prev,
        [id]: Array.isArray(chainRes.data) ? chainRes.data : []
      }));
    } catch (err) {
      toast.error("Failed to load validation certificate chain tree hierarchy");
    } finally {
      setLoadingChains(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDownloadPem = async (id, alias) => {
    try {
      const res = await api.get(`/certificates/${id}/pem`, { responseType: 'text' });
      const blob = new Blob([res.data], { type: "application/x-pem-file" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${alias || "certificate_" + id}.pem`;
      link.click();
      toast.success("ASCII PEM downloaded");
    } catch (err) {
      toast.error("Failed to compile target PEM data file");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-[#0b131f] min-h-screen text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Certificate Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage, track, verify, and monitor public key identity infrastructure</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#16222f] border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl transition-all text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-slate-400 dark:text-slate-400"} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* METRIC SCORE CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon={<Layers size={18} />} title="Total" value={metrics.total} color="blue" />
        <MetricCard icon={<CheckCircle size={18} />} title="Active" value={metrics.active} color="emerald" />
        <MetricCard icon={<Ban size={18} />} title="Revoked" value={metrics.revoked} color="red" />
        <MetricCard icon={<ShieldAlert size={18} />} title="Expired" value={metrics.expired} color="rose" />
        <MetricCard icon={<Clock size={18} />} title="Expiring Soon" value={metrics.expiring} color="orange" />
      </section>

      {/* SEARCH AND FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-[#111c2a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <CategoryButton active={activeCategory === "ALL"} onClick={() => setActiveCategory("ALL")} label="All" count={metrics.total} />
          <CategoryButton active={activeCategory === "ACTIVE"} onClick={() => setActiveCategory("ACTIVE")} label="Active" count={metrics.active} />
          <CategoryButton active={activeCategory === "REVOKED"} onClick={() => setActiveCategory("REVOKED")} label="Revoked" count={metrics.revoked} />
          <CategoryButton active={activeCategory === "EXPIRED"} onClick={() => setActiveCategory("EXPIRED")} label="Expired" count={metrics.expired} />
          <CategoryButton active={activeCategory === "EXPIRING"} onClick={() => setActiveCategory("EXPIRING")} label="Expiring Soon" count={metrics.expiring} />
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#16222f] border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 pl-9 pr-3 py-2 rounded-lg text-xs outline-none text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-[#111c2a] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#16222f] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3 text-left">Alias Mapping</th>
                <th className="px-5 py-3 text-left">Common Name (CN)</th>
                <th className="px-5 py-3 text-left">Key Encryption Type</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Expiration Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs font-mono">
                    <RefreshCw className="animate-spin inline mr-2 text-blue-500" size={14} /> Fetching credentials...
                  </td>
                </tr>
              ) : filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                    No certificates found matching chosen parameters
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => {
                  const isChainOpen = !!expandedChains[cert.id];
                  const chainList = expandedChains[cert.id] || [];
                  const isChainLoading = !!loadingChains[cert.id];

                  // Look at the clicked certificate's index in the returned chain to find out what type it is
                  const certIndexInChain = chainList.findIndex(node => node.id === cert.id);
                  const totalChainLength = chainList.length;

                  // Determine sub-elements array slice to render depending on structural categorization rules
                  let visibleChainNodes = [];
                  if (isChainOpen && totalChainLength > 0) {
                    if (certIndexInChain === 0) {
                      visibleChainNodes = [chainList[0]];
                    } else if (certIndexInChain > 0 && certIndexInChain < totalChainLength - 1) {
                      visibleChainNodes = [chainList[0], chainList[certIndexInChain]];
                    } else {
                      if (totalChainLength === 2) {
                        visibleChainNodes = [chainList[0], chainList[1]];
                      } else if (totalChainLength > 2) {
                        visibleChainNodes = [chainList[0], chainList[1], chainList[totalChainLength - 1]];
                      } else {
                        visibleChainNodes = [chainList[0]];
                      }
                    }
                  }

                  return (
                    <React.Fragment key={cert.id || cert.serialNumber}>
                      {/* MAIN DATA ROW */}
                      <tr className={`hover:bg-slate-50/70 dark:hover:bg-[#16222f]/40 transition-colors group ${isChainOpen ? "bg-blue-50/20 dark:bg-blue-950/10" : ""}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white text-xs">{cert.alias || "No Alias Available"}</span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">ID: {cert.id || "-"} • SN: {cert.serialNumber || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-mono truncate max-w-[200px]">
                          {extractCommonName(cert)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded uppercase">
                            {cert.type || "RSA-2048"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider border ${
                            cert.status === 'ACTIVE' || !cert.status ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                            cert.status === 'REVOKED' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 
                            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}>
                            {cert.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleToggleChainVerify(cert.id)} 
                              className={`p-1.5 rounded-lg transition-colors relative ${
                                isChainOpen 
                                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" 
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-500 dark:text-indigo-400"
                              }`} 
                              title="Verify Trust Chain Path"
                              disabled={isChainLoading}
                            >
                              {isChainLoading ? (
                                <RefreshCw size={13} className="animate-spin text-blue-500" />
                              ) : (
                                <Shield size={13} />
                              )}
                            </button>
                            <button 
                              onClick={() => handleDownloadPem(cert.id, cert.alias)} 
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-blue-500 dark:text-blue-400 transition-colors" 
                              title="Download PEM File"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* OVERHAULED TRUST CHAIN VISUALIZATION */}
                      {isChainOpen && (
                        <tr className="bg-slate-50/40 dark:bg-[#0e1724] border-l-4 border-blue-500/80">
                          <td colSpan={6} className="px-8 py-6">
                            <div className="max-w-3xl">
                              
                              {/* Layout Title Banner */}
                              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <Lock size={14} className="text-blue-500" />
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Cryptographic Trust Path Verification
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-[#16222f] px-2.5 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                                  <Link2 size={10} />
                                  <span>Path Depth: {visibleChainNodes.length} Nodes</span>
                                </div>
                              </div>

                              {visibleChainNodes.length === 0 ? (
                                <div className="text-slate-400 dark:text-slate-500 italic text-xs py-4 text-center bg-white dark:bg-[#111c2a] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                  No hierarchical trusted authority nodes mapped to this certificate context.
                                </div>
                              ) : (
                                /* Vertical Tree Container */
                                <div className="relative pl-2 space-y-4">
                                  
                                  {/* The Connecting Backbone Line */}
                                  {visibleChainNodes.length > 1 && (
                                    <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-amber-400 via-blue-400 to-indigo-400 dark:from-amber-500/40 dark:via-blue-500/40 dark:to-indigo-500/40" />
                                  )}

                                  {visibleChainNodes.map((node, index) => {
                                    const isRoot = index === 0;
                                    const isLast = index === visibleChainNodes.length - 1;
                                    const isIntermediate = !isRoot && !isLast;
                                    
                                    // Highlight if this specific node in the tree matches the current active cert row
                                    const isCurrentNode = node.id === cert.id;

                                    return (
                                      <div key={node.id || index} className="relative flex items-start group/node">
                                        
                                        {/* Status Dot Placement Over Backbone Line */}
                                        <div className={`absolute left-2.5 top-3.5 w-2 h-2 rounded-full z-10 border-2 transition-transform group-hover/node:scale-125 ${
                                          isRoot 
                                            ? "bg-amber-500 border-white dark:border-[#0e1724] shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                                            : isIntermediate 
                                              ? "bg-blue-500 border-white dark:border-[#0e1724]" 
                                              : "bg-indigo-500 border-white dark:border-[#0e1724] shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                        }`} />

                                        {/* Horizontal Branch Connector Arm */}
                                        {index > 0 && (
                                          <div className="absolute left-[19px] top-4 w-4 h-px border-t border-dashed border-slate-300 dark:border-slate-700" />
                                        )}

                                        {/* Structural Information Row Node Card */}
                                        <div className={`ml-9 flex-1 bg-white dark:bg-[#121e2c] border rounded-xl p-3.5 transition-all shadow-sm hover:shadow-md flex items-center gap-4 ${
                                          isCurrentNode 
                                            ? "ring-2 ring-blue-500/50 border-blue-500 dark:bg-[#142438]" 
                                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                        }`}>
                                          
                                          {/* Icon Badge */}
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                            isRoot 
                                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                                              : isIntermediate
                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                          }`}>
                                            {isRoot || isIntermediate ? <Shield size={14} className="fill-current/5" /> : <FileText size={14} />}
                                          </div>

                                          {/* Body Metas */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                              <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                                                {node.alias || "System Authority Anchor"}
                                              </h4>
                                              <span className="text-[9px] font-mono font-medium tracking-tight text-slate-400 dark:text-slate-500">
                                                ID: {node.id || "N/A"}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                                              Subject DN: <span className="text-slate-700 dark:text-slate-300">{extractCommonName(node)}</span>
                                            </p>
                                          </div>

                                          {/* Right Metadata Classification Badges */}
                                          <div className="flex items-center gap-2">
                                            {isCurrentNode && (
                                              <span className="text-[9px] bg-blue-500 text-white font-bold px-2 py-0.5 rounded-md uppercase tracking-wide animate-pulse">
                                                Current
                                              </span>
                                            )}
                                            <span className={`text-[9px] px-2.5 py-0.5 rounded-md font-mono font-bold border tracking-wider ${
                                              isRoot 
                                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/40" 
                                                : isIntermediate
                                                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/40 dark:border-blue-900/40"
                                                  : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200/40 dark:border-indigo-900/40"
                                            }`}>
                                              {isRoot ? "ROOT CA" : isIntermediate ? "INTERMEDIATE CA" : "LEAF CERT"}
                                            </span>
                                          </div>

                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* SUBCOMPONENT CARD MODULE */
const MetricCard = ({ icon, title, value, color }) => {
  const colorVariants = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20",
  };

  return (
    <div className="bg-white dark:bg-[#111c2a] border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorVariants[color] || colorVariants.blue}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
        </div>
      </div>
      <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
    </div>
  );
};

/* FILTER BUTTON ELEMENT */
const CategoryButton = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
      active
        ? "bg-blue-600 text-white shadow-sm border border-transparent"
        : "bg-slate-50 dark:bg-[#16222f] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#21262D]"
    }`}
  >
    <span>{label}</span>
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-[#0D1117] text-slate-500"}`}>
      {count}
    </span>
  </button>
);