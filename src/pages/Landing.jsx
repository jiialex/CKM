import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import caHierarchy from "../assets/ca-hierarchy.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F4F7F9] dark:bg-[#0B151D] text-[#334756] dark:text-slate-300 font-sans relative flex flex-col justify-between overflow-hidden">
      {/* Structural accent backdrop blur elements */}
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-[#E1ECF4]/50 to-transparent dark:from-slate-900/20" />

      <nav className="flex justify-between items-center p-6 max-w-7xl w-full mx-auto border-b border-[#CBDCE9]/50 dark:border-slate-800/40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-[#224257] text-white rounded-lg">
            <ShieldCheck size={16} />
          </div>
          <span className="text-sm font-bold tracking-tight text-[#224257] dark:text-white">
            Nexus<span className="text-[#3A7094] dark:text-sky-400">PKI</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link to="/login" className="text-[#5C7282] hover:text-[#224257] dark:hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="bg-[#224257] hover:bg-[#1A3344] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="px-6 py-16 my-auto max-w-2xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-extrabold text-[#1E3A4C] dark:text-white tracking-tight sm:text-5xl leading-tight">
            Cryptographic Node Management
          </h1>

          <p className="text-xs sm:text-sm text-[#5C7282] dark:text-slate-400 mt-4 max-w-lg leading-relaxed font-medium">
            Deploy root authority keys, cross-verify inbound CSR templates, sign production identity chains, and inspect network logs cleanly.
          </p>

          <div className="mt-8">
            <Link to="/login">
              <button className="bg-[#224257] hover:bg-[#1A3344] text-white text-xs font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 shadow-sm transition-all active:scale-98">
                Connect Control Console
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
        className="px-6 py-16 max-w-4xl mx-auto text-center"
      >
        <h2 className="text-xl font-bold text-[#1E3A4C] dark:text-white tracking-tight sm:text-2xl">
          Certificate Authority Hierarchy
        </h2>
        <p className="text-xs sm:text-sm text-[#5C7282] dark:text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed font-medium">
          A single Root CA anchors trust for two Intermediate CAs, each issuing
          scoped end-entity certificates.
        </p>
        <img
          src={caHierarchy}
          alt="Certificate Authority Hierarchy Diagram"
          className="mt-8 w-full rounded-xl border border-[#CBDCE9]/50 dark:border-slate-800/40 shadow-sm"
        />
      </motion.section>

      <footer className="p-6 text-center text-[10px] font-semibold tracking-wider text-[#9BB1C1] uppercase border-t border-[#CBDCE9]/30 dark:border-slate-800/20">
        Nexus Trust Infrastructure Shell
      </footer>
    </div>
  );
}
