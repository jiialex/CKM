import { useEffect, useState } from 'react';
import {
  ArrowLeft, Download, Trash2, Copy, ShieldCheck, Key as KeyIcon,
  Calendar, User, Globe, Building2, Fingerprint, Server,
  Network, AlertCircle, RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const CSRDetailView = ({ csr, onBack, onDeleted }) => {
  const [activeTab, setActiveTab] = useState('Info');
  const [loading, setLoading] = useState(true);
  const [csrDetail, setCsrDetail] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (!csr?.id) return;
    fetchCsrDetail();
  }, [csr]);

  const fetchCsrDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/csr/${csr.id}`);
      setCsrDetail(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load CSR details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/csr/export/${csr.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${csrDetail?.csrAlias || 'csr'}.csr`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSR exported successfully');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleCopyPem = async () => {
    try {
      await navigator.clipboard.writeText(csrDetail?.csrPem || '');
      toast.success('PEM copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete CSR "${csrDetail?.csrAlias}"?`)) return;

    try {
      await api.delete(`/csr/${csr.id}`);
      toast.success('CSR deleted successfully');
      onDeleted?.();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this CSR?')) return;

    setWithdrawLoading(true);
    try {
      await api.post(`/csr/${csr.id}/withdraw`);
      toast.success('CSR withdrawn successfully');
      fetchCsrDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdraw failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-[#0A0D12] font-sans">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-medium mt-4">Loading cryptographic specifications...</p>
        </div>
      </div>
    );
  }

  if (!csrDetail) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-[#0A0D12] text-slate-400 text-xs font-medium font-sans">
        Target architectural signing request node reference not located.
      </div>
    );
  }

  const statusStyle = {
    PENDING: 'bg-amber-500/5 text-amber-500 border-amber-500/10',
    APPROVED: 'bg-blue-500/5 text-blue-500 border-blue-500/10',
    REJECTED: 'bg-red-500/5 text-red-500 border-red-500/10',
    ISSUED: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10',
    WITHDRAWN: 'bg-slate-500/5 text-slate-400 border-slate-500/10',
  }[csrDetail.status] || 'bg-slate-500/5 text-slate-400 border-slate-500/10';

  const isPending = csrDetail.status === 'PENDING';

  return (
    <div className="space-y-6 p-6 font-sans bg-slate-50 dark:bg-[#0A0D12] min-h-full">
      {/* Upper Breadcrumb Navigation & Action Toolbar Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white dark:bg-[#161F2E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{csrDetail.csrAlias}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded border ${statusStyle}`}>
                {csrDetail.status}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              Structural Reference Pipeline Payload Specifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white dark:bg-[#161F2E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a2536] transition flex items-center gap-2"
          >
            <Download size={14} /> Export Payload
          </button>

          {isPending && (
            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading}
              className="px-4 py-2 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              <RotateCcw size={14} className={withdrawLoading ? 'animate-spin' : ''} />
              {withdrawLoading ? 'Revoking...' : 'Withdraw Request'}
            </button>
          )}

          {csrDetail.status !== 'ISSUED' && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg flex items-center gap-2 transition"
            >
              <Trash2 size={14} /> Purge Record
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tab Bar Pipeline */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none">
        {['Info', 'Subject DN', 'Extensions', 'PEM'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs font-bold tracking-tight border-b-2 transition-all ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Primary Structural Layout Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Section Content Area */}
        <div className="lg:col-span-8">
          {activeTab === 'Info' && (
            <div className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
              <InfoItem icon={<KeyIcon size={14} />} label="Operational Key Alias" value={csrDetail.keyAlias} />
              <InfoItem icon={<Calendar size={14} />} label="Creation Generation Epoch" value={new Date(csrDetail.createdAt).toLocaleString()} />
              <InfoItem icon={<User size={14} />} label="Originating Operator Node" value={csrDetail.createdBy} />
              <InfoItem icon={<ShieldCheck size={14} />} label="CA Authority Flag Status" value={csrDetail.ca ? 'True (Intermediate Authority)' : 'False (End-Entity Point)'} />
              <InfoItem icon={<Fingerprint size={14} />} label="Assigned Signature Algorithm" value={csrDetail.signatureAlgorithm} />
              <InfoItem icon={<AlertCircle size={14} />} label="Valid Authority Path Limit" value={csrDetail.pathLength ?? 'Unlimited Range'} />
            </div>
          )}

          {activeTab === 'Subject DN' && (
            <div className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 space-y-5 shadow-sm">
              <div className="bg-slate-50 dark:bg-[#161F2E] p-4 rounded-lg font-mono text-xs text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800/60 break-all leading-relaxed">
                CN={csrDetail.commonName}, O={csrDetail.organization}, OU={csrDetail.organizationalUnit}, C={csrDetail.country}, ST={csrDetail.state}, L={csrDetail.locality}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={<Globe size={14} />} label="Common Name (CN)" value={csrDetail.commonName} />
                <InfoItem icon={<Building2 size={14} />} label="Organization System (O)" value={csrDetail.organization} />
                <InfoItem icon={<ShieldCheck size={14} />} label="Organizational Unit (OU)" value={csrDetail.organizationalUnit} />
                <InfoItem icon={<Globe size={14} />} label="Country Code Identifier (C)" value={csrDetail.country} />
                <InfoItem icon={<Globe size={14} />} label="State / Province Identifier (ST)" value={csrDetail.state} />
                <InfoItem icon={<Globe size={14} />} label="Locality Target Scope (L)" value={csrDetail.locality} />
                <InfoItem icon={<User size={14} />} label="Subject Communications Email Address" value={csrDetail.email} className="sm:col-span-2" />
              </div>
            </div>
          )}

          {activeTab === 'Extensions' && (
            <div className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 space-y-6 shadow-sm">
              <ExtensionBlock title="Standard Cryptographic Key Usage Constraints" items={csrDetail.keyUsages || []} color="blue" />
              <ExtensionBlock title="Extended Key Intended Use Enforcements (EKU)" items={csrDetail.extendedKeyUsages || []} color="emerald" />
              <ExtensionBlock title="Subject Alternative Names - DNS Domain References" items={csrDetail.dnsNames || []} icon={<Server size={14} />} color="slate" />
              <ExtensionBlock title="Subject Alternative Names - Associated IP Interfaces" items={csrDetail.ipAddresses || []} icon={<Network size={14} />} color="slate" />
            </div>
          )}

          {activeTab === 'PEM' && (
            <div className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Raw Request ASCII Structure Block</span>
                <div className="flex gap-2">
                  <button onClick={handleCopyPem} className="px-3 py-1.5 bg-slate-50 dark:bg-[#161F2E] border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-[#1c283a] transition flex items-center gap-1.5">
                    <Copy size={12} /> Copy String
                  </button>
                  <button onClick={handleExport} className="px-3 py-1.5 bg-slate-50 dark:bg-[#161F2E] border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-[#1c283a] transition flex items-center gap-1.5">
                    <Download size={12} /> Save File
                  </button>
                </div>
              </div>

              <pre className="bg-slate-50 dark:bg-[#161F2E] p-5 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 overflow-auto max-h-[500px] border border-slate-200 dark:border-slate-800/60 shadow-inner">
                {csrDetail.csrPem || 'No structural context blocks available'}
              </pre>
            </div>
          )}
        </div>

        {/* Informative Side Infrastructure Summary Context Box */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <h4 className="uppercase text-[10px] font-bold tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ShieldCheck size={14} /> Pipeline Isolation Context
            </h4>
            <div className="space-y-3 text-xs font-medium">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                <span className="text-slate-400">HSM Module Bound</span>
                <span className="text-emerald-500 font-bold">Hardware-Isolated</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                <span className="text-slate-400">Signature Mechanics</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{csrDetail.signatureAlgorithm}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Security Tracking Hash</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px] truncate max-w-[120px]" title={csrDetail.id}>
                  {csrDetail.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Internal Layout Mini-Elements Refactoring */
const InfoItem = ({ icon, label, value, className = "" }) => (
  <div className={`bg-slate-50 dark:bg-[#161F2E]/60 border border-slate-200/80 dark:border-slate-800/40 rounded-xl p-4 flex flex-col justify-between ${className}`}>
    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">
      {icon}
      {label}
    </div>
    <p className="text-slate-800 dark:text-slate-200 text-xs font-semibold break-all leading-normal">
      {value !== undefined && value !== null && value !== '' ? String(value) : 'Context Undefined'}
    </p>
  </div>
);

const ExtensionBlock = ({ title, items, icon, color = "blue" }) => {
  const badgeColors = {
    blue: 'bg-blue-500/5 text-blue-500 border-blue-500/10',
    emerald: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10',
    slate: 'bg-slate-500/5 text-slate-500 border-slate-500/10',
  }[color] || 'bg-slate-500/5 text-slate-500 border-slate-500/10';

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
        {icon || <ShieldCheck size={14} />}
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items && items.length > 0 ? (
          items.map((item, i) => (
            <div
              key={i}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md border ${badgeColors}`}
            >
              {item}
            </div>
          ))
        ) : (
          <p className="text-slate-400/70 text-xs italic font-medium pl-1">No execution parameters specified.</p>
        )}
      </div>
    </div>
  );
};

export default CSRDetailView;