import { useEffect, useState } from "react";
import { X, ShieldCheck, Loader2, KeyRound, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import { getMyKeys } from "../../services/keys";

const createInitialForm = (initialCsrId) => ({
  csrId: initialCsrId || "", 
  caAlias: "",
  pin: "",
  validityDays: 365,
});

const CSRSignModal = ({ onClose, userRole, csrId }) => {
  const [loading, setLoading] = useState(false);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [form, setForm] = useState(() => createInitialForm(csrId));

  // Sync state if csrId updates while modal is open
  useEffect(() => {
    if (csrId) {
      setForm((prev) => ({ ...prev, csrId }));
    }
  }, [csrId]);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const data = await getMyKeys();
      setAvailableKeys(data || []);
    } catch (err) {
      toast.error("Failed to load available cryptographic signing identities.");
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.csrId || !form.caAlias || !form.pin || !form.validityDays) {
      return toast.error("All parameters are required to process signature execution.");
    }

    setLoading(true);

    const isCaOperator = userRole === "ROOT" || userRole === "CA_OPERATOR";
    const endpoint = isCaOperator 
      ? "/ca/intermediate/sign" 
      : "/certificates/sign";

    try {
      const res = await api.post(endpoint, {
        csrId: Number(form.csrId),
        caAlias: form.caAlias.trim(),
        pin: form.pin.trim(),
        validityDays: Number(form.validityDays)
      });

      toast.success(`✅ Transaction approved and signed via ${endpoint}`);
      alert(res.data); 
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cryptographic execution rejected by server security policy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 font-sans selection:bg-indigo-500 selection:text-white animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/80 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-5 bg-white border-b border-slate-200/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
              <ShieldCheck size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Authorize CSR Execution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Security Profile: <span className="text-emerald-600 font-mono text-[11px] font-semibold">{userRole || "STANDARD_USER"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* WORKSPACE CONTENT CONTROLLER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent]">
          
          {/* Target CSR Database ID Field (Read Only Variant) */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Target CSR Database ID
            </label>
            <div className="relative flex items-center w-full">
              <input
                type="text"
                value={form.csrId ? `CSR Record #${form.csrId}` : "No CSR Selected"}
                disabled
                className="w-full bg-slate-100/60 text-slate-700 font-medium cursor-not-allowed border-dashed border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono select-none"
              />
              <Lock size={14} className="absolute right-4 text-slate-400" />
            </div>
          </div>

          {/* Authority Signer Select Flag */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-0.5">
              Authority Signer Key Alias <span className="text-red-500">*</span>
            </label>
            <select
              value={form.caAlias}
              onChange={(e) => updateField("caAlias", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
            >
              <option value="">Select Target Signing Token</option>
              {availableKeys.map((k) => (
                <option key={k.id || k.alias} value={k.alias}>
                  {k.alias} {k.algorithm ? `— (${k.algorithm})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Constraints Workspace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-0.5">
                HSM Partition PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.pin}
                onChange={(e) => updateField("pin", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-0.5">
                Validity Span (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.validityDays}
                onChange={(e) => updateField("validityDays", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                min={1}
              />
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl flex items-center gap-2 transition-all disabled:cursor-not-allowed border border-transparent disabled:border-slate-200 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin text-emerald-500" />
                <span>Processing Sign Call...</span>
              </>
            ) : (
              <>
                <KeyRound size={14} className="stroke-[2.5px]" />
                <span>Authorize Signature</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CSRSignModal;