import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  Ban,
  Layers,
  Cpu,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";

import {
  getCertificates,
  getRevokedCertificates,
  verifyCertificateById,
  getCertificatePemById,
  revokeCertificateById,
  deleteCertificateById,
} from '../../services/certificates';

import CertificateDetailsModal from "../../components/cert/CertificateDetailsModal";

 function CertificateManagement() {
  const [certificates, setCertificates] = useState([]);
  const [revokedCertificates, setRevokedCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allCerts, revoked] = await Promise.all([
        getCertificates(),
        getRevokedCertificates()
      ]);
      setCertificates(allCerts);
      setRevokedCertificates(revoked);
    } catch (err) {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCertificates = useMemo(() => {
    let data = certificates;

    if (activeCategory === "ACTIVE") {
      data = data.filter(c => c.status === "ACTIVE");
    } else if (activeCategory === "REVOKED") {
      data = revokedCertificates;
    } else if (activeCategory === "EXPIRING") {
      data = data.filter(c => {
        if (!c.expiryDate) return false;
        const days = Math.ceil((new Date(c.expiryDate) - Date.now()) / (86400000));
        return days > 0 && days <= 30;
      });
    }

    return data.filter(cert =>
      cert.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.commonName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [certificates, revokedCertificates, searchQuery, activeCategory]);

  const handleDownloadPem = async (id, alias) => {
    try {
      const pem = await getCertificatePemById(id);
      const blob = new Blob([pem], { type: "application/x-pem-file" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${alias}.pem`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PEM downloaded successfully");
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const handleRevoke = async (id) => {
    const reason = prompt("Enter revocation reason (e.g. KEY_COMPROMISE):");
    if (!reason) return;

    try {
      await revokeCertificateById(id, reason);
      toast.success("Certificate revoked");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Revoke failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this certificate permanently?")) return;
    try {
      await deleteCertificateById(id);
      toast.success("Certificate deleted");
      fetchData();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const metrics = {
    total: certificates.length,
    active: certificates.filter(c => c.status === "ACTIVE").length,
    revoked: revokedCertificates.length,
    expiring: certificates.filter(c => {
      if (!c.expiryDate) return false;
      const days = Math.ceil((new Date(c.expiryDate) - Date.now()) / (86400000));
      return days > 0 && days <= 30;
    }).length,
  };

  return (
    <div className="p-6 space-y-6 bg-[#0A0D12] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-white">Certificate Management</h1>
          <p className="text-slate-500">Manage issued certificates and revocation</p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-3 bg-[#161B22] border border-[#30363D] rounded-xl hover:bg-[#21262D] transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Layers size={22} />} title="Total Certificates" value={metrics.total} color="blue" />
        <MetricCard icon={<CheckCircle size={22} />} title="Active" value={metrics.active} color="emerald" />
        <MetricCard icon={<ShieldAlert size={22} />} title="Revoked" value={metrics.revoked} color="red" />
        <MetricCard icon={<AlertTriangle size={22} />} title="Expiring Soon" value={metrics.expiring} color="orange" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
        <CategoryButton active={activeCategory === "ALL"} onClick={() => setActiveCategory("ALL")} label="All" />
        <CategoryButton active={activeCategory === "ACTIVE"} onClick={() => setActiveCategory("ACTIVE")} label="Active" />
        <CategoryButton active={activeCategory === "REVOKED"} onClick={() => setActiveCategory("REVOKED")} label="Revoked" />
        <CategoryButton active={activeCategory === "EXPIRING"} onClick={() => setActiveCategory("EXPIRING")} label="Expiring Soon" />

        <div className="relative ml-auto w-80">
          <Search className="absolute left-3 top-3 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by alias or common name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1117] border border-[#30363D] pl-10 py-3 rounded-xl text-sm focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#161B22] text-xs uppercase tracking-widest text-slate-400 border-b border-[#30363D]">
              <th className="px-6 py-5 text-left">Alias</th>
              <th className="px-6 py-5 text-left">Common Name</th>
              <th className="px-6 py-5 text-left">Type</th>
              <th className="px-6 py-5 text-left">Status</th>
              <th className="px-6 py-5 text-left">Expiry</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262D]">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 text-slate-500">Loading certificates...</td></tr>
            ) : filteredCertificates.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-20 text-slate-500">No certificates found</td></tr>
            ) : (
              filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-[#161B22] transition-colors group">
                  <td className="px-6 py-5 font-medium text-white">{cert.alias}</td>
                  <td className="px-6 py-5 text-slate-300">{cert.commonName || '-'}</td>
                  <td className="px-6 py-5 text-slate-400">{cert.type}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-3 py-1 text-xs rounded-full font-medium ${
                      cert.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-500">
                    {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setSelectedCert(cert)} className="p-2 hover:bg-slate-800 rounded-lg text-blue-400">
                        <Eye size={17} />
                      </button>
                      <button onClick={() => handleDownloadPem(cert.id, cert.alias)} className="p-2 hover:bg-slate-800 rounded-lg text-emerald-400">
                        <Download size={17} />
                      </button>
                      {cert.status === 'ACTIVE' && (
                        <button onClick={() => handleRevoke(cert.id)} className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg">
                          <Ban size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCert && (
        <CertificateDetailsModal
          cert={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}

/* Reusable Components */
const MetricCard = ({ icon, title, value, color = "blue" }) => (
  <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 flex items-center gap-5">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${color}-500/10 text-${color}-400`}>
      {icon}
    </div>
    <div>
      <p className="text-xs uppercase tracking-widest text-slate-500">{title}</p>
      <p className="text-3xl font-semibold text-white mt-1">{value}</p>
    </div>
  </div>
);

const CategoryButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? "bg-blue-600 text-white"
        : "bg-[#161B22] border border-[#30363D] hover:bg-[#21262D] text-slate-400"
    }`}
  >
    {label}
  </button>
);

export default CertificateManagement;   // ← Only ONE default export