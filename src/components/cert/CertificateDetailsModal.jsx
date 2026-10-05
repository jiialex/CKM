import React, { useEffect, useState } from "react";
import {
  X,
  Shield,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  RefreshCw,
  Lock,
  Calendar
} from "lucide-react";
import api from "../../api/axios";
import { getMyKeys } from "../../services/keys"; 

const API_BASE = "/certificates"; // Standardized relative path for axios instance consistency

export default function CertificateDetailsModal({
  certId,
  cert,
  onClose,
}) {
  const [certificate, setCertificate] = useState(cert || null);
  const [loading, setLoading] = useState(false);
  const [activeSubModal, setActiveSubModal] = useState(null);
  const [trustChain, setTrustChain] = useState([]); // Dynamic Trust Chain State

  const [verifyResult, setVerifyResult] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState("KEY_COMPROMISE");
  
  // Renewal & HSM Key State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [renewForm, setRenewForm] = useState({
    caAlias: "",
    pin: "",
    validityDays: 365,
  });

  const [isChainExpanded, setIsChainExpanded] = useState(true);

  useEffect(() => {
    const id = certId || cert?.id || certificate?.id;
    if (!id) return;
    
    // Initial data pipeline load
    fetchCertificate(id);
    fetchTrustChain(id);
  }, [certId, cert]);

  const fetchCertificate = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/certificates/${id}`);
      setCertificate(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH DYNAMIC TRUST CHAIN
  // =====================================================
  const fetchTrustChain = async (id) => {
    try {
      const response = await api.get(`/certificates/${id}/chain`);
      setTrustChain(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to retrieve dynamic chain path validation hierarchy", err);
      setTrustChain([]);
    }
  };

  useEffect(() => {
    if (showRenewModal) {
      fetchKeys();
    }
  }, [showRenewModal]);

  const fetchKeys = async () => {
    try {
      const data = await getMyKeys();
      setAvailableKeys(data);
      if (data && data.length > 0) {
        const firstKey = data[0].alias || data[0];
        setRenewForm(prev => ({ ...prev, caAlias: firstKey }));
      }
    } catch (err) {
      console.error(err);
      setAvailableKeys([]);
    }
  };

  const verifyCertificate = async () => {
    try {
      const response = await api.get(`/certificates/${certificate.id}/verify`);
      setVerifyResult(response.data);
      setActiveSubModal("verify-result");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Verification failed");
    }
  };

  const downloadPem = async () => {
    try {
      const response = await api.get(`/certificates/${certificate.id}/pem`, { responseType: 'text' });
      const blob = new Blob([response.data], { type: "application/x-pem-file" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${certificate.alias}.pem`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download PEM");
    }
  };

  const revokeCertificate = async () => {
    try {
      await api.post(`/certificates/${certificate.id}/revoke`, null, {
        params: { reason: revocationReason },
      });
      alert("Certificate permanently revoked");
      setShowRevokeModal(false);
      fetchCertificate(certificate.id);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Revocation failed");
    }
  };

  const renewCertificate = async () => {
    const { caAlias, pin, validityDays } = renewForm;
    if (!caAlias || !pin || !validityDays) {
      alert("CA Alias, PIN and Validity Days are required");
      return;
    }
    try {
      setLoading(true);
      await api.post(`/certificates/${certificate.id}/renew`, null, {
        params: { caAlias, pin, validityDays }
      });
      alert("Certificate renewed successfully");
      setShowRenewModal(false);
      fetchCertificate(certificate.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Renewal failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !certificate) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white px-6 py-4 rounded-lg shadow-xl text-sm font-medium text-slate-700 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          Processing HSM Cryptographic Operation...
        </div>
      </div>
    );
  }

  const validityPercentage = certificate.validityPercentage?.toFixed(1) || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-[650px] flex flex-col text-slate-800 overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <Shield size={18} className="fill-indigo-100" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Metadata Viewer</span>
              <h2 className="text-sm font-bold text-slate-800">{certificate.alias}</h2>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-1.5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)]">

         {/* DYNAMIC HIERARCHY TRUST CHAIN */}
