import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  Radar,
  ScrollText,
  Layers3,
  CheckCircle2
} from 'lucide-react';

import { GlassCard } from "../components/ui/GlassCard";
import { Button } from '../components/ui/Button';
import caHierarchy from "../assets/ca_hierarchy_pro.png";

// Logic intact: unchanged array configurations
const features = [
  {
    title: "Identity And Session Security",
    desc: "JWT-based authentication, role-aware access control, and secure operator workflows across the PKI platform.",
    icon: <LockKeyhole className="text-[#3A7094] dark:text-sky-400" size={16} />
  },
  {
    title: "Certificate Lifecycle Control",
    desc: "Generate keys, process CSRs, issue certificates, revoke trust chains, and publish CRLs from one control surface.",
    icon: <ShieldCheck className="text-[#3A7094] dark:text-sky-400" size={16} />
  },
  {
    title: "Audit And Compliance Visibility",
    desc: "Centralized event logs, correlation tracing, high-risk event review, and exportable evidence for governance teams.",
    icon: <ScrollText className="text-[#3A7094] dark:text-sky-400" size={16} />
  },
  {
    title: "Threat Monitoring",
    desc: "Security alerts, severity review, and response workflows that complement PKI operations in real time.",
    icon: <Radar className="text-[#3A7094] dark:text-sky-400" size={16} />
  }
];

const documentationHighlights = [
  "How identities, operators, and auditors move through the platform",
  "How HSM keys, CSRs, certificates, and revocations connect together",
  "How audit logs and threat monitoring support compliance and investigations"
];

export const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7F9] to-[#E9EFF2] dark:from-[#0B151D] dark:to-[#0F1E29] font-sans text-[#334756] dark:text-slate-300 pt-28 pb-20 px-6 overflow-hidden">
      
      {/* Soft Light-Blue Dynamic Backdrops */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_15%,_rgba(225,236,244,0.7),_transparent_45%)] dark:bg-none" />

      {/* Main Structural Frame: Split Grid Setup */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2.3fr] gap-8 items-start">
        
        {/* Left Side: Editorial Typography Context */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6 lg:sticky lg:top-28"
        >
          <div className="space-y-3.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CBDCE9] dark:border-slate-800 bg-white/80 dark:bg-[#1E3A4C]/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#3A7094] dark:text-sky-400 shadow-sm backdrop-blur-sm">
              <Layers3 size={13} className="text-[#3A7094] dark:text-sky-400" />
              Enterprise Trust Infrastructure
            </div>

            <h1 className="app-heading text-3xl font-extrabold tracking-tight text-[#1E3A4C] dark:text-white sm:text-4xl leading-tight">
              Secure digital trust with a full PKI control plane.
            </h1>

            <p className="app-muted text-xs leading-relaxed text-[#5C7282] dark:text-slate-400 font-medium">
              This platform combines authentication, HSM-backed key workflows, CSR processing,
              certificate issuance, revocation handling, audit visibility, and threat monitoring
              into one operational security system for enterprise environments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/signup">
              <Button variant="primary" className="bg-[#224257] hover:bg-[#1A3344] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-transform active:scale-98">
                Initialize Security Node
              </Button>
            </Link>

            <Link to="/about">
              <Button variant="secondary" className="bg-white/80 dark:bg-slate-900/60 hover:bg-white border border-[#CBDCE9] dark:border-slate-800 text-[#224257] dark:text-slate-300 text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-colors">
                <span className="inline-flex items-center gap-2">
                  View Documentation
                  <ArrowRight size={14} />
                </span>
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Right Side: Certificate Authority Hierarchy Diagram (replaces System Metric Ledger) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-[#122430] border border-[#CBDCE9] dark:border-slate-800/80 rounded-2xl shadow-md p-6"
        >
          <div className="text-center mb-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#CBDCE9] dark:border-slate-800 bg-white/80 dark:bg-[#1E3A4C]/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#3A7094] dark:text-sky-400 shadow-sm backdrop-blur-sm">
              <Layers3 size={13} className="text-[#3A7094] dark:text-sky-400" />
              Trust Hierarchy
            </div>
            <h2 className="app-heading text-2xl font-extrabold tracking-tight text-[#1E3A4C] dark:text-white leading-tight">
              Certificate Authority Hierarchy
            </h2>
            <p className="app-muted mt-3 text-xs leading-relaxed font-medium text-[#5C7282] dark:text-slate-400 max-w-lg mx-auto">
              A single Root CA anchors trust for two Intermediate CAs, each issuing
              scoped end-entity certificates across TLS, code signing, client
              authentication, and device identity use cases.
            </p>
          </div>

          <img
            src={caHierarchy}
            alt="Certificate Authority Hierarchy Diagram"
            className="w-full rounded-xl"
          />
        </motion.div>
      </div>

      {/* Capabilities Overview Section */}
      <section className="max-w-7xl mx-auto mt-16 border-t border-[#CBDCE9]/60 dark:border-slate-800/60 pt-16">
        <h2 className="app-heading mb-10 text-center text-xl font-bold text-[#1E3A4C] dark:text-white uppercase tracking-wider">
          Security Capabilities
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <motion.div key={feature.title} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <GlassCard className="h-full p-5 bg-white/70 dark:bg-[#122430]/60 border border-[#CBDCE9] dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-xl bg-[#E1ECF4] dark:bg-[#1E3A4C] p-2.5">
                    {feature.icon}
                  </div>
                  <h3 className="app-heading mb-2 text-sm font-bold text-[#1E3A4C] dark:text-white">{feature.title}</h3>
                  <p className="app-muted text-xs leading-relaxed font-medium text-[#5C7282] dark:text-slate-400">{feature.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Documentation Section */}
      <section className="mx-auto max-w-6xl mt-16">
        <GlassCard className="relative overflow-hidden p-6 md:p-8 rounded-2xl border border-[#CBDCE9] dark:border-slate-800/80 bg-white dark:bg-[#122430]">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                <ScrollText size={13} />
                Documentation
              </div>
              <h2 className="app-heading text-2xl font-extrabold tracking-tight text-[#1E3A4C] dark:text-white leading-tight">
                The documentation now explains the system, not just the icon.
              </h2>
              <p className="app-muted mt-3 text-xs leading-relaxed font-medium text-[#5C7282] dark:text-slate-400">
                The architecture section now describes how operators generate HSM keys,
                create or review CSRs, sign certificates, publish revocations, inspect audit
                trails, and respond to threat events. It is written as a walkthrough of how the
                platform actually works rather than a shallow feature list.
              </p>
            </div>

            <div className="space-y-3">
              {documentationHighlights.map((item) => (
                <div key={item} className="bg-[#F4F7F9] dark:bg-[#0B151D] border border-[#CBDCE9]/60 dark:border-slate-800/60 flex items-start gap-3 rounded-xl px-4 py-3 shadow-inner">
                  <CheckCircle2 size={15} className="mt-0.5 text-emerald-500 flex-shrink-0" />
                  <p className="app-heading text-xs leading-normal font-semibold text-[#334756] dark:text-slate-300">{item}</p>
                </div>
              ))}

              <Link to="/about" className="inline-flex w-full pt-1">
                <Button variant="secondary" className="w-full py-2.5 text-xs font-bold text-[#224257] dark:text-slate-300 border-[#CBDCE9] bg-white dark:bg-[#1E3A4C] hover:bg-slate-50 shadow-sm rounded-xl">
                  Open Deep System Explanation
                </Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

export default Home;
