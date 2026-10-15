import { useEffect, useState } from "react";
import { X, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { getCertificates } from "../../services/certificates";
import { approveCsr } from "../../services/csr";

// Asks the CA_OPERATOR which CA certificate should sign this CSR, and that
// CA's HSM PIN, before calling approveCsr. Needed because approving a CSR
// now performs real signing on the backend — it can no longer happen with
// just an id and a window.confirm().
const ApproveCsrModal = ({ csrId, onClose, onApproved }) => {
  const [caList, setCaList] = useState([]);
  const [caAlias, setCaAlias] = useState("");
  const [caPin, setCaPin] = useState("");
  const [loadingCaList, setLoadingCaList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCas() {
      try {
        const certs = await getCertificates();
        // Only CA certificates (ca === true) can sign a CSR.
        const cas = (certs || []).filter((c) => c.ca === true);
        if (!cancelled) {
          setCaList(cas);
          if (cas.length > 0) setCaAlias(cas[0].alias);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load CA certificates.");
      } finally {
        if (!cancelled) setLoadingCaList(false);
      }
    }

    loadCas();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!caAlias) {
      setError("Select a CA certificate to sign with.");
      return;
    }
    if (!caPin) {
      setError("Enter that CA's HSM PIN.");
      return;
    }

    try {
      setSubmitting(true);
      await approveCsr(csrId, caAlias, caPin);
      onApproved();
    } catch (err) {
      // Surface the backend's actual message (e.g. "CA private key not
      // found... check the PIN") instead of a generic failure.
      const backendMessage = err?.response?.data?.message || err?.response?.data || err.message;
      setError(typeof backendMessage === "string" ? backendMessage : "Failed to approve CSR.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Approve &amp; Sign CSR</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Signing CA
            </label>
            {loadingCaList ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 size={16} className="animate-spin" /> Loading CA certificates...
              </div>
            ) : caList.length === 0 ? (
              <p className="text-sm text-amber-600">
                No CA certificates found. You need at least one certificate with ca=true before you can approve CSRs.
              </p>
            ) : (
              <select
                value={caAlias}
                onChange={(e) => setCaAlias(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {caList.map((ca) => (
                  <option key={ca.alias} value={ca.alias}>
                    {ca.alias} ({ca.commonName || ca.subject || "no CN"})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              CA HSM PIN
            </label>
            <input
              type="password"
              value={caPin}
              onChange={(e) => setCaPin(e.target.value)}
              placeholder="Enter the CA's HSM PIN"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingCaList || caList.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {submitting ? "Signing..." : "Approve & Sign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveCsrModal;