<div className="flex flex-col">
  <label className="text-xs font-bold text-slate-600 mb-2 tracking-wide uppercase">
    Certificate Trust Path
  </label>

  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[100px] shadow-inner">
    <div className="text-xs space-y-1">
      {trustChain.length === 0 ? (
        <div className="flex items-center gap-2 py-1.5 px-2 text-slate-500 italic">
          <HelpCircle size={14} />
          <span>No chain validation path found.</span>
        </div>
      ) : (
        trustChain.map((node, index) => {
          const isLastElement = index === trustChain.length - 1;
          
          // State-driven conditional visibility logic
          // If the chain is collapsed (isChainExpanded === false), hide everything below index 0
          if (!isChainExpanded && index > 0) return null;

          if (!isLastElement) {
            // CA Node Layer (Root or Intermediate)
            return (
              <div 
                key={node.id || index} 
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-100 cursor-pointer select-none text-slate-700 font-medium"
                style={{ marginLeft: `${index * 16}px` }} // Dynamically pushes intermediates inside roots
                onClick={() => {
                  // Only allow toggling the whole structure from the primary root click
                  if (index === 0) setIsChainExpanded(!isChainExpanded);
                }}
              >
                <span className="text-slate-400">
                  {index === 0 ? (
                    isChainExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  ) : (
                    <ChevronDown size={14} className="text-slate-300" /> // Visual indicator for nested steps
                  )}
                </span>
                <Shield size={14} className="text-amber-500 fill-amber-50 mx-0.5" />
                <span className="truncate">{node.alias || node.commonName || "Authority Identifier"}</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono ml-auto">CA</span>
              </div>
            );
          } else {
            // Target Leaf Node Layout
            return (
              <div 
                key={node.id || index} 
                className="py-1"
                style={{ marginLeft: `${index * 16}px`, paddingLeft: '8px', borderLeft: '2px solid #E2E8F0' }} // Standardized tree guidelines
              >
                <div className="flex items-center gap-2 py-1.5 px-3 bg-indigo-600 text-white rounded-md font-semibold shadow-sm shadow-indigo-100">
                  <FileText size={14} />
                  <span className="truncate">{node.alias}</span>
                  <span className="text-[10px] bg-indigo-500 text-indigo-100 px-1.5 py-0.2 rounded uppercase ml-auto">
                    Leaf
                  </span>
                </div>
              </div>
            );
          }
        })
      )}
    </div>
  </div>
