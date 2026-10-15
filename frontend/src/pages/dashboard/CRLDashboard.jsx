import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import {
  generateCrlFile,
  getMyRevokedCertificates,
} from "../../services/certificates";
import { toast } from "react-hot-toast";

const CRLDashboardOnly = () => {
  const [revokedCertificates, setRevokedCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [caAlias, setCaAlias] = useState("");
  const [pin, setPin] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReason, setSelectedReason] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const [stats, setStats] = useState({
    totalRevoked: 0,
    thisWeek: 0,
    criticalCompromise: 0,
  });

  const fetchRevokedCertificates = async () => {
    try {
      setLoading(true);
      const res = await getMyRevokedCertificates();
      const data = Array.isArray(res) ? res : [];

      setRevokedCertificates(data);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      setStats({
        totalRevoked: data.length,
        thisWeek: data.filter(
          (c) => c.revocationDate && new Date(c.revocationDate) >= oneWeekAgo
        ).length,
        criticalCompromise: data.filter((c) =>
          c.reason?.includes("COMPROMISE")
        ).length,
      });
    } catch (err) {
      toast.error("Failed to load revoked certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevokedCertificates();
  }, []);

  const handleGenerateCRL = async (e) => {
    e.preventDefault();
    if (!caAlias || !pin) return toast.error("CA Alias and PIN required");

    try {
      setActionLoading(true);
      const response = await generateCrlFile(caAlias, pin);

      const blob = new Blob([response], { type: "application/pkix-crl" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${caAlias}-crl.crl`;
      a.click();

      URL.revokeObjectURL(url);

      toast.success("CRL generated");
      setCaAlias("");
      setPin("");
      fetchRevokedCertificates();
    } catch {
      toast.error("Failed to generate CRL");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return revokedCertificates.filter((cert) => {
      const text = searchTerm.toLowerCase();

      const matchesSearch =
        cert.commonName?.toLowerCase().includes(text) ||
        cert.serialNumber?.toLowerCase().includes(text) ||
        cert.certificateAlias?.toLowerCase().includes(text);

      const matchesReason =
        selectedReason === "ALL" || cert.reason === selectedReason;

      let matchesDate = true;
      if (dateFilter !== "ALL" && cert.revocationDate) {
        const d = new Date(cert.revocationDate);
        const now = new Date();

        if (dateFilter === "TODAY") {
          matchesDate = d.toDateString() === now.toDateString();
        } else if (dateFilter === "WEEK") {
          const limit = new Date();
          limit.setDate(now.getDate() - 7);
          matchesDate = d >= limit;
        } else if (dateFilter === "MONTH") {
          const limit = new Date();
          limit.setMonth(now.getMonth() - 1);
          matchesDate = d >= limit;
        }
      }

      return matchesSearch && matchesReason && matchesDate;
    });
  }, [revokedCertificates, searchTerm, selectedReason, dateFilter]);

  const reasons = useMemo(() => {
    const set = new Set(revokedCertificates.map((c) => c.reason).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [revokedCertificates]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 px-6 py-8 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm">
              <ShieldAlert size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                CRL Control Panel
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Certificate revocation monitoring and cryptographic revocation list generation infrastructure.
              </p>
            </div>
          </div>

          <button
            onClick={fetchRevokedCertificates}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={`stroke-[2.5px] ${loading ? "animate-spin" : ""}`} />
            Refresh Inventory
          </button>
        </div>

        {/* STATS (compact strip) */}
        <div className="flex gap-3 text-xs font-semibold tracking-wide uppercase">
          <div className="px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl shadow-sm">
            Total Revoked: <span className="text-slate-900 font-bold ml-1">{stats.totalRevoked}</span>
          </div>
          <div className="px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl shadow-sm">
            Last 7 Days: <span className="text-amber-600 font-bold ml-1">{stats.thisWeek}</span>
          </div>
          <div className="px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl shadow-sm">
            Critical Compromises: <span className="text-rose-600 font-bold ml-1">{stats.criticalCompromise}</span>
          </div>
        </div>

        {/* CRL GENERATOR */}
        <form
          onSubmit={handleGenerateCRL}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-sm items-center"
        >
          <div className="flex-1">
            <input
              value={caAlias}
              onChange={(e) => setCaAlias(e.target.value)}
              placeholder="Target Authority CA Alias"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="flex-1">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Authority Partition Security PIN"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <button
            disabled={actionLoading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-transparent text-white text-xs font-bold rounded-xl flex items-center gap-2 h-[38px] transition-all shadow-sm"
          >
            {actionLoading ? (
              <>
                <Loader2 className="animate-spin text-indigo-500" size={14} />
                <span>Generating Output...</span>
              </>
            ) : (
              <>
                <Plus size={14} className="stroke-[2.5px]" />
                <span>Generate & Download CRL</span>
              </>
            )}
          </button>
        </form>

        {/* FILTER BAR */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400 stroke-[2.5px]" size={15} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Common Name, Serial Identifier or Alias string..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 font-medium placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
            />
          </div>

          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer min-w-[140px]"
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                Reason: {r}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer min-w-[120px]"
          >
            <option value="ALL">All Timeline</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">Last 30 Days</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3.5 font-bold">Common Name (CN)</th>
                <th className="text-left px-5 py-3.5 font-bold">Serial Number</th>
                <th className="text-left px-5 py-3.5 font-bold">Revocation Reason</th>
                <th className="text-left px-5 py-3.5 font-bold">Timestamp</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-14">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={24} />
                    <span className="text-xs text-slate-400 font-medium mt-2 block">Loading Revocation Index...</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-14 text-sm text-slate-400 font-medium italic">
                    No active revocation match vectors located inside data matrix.
                  </td>
                </tr>
              ) : (
                filteredData.map((c, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{c.commonName || "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 select-all tracking-tight">
                      {c.serialNumber || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        c.reason?.includes("COMPROMISE")
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {c.reason || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-500">
                      {c.revocationDate
                        ? new Date(c.revocationDate).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default CRLDashboardOnly;