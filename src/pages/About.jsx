import { useMemo, useState } from 'react';
import {
  Activity,
  Cpu,
  FileCheck2,
  Layers3,
  Lock,
  Network,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { GlassCard } from '../components/ui/Core';

export default function About() {
  const [activeSection, setActiveSection] = useState(0);

  const stack = useMemo(() => [
    { 
      name: "Spring Boot Core", 
      desc: "Orchestration layer managing workflow validation, reactive pipeline routines, and multi-tenant domain mapping.", 
      icon: <Cpu size={16} />, 
      metric: "JDK 21 LTS" 
    },
    { 
      name: "Cryptographic Identity", 
      desc: "Stateful JWT access tokens containing strict, immutable permission profiles and role claims.", 
      icon: <Lock size={16} />, 
      metric: "HS256 Layered" 
    },
    { 
      name: "Immutable Audit Ledger", 
      desc: "Structured security telemetry tracking system modifications and administrative actions in real time.", 
      icon: <Activity size={16} />, 
      metric: "JSON Structured" 
    },
    { 
      name: "Threat Correlator", 
      desc: "Aggregates anomalous ingress traffic, mapping cluster threats to identities.", 
      icon: <AlertTriangle size={16} />, 
      metric: "Egress Watch" 
    }
  ], []);

  const documentationSections = useMemo(() => [
    {
      title: "Identity & Layer Access",
      subtitle: "Securing Administrative Perimeter",
      icon: <Lock size={16} />,
      body: "The system begins with verified identities. Administrative nodes sign in to produce asymmetric JWT sessions, which are parsed locally to map granular authorization limits. Operators can review pending credentials, auditors can isolate forensic evidence snapshots, and end-users safely request certificate generation within explicit namespaces.",
      properties: ["Role-Based Access Control (RBAC)", "Token Refresh Protocols", "Session Tracking Matrix"]
    },
    {
      title: "HSM Boundary Protections",
      subtitle: "Root Key Infrastructure Separation",
      icon: <ShieldCheck size={16} />,
      body: "Private key material is isolated within a Hardware Security Module simulation architecture. Key creation protocols prevent administrative visibility of raw key pairs. Instead, references use secure unique resource aliases during subsequent signature tasks, Root CA generation, and subordinate tree signing operations.",
      properties: ["Cryptographic Alias Isolation", "PKCS#11 API Bindings", "No-Export Key Policies"]
    },
    {
      title: "CSR Ingress Processing",
      subtitle: "Structured Public-Key Verification",
      icon: <FileCheck2 size={16} />,
      body: "Certificate Signing Requests move through the lifecycle pipeline as distinct cryptographically signed objects. Once standard validation asserts integrity, an active signing operator binds the public key parameters against the designated issuing CA node, mapping specific validity periods and critical extensions into a fresh X.509 structure.",
      properties: ["ASN.1 Structure Parsing", "Extension Enforcement Filters", "X.509 Serialization"]
    },
    {
      title: "Lifecycle & Revocation Trees",
      subtitle: "Dynamic Credential Invalidation",
      icon: <Layers3 size={16} />,
      body: "Issued certificates remain continuously monitorable throughout their lifetime. The environment provides mechanisms to handle certificate invalidation, instantly appending unique serial paths onto signed Certificate Revocation Lists (CRLs). This provides relying parties with clear, time-bounded trust parameters during peer validation loops.",
      properties: ["CRL Delta Compilation", "PEM Array Formatting", "Serial Invalidation Logs"]
    },
    {
      title: "Audit & Forensic Collection",
      subtitle: "Tamper-Resistant Event Signatures",
      icon: <Activity size={16} />,
      body: "Platform operations require auditable telemetry to support compliance guarantees. Every system change, key assignment, and policy update triggers an immediate write event to an immutable audit ledger. These event blocks preserve execution context, correlation tokens, and client identifiers to ensure clear visibility.",
      properties: ["Correlation Trace Fields", "Immutable Write Sequences", "Audit Package Export"]
    },
    {
      title: "Threat & Traffic Intelligence",
      subtitle: "Defensive Operations Dashboard",
      icon: <AlertTriangle size={16} />,
      body: "The network layer constantly aggregates structural access telemetry to flag edge-case errors, rapid authentication cycles, and unmapped client traffic. Correlating these threat anomalies against active certificate paths allows network defenders to neutralize potential attack vectors before trust material is compromised.",
      properties: ["Ingress Anomaly Mapping", "Threat Severity Scoring", "Administrative Lockdowns"]
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7F9] to-[#E9EFF2] dark:from-[#0B151D] dark:to-[#0F1E29] font-sans text-[#334756] dark:text-slate-300 pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        
        {/* TOP COMPONENT HEADER */}
        <div className="mb-14 border-b border-[#CBDCE9]/60 dark:border-slate-800/60 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#224257]/5 dark:bg-sky-500/10 border border-[#CBDCE9] dark:border-sky-500/20 text-[#224257] dark:text-sky-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">
              <Network size={12} />
              <span>Platform Blueprint & Core Logic</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1E3A4C] dark:text-white">
              Architecture & Documentation
            </h1>
            <p className="text-[#5C7282] dark:text-slate-400 text-xs font-medium max-w-xl leading-relaxed">
              Technical overview of the cryptographic pipeline. This system unifies zero-trust identity verification, active HSM token mappings, and high-fidelity audit layers.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-[#9BB1C1] bg-white/40 dark:bg-[#122430]/40 border border-[#CBDCE9]/50 dark:border-slate-800/60 p-2 rounded-lg">
            <Terminal size={12} className="text-[#3A7094] dark:text-sky-400" />
            <span>SYS_VER: 2.4.0-RELEASE</span>
          </div>
        </div>

        {/* FOUR-COLUMN COMPONENT METRIC GRID */}
        <div className="mb-12 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map((item) => (
            <GlassCard key={item.name} className="p-4 border-[#CBDCE9] dark:border-slate-800/80 bg-white/90 dark:bg-[#122430]/90 shadow-sm rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-[#1E3A4C] dark:text-white mb-2">
                  <div className="p-1.5 bg-[#224257]/5 dark:bg-sky-500/10 text-[#3A7094] dark:text-sky-400 rounded-md">
                    {item.icon}
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">{item.name}</h3>
                </div>
                <p className="text-[#5C7282] dark:text-slate-400 text-[11px] leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
              <div className="text-[9px] font-mono font-bold text-[#9BB1C1] dark:text-slate-500 tracking-wide pt-1 border-t border-[#F4F7F9] dark:border-slate-800/40">
                {item.metric}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* SIDEBAR NAVIGATION LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* CONTROL RACK SIDEBAR */}
          <div className="space-y-1.5 bg-white/40 dark:bg-[#122430]/30 border border-[#CBDCE9]/50 dark:border-slate-800/50 p-2 rounded-xl md:sticky md:top-24">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#9BB1C1] dark:text-slate-500 px-3 py-1">
              Architecture Index
            </p>
            {documentationSections.map((section, idx) => {
              const isSelected = activeSection === idx;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveSection(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-[#224257] text-white dark:bg-sky-500 dark:text-[#0B151D] shadow-sm"
                      : "text-[#5C7282] dark:text-slate-400 hover:text-[#1E3A4C] dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#122430]/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 ${isSelected ? "text-white dark:text-[#0B151D]" : "text-[#3A7094] dark:text-sky-400"}`}>
                      {section.icon}
                    </span>
                    <span className="truncate">{section.title}</span>
                  </div>
                  <ArrowRight size={12} className={`shrink-0 opacity-40 transition-transform ${isSelected ? "translate-x-0.5 opacity-100" : "-translate-x-1"}`} />
                </button>
              );
            })}
          </div>

          {/* DYNAMIC BLUEPRINT INSPECTOR BOX */}
          <div className="md:col-span-2">
            <GlassCard className="p-6 md:p-8 border-[#CBDCE9] dark:border-slate-800/80 bg-white/90 dark:bg-[#122430]/90 shadow-sm rounded-xl min-h-[340px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-[#CBDCE9]/40 dark:border-slate-800/40 pb-4">
                  <div className="p-2.5 bg-[#224257] dark:bg-sky-500 text-white dark:text-[#0B151D] rounded-xl shadow-sm">
                    {documentationSections[activeSection].icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#1E3A4C] dark:text-white">
                      {documentationSections[activeSection].title}
                    </h2>
                    <p className="text-[10px] text-[#3A7094] dark:text-sky-400 font-bold uppercase tracking-wider mt-0.5">
                      {documentationSections[activeSection].subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#5C7282] dark:text-slate-300 font-medium leading-relaxed">
                  {documentationSections[activeSection].body}
                </p>
              </div>

              {/* SECTION DEPENDENCY ASSIGNMENTS */}
              <div className="mt-6 pt-5 border-t border-[#CBDCE9]/40 dark:border-slate-800/40">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-[#9BB1C1] dark:text-slate-500 mb-2">
                  Layer Specifications & Controls
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {documentationSections[activeSection].properties.map((prop, i) => (
                    <span 
                      key={i} 
                      className="text-[10px] font-semibold px-2.5 py-1 bg-[#F4F7F9] dark:bg-[#0B151D] text-[#224257] dark:text-slate-300 border border-[#CBDCE9]/40 dark:border-slate-800/60 rounded-md"
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

        </div>

      </div>
    </div>
  );
}