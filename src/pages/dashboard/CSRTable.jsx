import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Download, Trash2, Upload, RotateCcw,
  Eye, X, Ban, HelpCircle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { getMyCsrs, deleteCsrById, exportCsrById, importCsr, withdrawCsr } from '../../services/csr';
import GenerateCSRModal from '../../components/csr/GenerateCSRModal';
import { Button, Input } from '../../components/ui/Core';

export default function CSRTable({ onSelect }) {
  const [csrList, setCsrList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importAlias, setImportAlias] = useState('');
  const [importPem, setImportPem] = useState('');

  const fetchCsrs = async () => {
    try {
      setLoading(true);
      const data = await getMyCsrs();
      setCsrList(data);
    } catch (err) {
      toast.error('Failed to load PKI signing requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCsrs();
  }, []);

  const filteredData = useMemo(() => {
    return csrList.filter(item => {
      const matchesSearch = 
        item.csrAlias?.toLowerCase().includes(search.toLowerCase()) ||
        item.commonName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [csrList, search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this CSR record?')) return;
    try {
      await deleteCsrById(id);
      toast.success('CSR operational tracking context dropped');
      fetchCsrs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete operation failed');
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this pending CSR? This will stop operators from signing it.')) return;
    try {
      await withdrawCsr(id);
      toast.success('CSR successfully revoked from pipeline');
      fetchCsrs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    }
  };

  const handleExport = async (id, alias) => {
    try {
      const data = await exportCsrById(id);
      const blob = new Blob([data], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${alias}.csr`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Raw block package transferred successfully');
    } catch (err) {
      toast.error('Export payload rendering failed');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importAlias?.trim() || !importPem?.trim()) {
      return toast.error('Alias identifier and structural cryptographic context are required');
    }
    try {
      await importCsr(importAlias.trim(), importPem.trim());
      toast.success('✅ External operational request node attached');
      setShowImportModal(false);
      setImportAlias('');
      setImportPem('');
      fetchCsrs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import workflow processing stopped');
    }
  };

  return (
    <div className="space-y-4 p-6 font-sans">
      {/* Action Toolbar Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Certificate Signing Requests</h1>
          <p className="text-slate-400 text-xs font-medium mt-0.5">Generate, audit, and track asymmetric registration credentials</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCsrs}
            className="p-2.5 bg-white dark:bg-[#161F2E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a2536] transition flex items-center justify-center"
            title="Refresh Grid Context"
          >
            <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-white dark:bg-[#161F2E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a2536] transition flex items-center gap-2"
          >
            <Upload size={14} /> Import CSR Block
          </button>
          
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition shadow-sm shadow-blue-500/10"
          >
            <Plus size={15} /> New Request Node
          </button>
        </div>
      </div>

      {/* Control Pipeline Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records by system alias or subject Common Name (CN)..."
            className="w-full pl-10 pr-4 bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-lg py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none cursor-pointer focus:border-blue-500 transition"
        >
          <option value="ALL">All Lifecycle Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ISSUED">Issued Certificates</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </div>

      {/* Grid Table Frame */}
      <div className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#161F2E] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800/80">
                <th className="px-6 py-3 text-left w-[25%] font-bold">CSR Unique Alias</th>
                <th className="px-6 py-3 text-left w-[25%] font-bold">Subject Common Name (CN)</th>
                <th className="px-6 py-3 text-left w-[20%] font-bold">Structural Scope</th>
                <th className="px-6 py-3 text-left w-[15%] font-bold">Generated Epoch</th>
                <th className="px-6 py-3 text-left w-[15%] font-bold">Status</th>
                <th className="px-6 py-3 text-right w-[120px] pr-8 font-bold text-slate-400/80 tracking-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredData.map((csr) => (
                <tr 
                  key={csr.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-[#151E2C] group transition-colors relative"
                >
                  <td className="px-6 py-3.5 font-bold text-blue-500 truncate">
                    {csr.csrAlias}
                  </td>
                  <td className="px-6 py-3.5 text-slate-800 dark:text-slate-200 font-medium truncate">
                    {csr.commonName || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-6 py-3.5 truncate">
                    <div className="flex flex-col">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">{csr.organization || '-'}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{csr.ca ? 'Intermediate Signer Node' : 'End-Entity Node'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 font-medium">
                    {csr.createdAt ? new Date(csr.createdAt).toLocaleString(undefined, { dateStyle: 'medium' }) : '-'}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center w-fit px-2 py-0.5 text-[10px] font-bold rounded border ${
                        csr.status === 'PENDING' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                        csr.status === 'APPROVED' ? 'bg-blue-500/5 text-blue-500 border-blue-500/10' :
                        csr.status === 'ISSUED' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' :
                        csr.status === 'REJECTED' ? 'bg-red-500/5 text-red-500 border-red-500/10' : 
                        'bg-slate-500/5 text-slate-400 border-slate-500/10'
                      }`}>
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${
                          csr.status === 'PENDING' ? 'bg-amber-500' :
                          csr.status === 'APPROVED' ? 'bg-blue-500' :
                          csr.status === 'ISSUED' ? 'bg-emerald-500' :
                          csr.status === 'REJECTED' ? 'bg-red-500' : 'bg-slate-400'
                        }`} />
                        {csr.status}
                      </span>
                      {csr.status === 'REJECTED' && csr.rejectionReason && (
                        <span className="text-[10px] text-red-400 mt-1 truncate max-w-[140px]" title={csr.rejectionReason}>
                          Err: {csr.rejectionReason}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Floating Action Strip Layer - Revealed dynamically when hovering the row entry */}
                  <td className="px-6 py-3.5 whitespace-nowrap text-right pr-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out">
                      <button
                        onClick={() => onSelect?.(csr)}
                        title="Inspect Structural Specifications"
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      
                      <button
                        onClick={() => handleExport(csr.id, csr.csrAlias)}
                        title="Download Raw PEM Certificate Request Block"
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-md transition-colors"
                      >
                        <Download size={14} />
                      </button>

                      {csr.status === 'PENDING' && (
                        <button
                          onClick={() => handleWithdraw(csr.id)}
                          title="Halt & Revoke Node from Pipeline"
                          className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-400 hover:text-amber-500 rounded-md transition-colors"
                        >
                          <Ban size={14} />
                        </button>
                      )}

                      {csr.status !== 'ISSUED' && (
                        <button
                          onClick={() => handleDelete(csr.id)}
                          title="Purge Operational Metadata Entry"
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty Pipeline State Alert */}
        {filteredData.length === 0 && (
          <div className="py-14 text-center flex flex-col items-center justify-center gap-2">
            <HelpCircle size={24} className="text-slate-300 dark:text-slate-700" />
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">No matching cryptographic signing references deployed.</span>
          </div>
        )}
      </div>

      {/* Frame Interceptor Layer Injection Modals */}
      <AnimatePresence>
        {showGenerateModal && (
          <GenerateCSRModal onClose={() => setShowGenerateModal(false)} onSuccess={fetchCsrs} />
        )}
        {showImportModal && (
          <ImportCSRModal
            onClose={() => setShowImportModal(false)}
            onSubmit={handleImport}
            alias={importAlias}
            setAlias={setImportAlias}
            pem={importPem}
            setPem={setImportPem}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* Redesigned Import CSR Sub-Modal Interface */
function ImportCSRModal({ onClose, onSubmit, alias, setAlias, pem, setPem }) {
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        {/* Modal Header Panel */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#161F2E] border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600/10 rounded-lg flex items-center justify-center">
              <Upload className="text-emerald-500" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Import Signing Certificate Payload</h2>
              <p className="text-[11px] text-slate-400 font-medium">Mount signing requests from separated architecture environments</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body Fields */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 text-xs">
          <Input
            label="TRACKING PIPELINE ALIAS REFERENCE"
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="e.g. dmz-web-server-ca-req"
            required
            className="text-xs"
          />

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
              <FileText size={11} /> Raw PEM Base64 Struct Payload
            </label>
            <textarea
              value={pem}
              onChange={(e) => setPem(e.target.value)}
              rows={8}
              placeholder="-----BEGIN CERTIFICATE REQUEST----&#10;MIIBvTCCASYCAQAwFjEUMBIGA1UEAxMLZXhhbXBsZS5jb20...&#10;-----END CERTIFICATE REQUEST-----"
              className="w-full bg-slate-50 dark:bg-[#182230] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-[11px] text-slate-800 dark:text-slate-300 outline-none focus:border-blue-500 transition resize-none leading-relaxed shadow-inner"
              required
            />
          </div>

          {/* Dialog Options Buttons Footer Toolbar Row */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 text-xs font-semibold py-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 text-xs font-semibold py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Commit Request Node
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}