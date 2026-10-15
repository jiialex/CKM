import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  ChevronDown,
  Plus,
  Info,
  Fingerprint,
  Key,
  Hash,
  Trash2,
} from 'lucide-react';

import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const GenerateCSRModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);

  // =========================================================
  // LOADED KEYS
  // =========================================================
  const [availableKeys, setAvailableKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  // =========================================================
  // CSR METADATA
  // =========================================================
  const [csrAlias, setCsrAlias] = useState('');
  const [selectedKeyAlias, setSelectedKeyAlias] = useState('');
  const [pin, setPin] = useState('');

  // =========================================================
  // SUBJECT DN
  // =========================================================
  const [commonName, setCommonName] = useState('');
  const [organization, setOrganization] = useState('');
  const [organizationalUnit, setOrganizationalUnit] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [locality, setLocality] = useState('');
  const [email, setEmail] = useState('');

  // =========================================================
  // SIGNING
  // =========================================================
  const [signatureAlgorithm, setSignatureAlgorithm] = useState('SHA256withRSA');

  // =========================================================
  // VALIDITY
  // =========================================================
  const [notBefore, setNotBefore] = useState('');
  const [notAfter, setNotAfter] = useState('');

  // =========================================================
  // EXTENSIONS
  // =========================================================
  const [ca, setCa] = useState(false);
  const [pathLength, setPathLength] = useState(0);

  // FIXED: Use exact values expected by backend
  const [selectedKeyUsages, setSelectedKeyUsages] = useState([
    'digitalSignature',
    'keyEncipherment',
  ]);

  const [selectedEkus, setSelectedEkus] = useState(['serverAuth']);

  const [dnsNames, setDnsNames] = useState([]);
  const [ipAddresses, setIpAddresses] = useState([]);
  const [crlUrls, setCrlUrls] = useState([]);

  const [ocspUrl, setOcspUrl] = useState('');
  const [caIssuersUrl, setCaIssuersUrl] = useState('');

  const [subjectKeyIdentifier, setSubjectKeyIdentifier] = useState(true);
  const [authorityKeyIdentifier, setAuthorityKeyIdentifier] = useState(true);

  // =========================================================
  // FETCH USER KEYS
  // =========================================================
  useEffect(() => {
    let isMounted = true;
    const fetchKeys = async () => {
      try {
        setLoadingKeys(true);
        const res = await api.get('/hsm/my-keys');
        if (isMounted) {
          setAvailableKeys(res.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load cryptographic keys from HSM');
      } finally {
        if (isMounted) setLoadingKeys(false);
      }
    };

    fetchKeys();
    return () => { isMounted = false; };
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================
  const toggleKeyUsage = (usage) => {
    setSelectedKeyUsages(prev =>
      prev.includes(usage) ? prev.filter(v => v !== usage) : [...prev, usage]
    );
  };

  const toggleEku = (eku) => {
    setSelectedEkus(prev =>
      prev.includes(eku) ? prev.filter(v => v !== eku) : [...prev, eku]
    );
  };

  const updateDnsName = (index, value) => {
    const updated = [...dnsNames];
    updated[index] = value;
    setDnsNames(updated);
  };

  const removeDnsName = (index) => {
    setDnsNames(prev => prev.filter((_, i) => i !== index));
  };

  const updateIpAddress = (index, value) => {
    const updated = [...ipAddresses];
    updated[index] = value;
    setIpAddresses(updated);
  };

  const removeIpAddress = (index) => {
    setIpAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const updateCrlUrl = (index, value) => {
    const updated = [...crlUrls];
    updated[index] = value;
    setCrlUrls(updated);
  };

  const removeCrlUrl = (index) => {
    setCrlUrls(prev => prev.filter((_, i) => i !== index));
  };

  // =========================================================
  // GENERATE CSR
  // =========================================================
  const handleGenerateCSR = async () => {
    if (!selectedKeyAlias || selectedKeyAlias === 'Select an existing key...') {
      toast.error('Please select a valid signing key');
      return;
    }
    if (!csrAlias.trim()) {
      toast.error('CSR Alias is required');
      return;
    }
    if (!commonName.trim()) {
      toast.error('Common Name (CN) is required');
      return;
    }
    if (!pin) {
      toast.error('HSM PIN is required');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        alias: selectedKeyAlias,
        csrAlias: csrAlias.trim(),
        commonName: commonName.trim(),
        organization: organization.trim(),
        organizationalUnit: organizationalUnit.trim(),
        country: country.trim().toUpperCase(),
        state: state.trim(),
        locality: locality.trim(),
        email: email.trim(),
        signatureAlgorithm,
        pin,
        keyUsages: selectedKeyUsages,
        extendedKeyUsages: selectedEkus,
        dnsNames: dnsNames.filter(v => v && v.trim() !== ''),
        ipAddresses: ipAddresses.filter(v => v && v.trim() !== ''),
        ca,
        pathLength: ca ? Number(pathLength) : null,
        notBefore: notBefore ? new Date(notBefore).toISOString() : null,
        notAfter: notAfter ? new Date(notAfter).toISOString() : null,
        ocspUrl: ocspUrl.trim() || null,
        caIssuersUrl: caIssuersUrl.trim() || null,
        crlUrls: crlUrls.filter(v => v && v.trim() !== ''),
        subjectKeyIdentifier,
        authorityKeyIdentifier
      };

      const res = await api.post('/csr/generate', payload);
      console.log('CSR Generated:', res.data);
      toast.success('CSR Generated Successfully');
      onClose();
    } catch (err) {
      console.error('CSR Error:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to generate CSR');
    } finally {
      setLoading(false);
    }
  };

  // X.500 DN Preview
  const dnParts = [];
  if (commonName) dnParts.push(`CN=${commonName.trim()}`);
  if (organization) dnParts.push(`O=${organization.trim()}`);
  if (organizationalUnit) dnParts.push(`OU=${organizationalUnit.trim()}`);
  if (country) dnParts.push(`C=${country.trim().toUpperCase()}`);
  if (state) dnParts.push(`ST=${state.trim()}`);
  if (locality) dnParts.push(`L=${locality.trim()}`);
  if (email) dnParts.push(`EMAILADDRESS=${email.trim()}`);
  const x500Preview = dnParts.join(', ');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 font-sans selection:bg-indigo-500 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-slate-50 w-full max-w-[1000px] h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/80"
      >
        {/* HEADER */}
        <div className="px-8 py-5 bg-white border-b border-slate-200/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <Plus size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Generate Certificate Signing Request
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Compose a cryptographic PKCS#10 request securely bound to an HSM asset.
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

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent]">
          
          {/* CSR METADATA & KEY SELECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section icon={<Info size={14} />} title="CSR Metadata">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormGroup label="CSR Alias" required value={csrAlias} onChange={setCsrAlias} placeholder="api-prod-2026" />
                <FormGroup label="PIN" required type="password" value={pin} onChange={setPin} placeholder="Enter HSM PIN" />
              </div>
            </Section>

            <Section icon={<Key size={14} />} title="Existing Key Selection">
              <FormGroup
                label="Signing Key Alias"
                required
                type="select"
                value={selectedKeyAlias}
                onChange={setSelectedKeyAlias}
                options={['Select an existing key...', ...availableKeys.map(k => k.alias)]}
              />
              {loadingKeys && (
                <div className="flex items-center gap-2 px-1 py-1 mt-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Loading keys from HSM...</p>
                </div>
              )}
            </Section>
          </div>

          {/* SUBJECT DN */}
          <Section icon={<Fingerprint size={14} />} title="Subject Distinguished Name">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormGroup label="Common Name (CN)" required value={commonName} onChange={setCommonName} placeholder="api.company.com" />
              <FormGroup label="Organization (O)" value={organization} onChange={setOrganization} placeholder="Company Ltd" />
              <FormGroup label="Org. Unit (OU)" value={organizationalUnit} onChange={setOrganizationalUnit} placeholder="Security" />
              <FormGroup label="Country (C)" value={country} onChange={setCountry} placeholder="ET" />
              <FormGroup label="State (ST)" value={state} onChange={setState} placeholder="Addis Ababa" />
              <FormGroup label="Locality (L)" value={locality} onChange={setLocality} placeholder="Addis Ababa" />
              <div className="sm:col-span-3">
                <FormGroup label="Email" value={email} onChange={setEmail} placeholder="security@company.com" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <FormGroup label="X.500 Distinguished Name Preview" value={x500Preview} disabled />
            </div>
          </Section>

          {/* EXTENSIONS */}
          <Section icon={<ShieldCheck size={14} />} title="X.509 V3 Extensions">
            
            <Accordion label="Basic Constraints" defaultOpen>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  <input type="checkbox" checked={ca} onChange={(e) => setCa(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                  Is Certificate Authority (CA: TRUE)
                </label>
                <div className={`flex items-center gap-3 transition-opacity ${ca ? 'opacity-100' : 'opacity-40'}`}>
                  <span className="text-xs font-bold text-slate-600 tracking-wide">Path Length Constraint</span>
                  <input
                    type="number"
                    disabled={!ca}
                    value={pathLength}
                    onChange={(e) => setPathLength(e.target.value)}
                    className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </Accordion>

            <Accordion label="Validity Period" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormGroup label="Not Before" type="datetime-local" value={notBefore} onChange={setNotBefore} />
                <FormGroup label="Not After" type="datetime-local" value={notAfter} onChange={setNotAfter} />
              </div>
            </Accordion>

            {/* KEY USAGE */}
            <Accordion label="Key Usage Flags" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {['digitalSignature', 'nonRepudiation', 'keyEncipherment', 'dataEncipherment', 'keyAgreement', 'keyCertSign', 'cRLSign'].map(use => (
                  <label key={use} className="flex items-center gap-3 text-sm text-slate-700 font-semibold cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedKeyUsages.includes(use)}
                      onChange={() => toggleKeyUsage(use)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                    />
                    {use}
                  </label>
                ))}
              </div>
            </Accordion>

            {/* EKU */}
            <Accordion label="Extended Key Usage (EKU)" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {['serverAuth', 'clientAuth', 'codeSigning', 'emailProtection', 'OCSPSigning', 'timeStamping'].map(eku => (
                  <label key={eku} className="flex items-center gap-3 text-sm text-slate-700 font-semibold cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedEkus.includes(eku)}
                      onChange={() => toggleEku(eku)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                    />
                    {eku}
                  </label>
                ))}
              </div>
            </Accordion>

            {/* SAN */}
            <Accordion label="Subject Alternative Names (SAN)" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">DNS Names</h4>
                  {dnsNames.map((dns, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input value={dns} onChange={(e) => updateDnsName(index, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400" placeholder="*.company.com" />
                      <button onClick={() => removeDnsName(index)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  ))}
                  <button onClick={() => setDnsNames([...dnsNames, ''])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Plus size={14} /> Add DNS
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">IP Addresses</h4>
                  {ipAddresses.map((ip, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input value={ip} onChange={(e) => updateIpAddress(index, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400" placeholder="192.168.1.10" />
                      <button onClick={() => removeIpAddress(index)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  ))}
                  <button onClick={() => setIpAddresses([...ipAddresses, ''])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Plus size={14} /> Add IP
                  </button>
                </div>
              </div>
            </Accordion>

            {/* AIA & CRL */}
            <Accordion label="Authority Information Access (AIA)" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormGroup label="OCSP URL" value={ocspUrl} onChange={setOcspUrl} placeholder="http://ocsp.company.com" />
                <FormGroup label="CA Issuers URL" value={caIssuersUrl} onChange={setCaIssuersUrl} placeholder="http://pki.company.com/ca.crt" />
              </div>
            </Accordion>

            <Accordion label="CRL Distribution Points" defaultOpen>
              <div className="space-y-3">
                {crlUrls.map((url, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input value={url} onChange={(e) => updateCrlUrl(index, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400" placeholder="http://pki.company.com/crl.crl" />
                    <button onClick={() => removeCrlUrl(index)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                ))}
                <button onClick={() => setCrlUrls([...crlUrls, ''])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Plus size={14} /> Add CRL URL
                </button>
              </div>
            </Accordion>

            <Accordion label="Key Identifiers" defaultOpen>
              <div className="flex flex-col sm:flex-row gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-3 text-sm text-slate-700 font-semibold cursor-pointer select-none">
                  <input type="checkbox" checked={subjectKeyIdentifier} onChange={e => setSubjectKeyIdentifier(e.target.checked)} className="w-4 h-4" />
                  Subject Key Identifier
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-700 font-semibold cursor-pointer select-none">
                  <input type="checkbox" checked={authorityKeyIdentifier} onChange={e => setAuthorityKeyIdentifier(e.target.checked)} className="w-4 h-4" />
                  Authority Key Identifier
                </label>
              </div>
            </Accordion>
          </Section>

          {/* SIGNING */}
          <Section icon={<Hash size={14} />} title="Signing Parameters">
            <div className="max-w-md">
              <FormGroup
                label="Signature Algorithm"
                type="select"
                value={signatureAlgorithm}
                onChange={setSignatureAlgorithm}
                options={['SHA256withRSA', 'SHA384withRSA', 'SHA512withRSA', 'SHA256withECDSA']}
              />
            </div>
          </Section>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 bg-white border-t border-slate-200/80 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-400 max-w-md">
            All cryptographic operations are performed inside the HSM boundary.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200">
              Cancel
            </button>
            <button
              onClick={handleGenerateCSR}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>Generating CSR...</>
              ) : (
                'Generate CSR'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Reusable Components
const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 pb-3">
      <span>{icon}</span>
      {title}
    </div>
    {children}
  </div>
);

const FormGroup = ({ label, required, value, onChange, placeholder, type = 'text', options = [], disabled = false }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-0.5">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative w-full">
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm transition-colors outline-none placeholder:text-slate-400 ${disabled ? 'bg-slate-100/60 text-slate-700 font-medium cursor-not-allowed border-dashed' : 'bg-white text-slate-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
          placeholder={placeholder}
        />
      )}
    </div>
  </div>
);

const Accordion = ({ label, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden mb-3 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider"
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-t border-slate-200/80 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenerateCSRModal;