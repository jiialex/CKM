import { useState } from "react";
import {
  Key,
  Lock,
  Search,
  RotateCw,
  Trash2,
  Download,
  Shield,
  Info,
  Calendar,
  Layers,
  Activity
} from "lucide-react";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

export default function KeyTable({ data, loading, onRefresh }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Key Info");
  const [actionLoading, setActionLoading] = useState({});

  const filteredData = data.filter((k) =>
    k.alias?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const setLoadingStatus = (alias, status) => {
    setActionLoading((prev) => ({ ...prev, [alias]: status }));
  };

  const handleDelete = async (alias) => {
    const pin = prompt("Enter HSM PIN to delete this key:");
    if (!pin) return;

    setLoadingStatus(alias, "delete");
    try {
      await api.delete(`/keys/manage/${alias}?pin=${pin}`);
      toast.success("Key deleted successfully");
      setSelectedKey(null);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Deletion failed");
    } finally {
      setLoadingStatus(alias, null);
    }
  };

  const handleRotate = async (alias) => {
    const pin = prompt("Enter HSM PIN to rotate key:");
    if (!pin) return;

    setLoadingStatus(alias, "rotate");
    try {
      await api.post(`/keys/manage/rotate/${alias}?pin=${pin}`);
      toast.success("Key rotated successfully");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rotation failed");
    } finally {
      setLoadingStatus(alias, null);
    }
  };

  const handleExport = async (alias) => {
    try {
      const res = await api.get(`/keys/manage/export/public/${alias}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${alias}_public.pem`;
      a.click();
      toast.success("Public key exported");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const handleToggleStatus = async (alias, currentEnabled) => {
    const action = currentEnabled ? "disable" : "enable";
    setLoadingStatus(alias, action);

    try {
      await api.post(`/keys/manage/${alias}/${action}`);
      toast.success(`Key ${action}d successfully`);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || `${action} failed`);
    } finally {
      setLoadingStatus(alias, null);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-400 font-medium tracking-wide">Loading keystore nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Inline Search Bar Filter Input Row */}
      <div className="flex items-center justify-between w-full">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#182230] border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-blue-500 transition-colors"
            placeholder="Search by alias reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 tracking-tight">
          Total Keys: {filteredData.length}
        </div>
      </div>

      {/* Styled Grid Structure Matrix Table Wrapper */}
      <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-xl overflow-hidden bg-white dark:bg-[#111823]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-[#161F2E] text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/60 dark:border-slate-800/60">
              <th className="px-5 py-3 w-10 text-center">Type</th>
              <th className="px-5 py-3">Alias</th>
              <th className="px-5 py-3">Algorithm</th>
              <th className="px-5 py-3">Size/Curve</th>
              <th className="px-5 py-3">Created Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-400 font-medium italic">
                  No matching secure key nodes discovered.
                </td>
              </tr>
            ) : (
              filteredData.map((k) => {
                const isSelected = selectedKey?.alias === k.alias;
                return (
                  <tr
                    key={k.id || k.alias}
                    onClick={() => setSelectedKey(isSelected ? null : k)}
                    className={`group cursor-pointer transition-colors duration-150 ${
                      isSelected 
                        ? "bg-blue-50/40 dark:bg-blue-950/20" 
                        : "hover:bg-slate-50/60 dark:hover:bg-[#151E2C]"
                    }`}
                  >
                    {/* Key Hardware Token Indicator Flag */}
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center">
                        {k.isHsmKey ? (
                          <Lock size={13} className="text-amber-500" title="HSM Protected" />
                        ) : (
                          <Key size={13} className="text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* Alias Cell Column */}
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {k.alias}
                    </td>

                    {/* Cryptographic Primitive Identifier Algorithm Column */}
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {k.algorithm}
                    </td>

                    {/* Key Modulus Vector Spec Curve Size Column */}
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {k.keySize || k.curveName || "N/A"}
                    </td>

                    {/* Timestamp Entry Node Column */}
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(k.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    {/* Functional Status Tag Badge Column */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                          k.enabled === false
                            ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        }`}
                      >
                        {k.enabled === false ? "Disabled" : "Active"}
                      </span>
                    </td>

                    {/* Node Row Action Control Panels Column */}
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => handleToggleStatus(k.alias, k.enabled)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title={k.enabled === false ? "Enable Key" : "Disable Key"}
                        >
                          <Shield size={13} />
                        </button>
                        <button
                          onClick={() => handleExport(k.alias)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Export Public Key"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => handleRotate(k.alias)}
                          disabled={actionLoading[k.alias] === "rotate"}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40"
                          title="Rotate Cryptographic Key"
                        >
                          <RotateCw size={13} className={actionLoading[k.alias] === "rotate" ? "animate-spin" : ""} />
                        </button>
                        <button
                          onClick={() => handleDelete(k.alias)}
                          disabled={actionLoading[k.alias] === "delete"}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40"
                          title="Purge Key Module"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Structured Details Inspector Secondary Panel Card Container */}
      {selectedKey && (
        <div className="border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#141C29] rounded-xl p-5 shadow-inner mt-4 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedKey.alias}
                </h3>
                {selectedKey.isHsmKey && <span className="text-[9px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded uppercase">Hardware Vault</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Unique Crypto Token Identifier Context</p>
            </div>

            {/* Panel Quick Actions Toolbar Strip */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleExport(selectedKey.alias)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1B2535] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs font-medium transition-colors text-slate-700 dark:text-slate-300"
              >
                <Download size={12} /> Export Public
              </button>
              <button
                onClick={() => handleToggleStatus(selectedKey.alias, selectedKey.enabled)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1B2535] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs font-medium transition-colors text-slate-700 dark:text-slate-300"
              >
                <Shield size={12} />
                {selectedKey.enabled === false ? "Enable Key Node" : "Disable Key Node"}
              </button>
              <button
                onClick={() => handleRotate(selectedKey.alias)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1B2535] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs font-medium transition-colors text-slate-700 dark:text-slate-300"
              >
                <RotateCw size={12} /> Rotate Module
              </button>
              <button
                onClick={() => handleDelete(selectedKey.alias)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-md text-xs font-semibold transition-colors"
              >
                <Trash2 size={12} /> Purge Block
              </button>
            </div>
          </div>

          {/* Sub-Card Module Tab Strip Switch Panel */}
          <div className="flex gap-2 mb-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
            {[
              { id: "Key Info", icon: <Info size={12} /> },
              { id: "Public Key", icon: <Layers size={12} /> },
              { id: "Metadata", icon: <Calendar size={12} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-tight transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {tab.icon}
                {tab.id}
              </button>
            ))}
          </div>

          {/* Render Target Panel Switch Router Canvas Area */}
          <div className="text-xs transition-opacity duration-150">
            {activeTab === "Key Info" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-[#111823] p-4 rounded-lg border border-slate-200/40 dark:border-slate-800/60">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Primitive Algorithm</span>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{selectedKey.algorithm}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Modulus Weight Size</span>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{selectedKey.keySize || selectedKey.curveName || "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Key Registration Timestamp</span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{new Date(selectedKey.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Functional Status Flag</span>
                  <p className={`text-sm font-bold flex items-center gap-1 ${selectedKey.enabled === false ? "text-red-500" : "text-emerald-500"}`}>
                    <Activity size={12} />
                    {selectedKey.enabled === false ? "Disabled Domain" : "Operational Target"}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "Public Key" && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">ASCII Armor Public Text Block (PEM)</span>
                <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed max-h-48 border border-slate-800 custom-scrollbar shadow-inner select-text">
                  -----BEGIN PUBLIC KEY-----{"\n"}
                  {selectedKey.publicKey}
                  {"\n"}-----END PUBLIC KEY-----
                </pre>
              </div>
            )}

            {activeTab === "Metadata" && (
              <div className="bg-white dark:bg-[#111823] p-4 rounded-lg border border-slate-200/40 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                  <span className="font-medium text-slate-400">PKCS#11 Provider Label:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedKey.hsmLabel || selectedKey.alias}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                  <span className="font-medium text-slate-400">Authorized Registration Issuer:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedKey.createdBy || "System Cluster Account"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}