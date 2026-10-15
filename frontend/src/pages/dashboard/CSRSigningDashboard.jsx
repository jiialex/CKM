import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Check,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  
  Layers,
  X,
  UserCheck
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { 
  getPendingIntermediateCaCsrs, 
  getPendingEndEntityCsrs, 
  getPendingCsrs,
  getApprovedCsrs, 
  getRejectedCsrs, 
  rejectCsr
} from "../../services/csr";
import CSRSignModal from "../../components/csr/CSRSignModal";
import RootCASelfSignModal from "../../components/csr/RootCASelfSignModal";
import ApproveCsrModal from "../../components/csr/ApproveCsrModal";

const CSRSigningDashboard = () => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRootModal, setShowRootModal] = useState(false);
  // CHANGED: approving now needs a modal (to collect caAlias + caPin)
  // instead of a plain window.confirm(), since approval performs real
  // signing on the backend. approvingCsrId tracks which row triggered it.
  const [approvingCsrId, setApprovingCsrId] = useState(null);
  const [csrData, setCsrData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING"); 

  const user = useAuthStore((s) => s.user);
  const userRole = user?.caType;

  // Fetch CSRs with role-based logic
  const fetchInfrastructureCsrs = async () => {
    try {
      setLoading(true);
      setError("");

      let data = [];

      if (activeTab === "APPROVED") {
        data = await getApprovedCsrs();
      } else if (activeTab === "REJECTED") {
        data = await getRejectedCsrs();
      } else if (activeTab === "PENDING") {
        if (userRole === "ROOT") {
          data = await getPendingIntermediateCaCsrs();
        } else if (userRole === "CA_OPERATOR" || userRole === "INTERMEDIATE") {
          data = await getPendingEndEntityCsrs();
        } else {
          data = await getPendingCsrs();
        }
      }

      setCsrData(data || []);
    } catch (err) {
      console.error("Failed to fetch CSRs:", err);
      setError(`Failed to load ${activeTab.toLowerCase()} CSR records.`);
      setCsrData([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh when role or tab changes
  useEffect(() => {
    setSelectedRow(null);
    fetchInfrastructureCsrs();
  }, [userRole, activeTab]);

  // CHANGED: no longer calls approveCsr directly — opens ApproveCsrModal so
  // the operator can pick which CA signs it and enter that CA's PIN.
  const handleInlineApprove = (e, id) => {
    e.stopPropagation();
    setApprovingCsrId(id);
  };

  const handleApproved = () => {
    setApprovingCsrId(null);
    fetchInfrastructureCsrs();
  };

  const handleInlineReject = async (e, id) => {
    e.stopPropagation();
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    
    try {
      setLoading(true);
      await rejectCsr(id, reason || "Rejected by administrator");
      await fetchInfrastructureCsrs();
    } catch (err) {
      setError("Failed to reject CSR request.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCsrData = csrData.filter((csr) => {
    const term = searchQuery.toLowerCase();
    return (
      csr.id?.toString().toLowerCase().includes(term) ||
      csr.csrAlias?.toLowerCase().includes(term) ||
      (csr.subject || csr.commonName || "").toLowerCase().includes(term) ||
      csr.keyAlias?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-700 p-6 space-y-6 font-sans">
      {/* Header with Role Info */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSR Signing Dashboard</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <UserCheck size={16} />
            <span>Logged in as: <strong className="text-slate-700">{userRole || "USER"}</strong></span>
          </div>
        </div>

        {userRole === "ROOT" && (
          <button
            onClick={() => setShowRootModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <ShieldCheck size={18} />
            Self-Sign Root CA
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl">
        {["PENDING", "APPROVED", "REJECTED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-semibold transition-all border-b-4 ${
              activeTab === tab 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab} Queue
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder={`Search ${activeTab.toLowerCase()} CSRs...`}
          />
        </div>

        <button
          disabled={!selectedRow || activeTab !== "APPROVED"}
          onClick={() => setShowSignModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:cursor-not-allowed"
        >
          <Check size={18} />
          Sign Selected CSR
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
              <p>Loading {activeTab.toLowerCase()} CSRs...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-red-500 flex items-center gap-3">
              <AlertCircle size={24} />
              {error}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 w-16">ID</th>
                  <th className="px-6 py-4">CSR Alias</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Key Alias</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center w-52">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCsrData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-20 text-slate-400">
                      No {activeTab.toLowerCase()} CSRs found.
                    </td>
                  </tr>
                ) : (
                  filteredCsrData.map((csr) => {
                    const isSelected = selectedRow?.id === csr.id;
                    return (
                      <tr
                        key={csr.id}
                        onClick={() => setSelectedRow(csr)}
                        className={`cursor-pointer transition-all hover:bg-slate-50 ${
                          isSelected ? "bg-indigo-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-indigo-600">{csr.id}</td>
                        <td className="px-6 py-4 font-medium">{csr.csrAlias || "—"}</td>
                        <td className="px-6 py-4 text-slate-600 truncate max-w-xs">
                          {csr.subject || csr.commonName || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Layers size={16} className="text-indigo-500" />
                            <span className="text-sm font-medium">
                              {csr.csrType || (userRole === "ROOT" ? "INTERMEDIATE_CA" : "END_ENTITY")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500">{csr.keyAlias || "—"}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={csr.status || activeTab} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {activeTab === "PENDING" && (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={(e) => handleInlineApprove(e, csr.id)}
                                className="px-4 py-1.5 text-xs bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg transition-colors font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => handleInlineReject(e, csr.id)}
                                className="px-4 py-1.5 text-xs bg-red-100 hover:bg-red-600 hover:text-white text-red-700 rounded-lg transition-colors font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {activeTab === "APPROVED" && (
                            <span className="text-emerald-600 text-xs font-medium">Ready to Sign</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedRow && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">CSR Details</h3>
            <button onClick={() => setSelectedRow(null)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <DetailItem label="CSR Alias" value={selectedRow.csrAlias} />
            <DetailItem label="Common Name" value={selectedRow.commonName} />
            <DetailItem label="Organization" value={selectedRow.organization} />
            <DetailItem label="Country" value={selectedRow.country} />
            <DetailItem label="Email" value={selectedRow.email} />
            <DetailItem label="Signature Algorithm" value={selectedRow.signatureAlgorithm} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showRootModal && <RootCASelfSignModal onClose={() => setShowRootModal(false)} />}
      {showSignModal && selectedRow && (
        <CSRSignModal
          csrId={selectedRow.id}
          userRole={userRole}
          onClose={() => {
            setShowSignModal(false);
            setSelectedRow(null);
            fetchInfrastructureCsrs();
          }}
        />
      )}
      {approvingCsrId && (
        <ApproveCsrModal
          csrId={approvingCsrId}
          onClose={() => setApprovingCsrId(null)}
          onApproved={handleApproved}
        />
      )}
    </div>
  );
};

// Helper Components
const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase font-semibold text-slate-500 tracking-widest">{label}</p>
    <p className="mt-1 text-slate-800 font-medium">{value || "—"}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: { bg: "bg-amber-100 text-amber-700", icon: <Clock size={14} /> },
    APPROVED: { bg: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={14} /> },
    REJECTED: { bg: "bg-red-100 text-red-700", icon: <XCircle size={14} /> },
    ISSUED: { bg: "bg-indigo-100 text-indigo-700", icon: <CheckCircle2 size={14} /> },
  };

  const current = styles[status?.toUpperCase()] || styles.PENDING;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${current.bg}`}>
      {current.icon}
      {status}
    </div>
  );
};

export default CSRSigningDashboard;
