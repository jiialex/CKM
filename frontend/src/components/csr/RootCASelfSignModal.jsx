import { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  Loader2,
  Info,
  KeyRound,
  FileCode,
  Network,
  Settings,
  Copy,
  Check
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import { getMyKeys } from "../../services/keys";

const KEY_USAGE_OPTIONS = [
  { value: "digitalSignature", label: "Digital Signature" },
  { value: "nonRepudiation", label: "Non Repudiation" },
  { value: "keyEncipherment", label: "Key Encipherment" },
  { value: "dataEncipherment", label: "Data Encipherment" },
  { value: "keyAgreement", label: "Key Agreement" },
  { value: "keyCertSign", label: "Key Cert Sign" },
  { value: "cRLSign", label: "CRL Sign" },
  { value: "encipherOnly", label: "Encipher Only" },
  { value: "decipherOnly", label: "Decipher Only" }
];

const EXTENDED_KEY_USAGE_OPTIONS = [
  { value: "serverAuth", label: "Server Auth" },
  { value: "clientAuth", label: "Client Auth" },
  { value: "codeSigning", label: "Code Signing" },
  { value: "emailProtection", label: "Email Protection" },
  { value: "timeStamping", label: "Time Stamping" },
  { value: "OCSPSigning", label: "OCSP Signing" }
];

const createInitialForm = () => ({
  alias: "",
  keyAlias: "",
  pin: "",
  commonName: "",
  organization: "",
  organizationalUnit: "",
  country: "",
  state: "",
  locality: "",
  email: "",
  validityDays: 3650,
  ca: true,
  pathLength: 0,
  keyUsages: ["keyCertSign", "cRLSign"],
  extendedKeyUsages: [],
  dnsNames: "",
  ipAddresses: "",
  crlUrls: "",
  csrHash: "",
  correlationId: ""
});

const normalizeText = (value) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseList = (value) => (
  value
    ? value.split(/\r?\n|,/).map(item => item.trim()).filter(Boolean)
    : []
);

const RootCASelfSignModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [form, setForm] = useState(createInitialForm);
  
  const [generatedCert, setGeneratedCert] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const data = await getMyKeys();
      setAvailableKeys(data || []);
    } catch (err) {
      console.error(err);
      setAvailableKeys([]);
      toast.error("Failed to load HSM keys from infrastructure inventory.");
    }
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleListValue = (field, value) => {
    setForm(prev => {
      const values = prev[field] || [];
      const exists = values.includes(value);
      return {
        ...prev,
        [field]: exists ? values.filter(item => item !== value) : [...values, value]
      };
    });
  };

  const handleCopyCert = () => {
    if (!generatedCert) return;
    navigator.clipboard.writeText(generatedCert);
    setCopied(true);
    toast.success("Certificate copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    const alias = form.alias.trim();
    const keyAlias = form.keyAlias.trim();
    const pin = form.pin.trim();
    const commonName = form.commonName.trim();
    const validityDays = Number(form.validityDays);
    const pathLength = form.pathLength === "" ? null : Number(form.pathLength);

    if (!alias) return toast.error("Certificate configuration alias is required");
    if (!keyAlias) return toast.error("An explicit HSM engine key alias must be targeted");
    if (!pin) return toast.error("HSM Partition Security PIN is required");
    if (!commonName) return toast.error("Subject Common Name (CN) is required");

    try {
      setLoading(true);

      const payload = {
        alias,
        keyAlias,
        pin,
        commonName,
        organization: normalizeText(form.organization),
        organizationalUnit: normalizeText(form.organizationalUnit),
        country: normalizeText(form.country)?.toUpperCase() || null,
        state: normalizeText(form.state),
        locality: normalizeText(form.locality),
        email: normalizeText(form.email),
        validityDays,
        ca: Boolean(form.ca),
        pathLength,
        keyUsages: form.keyUsages,
        extendedKeyUsages: form.extendedKeyUsages,
        dnsNames: parseList(form.dnsNames),
        ipAddresses: parseList(form.ipAddresses),
        crlUrls: parseList(form.crlUrls),
        csrHash: normalizeText(form.csrHash),
        correlationId: normalizeText(form.correlationId)
      };

      const response = await api.post("/ca/root", payload);
      
      toast.success("Root CA anchor signed and verified successfully");
      
      if (typeof response.data === "object") {
        setGeneratedCert(response.data.certificate || JSON.stringify(response.data, null, 2));
      } else {
        setGeneratedCert(response.data);
      }
      
      setForm(createInitialForm());
    } catch (err) {
      console.error("X509 Engine Initialization Error:", err);
      const serverMsg = err.response?.data?.message || err.response?.data;
      toast.error(typeof serverMsg === "string" ? serverMsg : err.message || "Failed to issue Root CA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-955/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans selection:bg-indigo-500 selection:text-white animate-in fade-in duration-200">
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200/80 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
              <ShieldCheck size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Self-Sign Root Authority Certificate
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Execute a hardware-backed self-signed cryptographic root anchor operation.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Modal Inner Workspace */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent]">
          
          {generatedCert ? (
            /* Inline Success Viewer Screen */
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Active PEM Certificate Output</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopyCert} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-semibold transition-colors">
                    {copied ? <Check size={13} className="text-emerald-600 stroke-[2.5px]" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy Payload"}
                  </button>
                  <button onClick={() => setGeneratedCert(null)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold shadow-sm transition-colors">
                    Issue Another Certificate
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto rounded-xl border border-slate-950 leading-relaxed select-all max-h-96 overflow-y-auto shadow-inner">
                {generatedCert}
              </pre>
            </div>
          ) : (
            /* Multi-Section Form Framework */
            <>
              <Section title="1. Engine Credentials & Vault Identity" icon={<KeyRound size={14} className="text-emerald-600" />} description="Bind targeted structural configuration identifiers to verified active HSM partitions.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Certificate Unique Alias" value={form.alias} onChange={(val) => updateField("alias", val)} placeholder="eg. internal-root-ca-g1" required />
                  <SelectField label="HSM Engine Key Alias" value={form.keyAlias} onChange={(val) => updateField("keyAlias", val)} placeholder="Choose production key engine..." options={availableKeys.map(k => ({ value: k.alias, label: buildKeyOptionLabel(k) }))} required />
                  <Input label="HSM Partition Security PIN" type="password" value={form.pin} onChange={(val) => updateField("pin", val)} placeholder="••••••••" required />
                </div>
                <InlineHint>
                  {availableKeys.length > 0 
                    ? `${availableKeys.length} verifiable active HSM hardware keys discovered for deployment context.`
                    : "Querying infrastructure cluster... Zero hardware keys available."}
                </InlineHint>
              </Section>

              <Section title="2. Distinguished Name (X.509 Subject Context)" icon={<FileCode size={14} className="text-indigo-600" />} description="Construct the authoritative certificate metadata context fields.">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input label="Common Name (CN)" value={form.commonName} onChange={(val) => updateField("commonName", val)} placeholder="e.g. Corporate Root Certificate Authority" required />
                  <Input label="Organization (O)" value={form.organization} onChange={(val) => updateField("organization", val)} placeholder="e.g. Enterprise Security Division" />
                  <Input label="Organizational Unit (OU)" value={form.organizationalUnit} onChange={(val) => updateField("organizationalUnit", val)} placeholder="e.g. PKI Infrastructure Operations" />
                  <Input label="Country Code (C)" value={form.country} onChange={(val) => updateField("country", val)} placeholder="e.g. ET" maxLength={2} />
                  <Input label="State / Province (ST)" value={form.state} onChange={(val) => updateField("state", val)} placeholder="e.g. Addis Ababa" />
                  <Input label="Locality / City (L)" value={form.locality} onChange={(val) => updateField("locality", val)} placeholder="e.g. Addis Ababa" />
                </div>
                <div className="max-w-md">
                  <Input label="Issuer Authority Registered Email" type="email" value={form.email} onChange={(val) => updateField("email", val)} placeholder="pki-admin@domain.com" />
                </div>
              </Section>

              <Section title="3. Authority Structural Policies" icon={<Settings size={14} className="text-violet-600" />} description="Define structural hierarchy levels, path-limits and default lifetime bounds.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <Input label="Validity Context (Days)" type="number" value={form.validityDays} onChange={(val) => updateField("validityDays", val)} min={1} />
                  <Input label="Basic Constraints Path Length" type="number" value={form.pathLength} onChange={(val) => updateField("pathLength", val)} min={0} />
                  <ToggleField label="Is Certificate Authority (CA)" checked={form.ca} onChange={(val) => updateField("ca", val)} description="Sets BasicConstraints CA flag assertions explicitly." />
                </div>
              </Section>

              <Section title="4. Cryptographic Key Usage Policy Extensions" icon={<Network size={14} className="text-amber-600" />} description="Configure operational bounds on underlying hardware keys.">
                <div className="space-y-5">
                  <CheckboxGrid label="Standard Key Usages (X509v3 Extensions)" options={KEY_USAGE_OPTIONS} values={form.keyUsages} onToggle={(val) => toggleListValue("keyUsages", val)} />
                  <CheckboxGrid label="Extended Key Usages (Purpose OIDs)" options={EXTENDED_KEY_USAGE_OPTIONS} values={form.extendedKeyUsages} onToggle={(val) => toggleListValue("extendedKeyUsages", val)} />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                    <ListField label="Subject Alternative Names (DNS Names)" value={form.dnsNames} onChange={(val) => updateField("dnsNames", val)} placeholder={"ca.domain.local\nroot.pki.internal"} />
                    <ListField label="Subject Alternative Names (IP Addresses)" value={form.ipAddresses} onChange={(val) => updateField("ipAddresses", val)} placeholder={"10.0.1.10\n172.16.5.5"} />
                    <ListField label="CRL Distribution Points (CDP URLs)" value={form.crlUrls} onChange={(val) => updateField("crlUrls", val)} placeholder={"http://pki.domain.com/crl/root.crl"} />
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Modal Controls Bar */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-200/80 bg-white shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
            Close Panel
          </button>
          
          {!generatedCert && (
            <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:cursor-not-allowed border border-transparent disabled:border-slate-200 shadow-sm">
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-emerald-500" />
                  <span>Computing Crypto Signatures...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="stroke-[2.5px]" />
                  <span>Sign & Deploy Root Anchor</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* Form Modular Structural Subcomponents */

const Section = ({ title, icon, description, children }) => (
  <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-3.5">
      <div className="flex items-center gap-2.5">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          {title}
        </h3>
      </div>
      <p className="text-[11px] text-slate-500 font-normal">
        {description}
      </p>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const Input = ({ label, value, onChange, type = "text", placeholder, required, min, maxLength }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 uppercase tracking-wide">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      maxLength={maxLength}
      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 w-full transition-all"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder, required }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 w-full h-[38px] transition-all"
    >
      <option value="" className="text-slate-400">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const ToggleField = ({ label, checked, onChange, description }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{label}</span>
    <label className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 py-1.5 h-[38px] cursor-pointer hover:border-slate-300 transition-colors w-full shadow-sm">
      <div className="flex flex-col">
        <span className={`text-xs font-bold ${checked ? "text-emerald-600" : "text-slate-500"}`}>
          {checked ? "TRUE (Assertion Forced)" : "FALSE"}
        </span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-emerald-600 cursor-pointer rounded"
      />
    </label>
    <span className="text-[10px] text-slate-400 italic mt-0.5">{description}</span>
  </div>
);

const CheckboxGrid = ({ label, options, values, onToggle }) => (
  <div className="space-y-2.5">
    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
      {label}
    </h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
      {options.map((option) => {
        const checked = values.includes(option.value);
        return (
          <label key={option.value} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
            checked 
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold shadow-sm" 
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
          }`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option.value)}
              className="h-3.5 w-3.5 accent-emerald-600 rounded border-slate-300 bg-white"
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  </div>
);

const ListField = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder={placeholder}
      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 font-medium placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none w-full leading-normal"
    />
    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
      <Info size={11} className="text-slate-400 stroke-[2.5px]" /> Break multiple lines or commas.
    </span>
  </div>
);

const InlineHint = ({ children }) => (
  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium bg-slate-100 border border-slate-200/60 px-3.5 py-2 rounded-xl w-max max-w-full shadow-sm">
    <Info size={13} className="text-indigo-500 shrink-0 stroke-[2.5px]" />
    <span>{children}</span>
  </div>
);

const buildKeyOptionLabel = (key) => {
  const details = [key.algorithm, key.keySize || key.curveName].filter(Boolean).join(" - ");
  return details ? `${key.alias} (${details})` : key.alias;
};

export default RootCASelfSignModal;