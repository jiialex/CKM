import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Cpu, ShieldAlert, Binary } from 'lucide-react';
import { Button, Input } from '../ui/Core';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export default function GenerateKeyModal({ onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    alias: '',
    algorithm: 'RSA',
    keySize: 2048,
    curveName: 'secp256r1',
    password: '',
    signingAlgorithm: 'SHA256withRSA'
  });

  // Automatically sync robust operational parameter defaults on primitive type change
  useEffect(() => {
    if (form.algorithm === 'RSA') {
      setForm(prev => ({
        ...prev,
        signingAlgorithm: 'SHA256withRSA',
        keySize: prev.keySize || 2048
      }));
    } else {
      setForm(prev => ({
        ...prev,
        signingAlgorithm: 'SHA256withECDSA',
        curveName: 'secp256r1'
      }));
    }
  }, [form.algorithm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.alias?.trim() || !form.password) {
      return toast.error("Alias and HSM PIN token are required");
    }

    if (form.password.length < 4) {
      return toast.error("PIN must be at least 4 verification characters");
    }

    setLoading(true);

    try {
      const payload = {
        alias: form.alias.trim(),
        algorithm: form.algorithm,
        keySize: form.algorithm === 'RSA' ? Number(form.keySize) : 0,
        curveName: form.algorithm === 'EC' ? form.curveName : null,
        password: form.password,
        signingAlgorithm: form.signingAlgorithm
      };

      await api.post('/hsm/generate', payload);
      toast.success("✅ Crypto block successfully committed to Hardware Vault");
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data || "Failed to generate key payload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-md z-50 p-4 animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header Block Panel */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#161F2E] border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center">
              <Cpu className="text-blue-500" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Generate HSM Engine Key</h2>
              <p className="text-[11px] text-slate-400 font-medium">Provision isolated cryptographic root partition</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* Input parameters field stack map form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <Input
            label="KEY UNIQUE ALIAS REFERENCE"
            placeholder="e.g. enterprise-root-ca-2026"
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
            required
            className="text-xs"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Asymmetric Algorithm</label>
              <select
                className="w-full bg-slate-50 dark:bg-[#182230] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-white font-medium focus:border-blue-500 outline-none transition-colors"
                value={form.algorithm}
                onChange={(e) => setForm({ ...form, algorithm: e.target.value })}
              >
                <option value="RSA">RSA Factorization</option>
                <option value="EC">Elliptic Curve (ECC)</option>
              </select>
            </div>

            {form.algorithm === 'RSA' ? (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Modulus Size (Bits)</label>
                <select
                  className="w-full bg-slate-50 dark:bg-[#182230] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-white font-mono focus:border-blue-500 outline-none transition-colors"
                  value={form.keySize}
                  onChange={(e) => setForm({ ...form, keySize: e.target.value })}
                >
                  <option value={2048}>2048-bit (Standard)</option>
                  <option value={3072}>3072-bit (High)</option>
                  <option value={4096}>4096-bit (Critical)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Mathematical Curve</label>
                <div className="w-full bg-slate-50 dark:bg-[#182230] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-blue-500 font-mono font-bold flex items-center gap-1.5">
                  <Binary size={12} /> secp256r1
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Digest Signer Schema</label>
            <select
              className="w-full bg-slate-50 dark:bg-[#182230] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-white font-mono focus:border-blue-500 outline-none transition-colors"
              value={form.signingAlgorithm}
              onChange={(e) => setForm({ ...form, signingAlgorithm: e.target.value })}
            >
              {form.algorithm === 'RSA' ? (
                <>
                  <option value="SHA256withRSA">SHA256withRSA</option>
                  <option value="SHA384withRSA">SHA384withRSA</option>
                  <option value="SHA512withRSA">SHA512withRSA</option>
                </>
              ) : (
                <>
                  <option value="SHA256withECDSA">SHA256withECDSA</option>
                  <option value="SHA384withECDSA">SHA384withECDSA</option>
                  <option value="SHA512withECDSA">SHA512withECDSA</option>
                </>
              )}
            </select>
          </div>

          <div className="relative">
            <Input
              label="HARDWARE SLOT PIN (AUTHORIZATION TOKEN)"
              type={showPassword ? "text" : "password"}
              placeholder="Enter cryptographic slot PIN code"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="text-xs pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Infrastructure Security Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-3 rounded-lg flex items-start gap-2.5">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={14} />
            <p className="text-[10px] font-medium text-amber-800 dark:text-amber-400 leading-normal">
              Private materials are generated inside the protected physical hardware bound module. Keys can never be extracted in plaintext format.
            </p>
          </div>

          {/* Action Toolbar buttons strip row layout */}
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
              disabled={loading}
              className="flex-1 text-xs font-semibold py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {loading ? "Generating Payload..." : "Generate Key Node"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}