</div>

          {/* ATTRIBUTES GRID */}
          <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 items-center text-xs">
            <label className="text-right font-semibold text-slate-500">Subject:</label>
            <div className="relative flex items-center">
              <input
                readOnly
                value={certificate.subject || ""}
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-2 pr-8 h-8 text-slate-700 outline-none truncate"
              />
              <span className="absolute right-2 text-slate-400"><HelpCircle size={14} /></span>
            </div>

            <label className="text-right font-semibold text-slate-500">Issuer Authority:</label>
            <input readOnly value={certificate.issuerAlias || ""} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 h-8 text-slate-700" />

            <label className="text-right font-semibold text-slate-500">Serial Number:</label>
            <input readOnly value={certificate.serialNumber || ""} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 h-8 text-slate-600 font-mono text-[11px]" />

            <label className="text-right font-semibold text-slate-500">Profile Type:</label>
            <input readOnly value={certificate.type || ""} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 h-8 text-slate-700" />

            <label className="text-right font-semibold text-slate-500">Operational Status:</label>
            <div className="w-full">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                certificate.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : certificate.status === "REPLACED"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  certificate.status === "ACTIVE" ? "bg-emerald-500" : certificate.status === "REPLACED" ? "bg-amber-500" : "bg-rose-500"
                }`}></span>
                {certificate.status}
              </span>
            </div>

            <label className="text-right font-semibold text-slate-500">Signature Suite:</label>
            <input readOnly value={certificate.signatureAlgorithm || ""} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 h-8 text-slate-600 font-mono" />

            <label className="text-right font-semibold text-slate-500">Issued On:</label>
            <input readOnly value={certificate.createdAt || ""} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 h-8 text-slate-600" />

            <label className="text-right font-semibold text-slate-500">Expiration:</label>
            <input readOnly value={certificate.expiryDate || ""} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 h-8 text-slate-600" />

            <label className="text-right font-semibold text-slate-500">Lifetime Progression:</label>
            <div className="relative w-full h-5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden flex items-center">
              <div
                className={`h-full transition-all duration-500 ${validityPercentage > 85 ? "bg-rose-500" : "bg-indigo-600"}`}
                style={{ width: `${validityPercentage}%` }}
              />
              <span className="absolute inset-0 flex justify-center items-center text-[10px] font-bold text-slate-700 mix-blend-difference">
                {validityPercentage}% Life Elapsed
              </span>
            </div>
          </div>

          {/* ACTION TOOLBAR */}
          <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-slate-100">
            <button onClick={downloadPem} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Download PEM
            </button>

            <button onClick={() => setActiveSubModal("pem")} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              View PEM
            </button>

            <button onClick={verifyCertificate} className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
              Verify Status
            </button>

            {certificate.status === "ACTIVE" && (
              <button onClick={() => setShowRenewModal(true)} className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                Renew Lifecycle
              </button>
            )}

            {certificate.status !== "REVOKED" && (
              <button onClick={() => setShowRevokeModal(true)} className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
                Revoke
              </button>
            )}
          </div>
        </div>

        {/* DIALOG FOOTER */}
        <div className="flex justify-end px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm">
            Close View
          </button>
        </div>

        {/* SUBMODAL: PEM VIEW */}
        {activeSubModal === "pem" && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-[550px] rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">PEM Formatted Text</h3>
                <button onClick={() => setActiveSubModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4">
                <textarea readOnly value={certificate.certificatePem || ""} className="w-full h-[320px] border border-slate-200 bg-slate-50 rounded-lg p-3 text-[11px] font-mono text-slate-600 outline-none resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL: RENEWAL */}
        {showRenewModal && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-[440px] rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Renew Certificate Credentials</h3>
                </div>
                <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <Shield size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">HSM Signer Verification</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5 leading-relaxed">
                      Select an authorized CA cryptographic key pair alias stored in your PKCS11 provider context.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">CA Token Key Alias</label>
                  <select
                    value={renewForm.caAlias}
                    onChange={(e) => setRenewForm({ ...renewForm, caAlias: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
                  >
                    {availableKeys.length === 0 ? (
                      <option value="" disabled>No HSM slots discovered...</option>
                    ) : (
                      availableKeys.map((key, idx) => {
                        const aliasValue = key.alias || key;
                        return <option key={idx} value={aliasValue}>{aliasValue}</option>;
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">HSM Token Protection PIN</label>
                  <div className="relative flex items-center">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={renewForm.pin}
                      onChange={(e) => setRenewForm({ ...renewForm, pin: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-sm font-mono tracking-widest"
                    />
                    <Lock size={12} className="absolute left-2.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Validity Boundary (Days)</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={renewForm.validityDays}
                      onChange={(e) => setRenewForm({ ...renewForm, validityDays: parseInt(e.target.value) || "" })}
                      className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                    />
                    <Calendar size={12} className="absolute left-2.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setShowRenewModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 bg-white rounded-md hover:bg-slate-50">
                  Discard
                </button>
                <button onClick={renewCertificate} className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 shadow-sm transition-colors">
                  Execute Renewal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL: REVOCATION */}
        {showRevokeModal && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-[420px] rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Revoke Certificate</h3>
                <button onClick={() => setShowRevokeModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-lg p-3">
                  <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-800">Critical Action Notification</p>
                    <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">
                      This action will broadcast a status change across CRL / OCSP structures.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Revocation Reason Code</label>
                  <select
                    value={revocationReason}
                    onChange={(e) => setRevocationReason(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
                  >
                    <option value="UNSPECIFIED">Unspecified</option>
                    <option value="KEY_COMPROMISE">Key Compromise</option>
                    <option value="CA_COMPROMISE">CA Compromise</option>
                    <option value="AFFILIATION_CHANGED">Affiliation Changed</option>
                    <option value="SUPERSEDED">Superseded</option>
                    <option value="CESSATION_OF_OPERATION">Cessation Of Operation</option>
                    <option value="CERTIFICATE_HOLD">Certificate Hold</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setShowRevokeModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 bg-white rounded-md hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={revokeCertificate} className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-md hover:bg-rose-700 shadow-sm">
                  Confirm Revocation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL: VERIFICATION OUTCOME */}
        {activeSubModal === "verify-result" && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-[360px] rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 text-center">
                {certificate.status === "REVOKED" || (verifyResult && verifyResult.status === "REVOKED") ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3 border border-rose-100">
                      <AlertTriangle size={24} className="fill-rose-50" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Validation Failure</h3>
                    <p className="text-xs font-semibold text-rose-600 mt-1 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 inline-block">
                      Certificate is Revoked
                    </p>
                  </div>
                ) : verifyResult && (verifyResult.isValid || verifyResult.status === "ACTIVE" || verifyResult === true) ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
                      <CheckCircle size={24} className="fill-emerald-50" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Validation Verified</h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 inline-block">
                      Certificate is Valid
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
                      <AlertTriangle size={24} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Validation Untrusted</h3>
                    <p className="text-xs font-semibold text-slate-600 mt-1 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                      Expired or Invalid Path
                    </p>
                  </div>
                )}

                <button onClick={() => setActiveSubModal(null)} className="mt-5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}