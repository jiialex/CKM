import { useEffect, useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Download,
  Archive,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import CertificateDetailsModal from "../../components/cert/CertificateDetailsModal";

function CertificatesTab() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/certificates/my-certificates");
      setCertificates(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const filtered = useMemo(() => {
    return certificates.filter(cert =>
      cert.alias?.toLowerCase().includes(search.toLowerCase()) ||
      (cert.commonName || cert.subject || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [certificates, search]);

  const handleDownloadPem = async (id, alias) => {
    try {
      const res = await api.get(`/certificates/${id}/pem`, { responseType: 'text' });
      const blob = new Blob([res.data], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${alias}.pem`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PEM downloaded");
    } catch {
      toast.error("Download failed");
    }
  };


  const handleArchiveCertificate = async (id) => {
    if (!window.confirm("Are you sure you want to archive this certificate?")) return;
    try {
      await api.post(`/certificates/${id}/archive`);
      toast.success("Certificate successfully archived");
      fetchCertificates(); // Refresh table row states
    } catch (err) {
      toast.error(err.response?.data?.message || "Archiving failed or unauthorized access");
    }
  };

  return (
    <div className="p-6 space-y-6 text-app-text">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-app-heading">Certificates</h1>
          <p className="text-app-muted text-sm">Manage your issued certificates</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-3 text-app-muted" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by alias or common name..."
              className="app-input w-full pl-10 py-3 rounded-xl text-sm"
            />
          </div>

          <button
            onClick={fetchCertificates}
            className="px-5 py-3 bg-app-surface-strong border border-app-border text-app-text rounded-xl hover:bg-app-surface-muted flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-app-surface-strong text-xs uppercase tracking-widest text-app-muted border-b border-app-border">
              <th className="px-6 py-4 text-left">Alias</th>
              <th className="px-6 py-4 text-left">Common Name</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Expiry</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 text-app-muted">Loading certificates...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-20 text-app-muted">No certificates found</td></tr>
            ) : (
              filtered.map(cert => (
                <tr key={cert.id} className="hover:bg-app-surface-muted transition-colors group">
                  <td className="px-6 py-5 font-medium text-app-heading">{cert.alias}</td>
                  
                  <td className="px-6 py-5 text-app-text">
                    {getCommonName(cert)}
                  </td>

                  <td className="px-6 py-5 text-app-muted">{cert.type || '-'}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-3 py-1 text-xs rounded-full font-medium ${
                      cert.status === 'ACTIVE' ? 'bg-app-success-soft text-app-success' : 'bg-app-danger-soft text-app-danger'
                    }`}>
                      {cert.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-app-muted text-sm">
                    {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg text-blue-500 dark:text-blue-400"
                        title="View Metadata Details"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        onClick={() => handleDownloadPem(cert.id, cert.alias)}
                        className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400"
                        title="Download PEM File"
                      >
                        <Download size={17} />
                      </button>
                      <button
                        onClick={() => handleArchiveCertificate(cert.id)}
                        className="p-2 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-500"
                        title="Archive Certificate"
                      >
                        <Archive size={17} />
                      </button>
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
          certId={selectedCert.id}
          cert={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}

const getCommonName = (cert) => {
  if (cert.commonName) return cert.commonName;
  if (cert.subject) {
    const cnMatch = cert.subject.match(/CN=([^,]+)/);
    return cnMatch ? cnMatch[1] : cert.subject.split(',')[0];
  }
  return "N/A";
};

export default CertificatesTab;
