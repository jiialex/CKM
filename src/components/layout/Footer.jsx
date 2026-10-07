import { ShieldCheck, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { FaLinkedin } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white/90 dark:bg-[#122430]/90 border-t border-[#CBDCE9] dark:border-slate-800/80 pt-14 pb-8 font-sans text-[#334756] dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* TOP MATRIX */}
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* BRAND COMPONENT */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-[#3A7094] dark:text-sky-500" />
              <span className="text-base font-extrabold tracking-tight text-[#1E3A4C] dark:text-white uppercase">
                PKI Certificate <span className="text-[#3A7094] dark:text-sky-500">& Key Management</span>
              </span>
            </Link>

            <p className="text-[#5C7282] dark:text-slate-400 text-xs leading-relaxed max-w-xs font-medium">
              Advanced Public Key Infrastructure for enterprise trust chains. Secure, automated, and decoupled.
            </p>

            <div className="inline-flex items-center space-x-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span>OPERATIONAL</span>
            </div>
          </div>

          {/* PLATFORM LINKS */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#1E3A4C] dark:text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs font-medium text-[#5C7282] dark:text-slate-400">
              <li><Link to="/keys" className="transition-colors hover:text-[#3A7094] dark:hover:text-sky-400">Certificate Manager</Link></li>
              {/* FIXED: was "/audit", which doesn't exist in App.jsx routes */}
              <li><Link to="/dashboard/logs" className="transition-colors hover:text-[#3A7094] dark:hover:text-sky-400">Audit Logging</Link></li>
              {/* REMOVED: "Documentation" — no real docs page to link to yet */}
            </ul>
          </div>

          {/* ARCHITECTURE LINKS */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#1E3A4C] dark:text-white uppercase tracking-wider">Security</h4>
            <ul className="space-y-2 text-xs font-medium text-[#5C7282] dark:text-slate-400">
              {/* FIXED: was "/architecture", which doesn't exist in App.jsx routes */}
              <li><Link to="/dashboard/pki" className="transition-colors hover:text-[#3A7094] dark:hover:text-sky-400">Trust Model</Link></li>
              {/* FIXED: was "/compliance", which doesn't exist in App.jsx routes */}
              <li><Link to="/dashboard/pki" className="transition-colors hover:text-[#3A7094] dark:hover:text-sky-400">Compliance Vault</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-[#3A7094] dark:hover:text-sky-400">Incident Gateway</Link></li>
            </ul>
          </div>

          {/* NETWORKS & CHANNELS */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-[#1E3A4C] dark:text-white uppercase tracking-wider">Connect</h4>
            <div className="flex space-x-3.5 text-[#5C7282] dark:text-slate-400">
              {/* REMOVED: GitHub icon — not wanted here */}
              {/* REMOVED: Twitter icon — no account */}
              {/* FIXED: real LinkedIn profile instead of "#" */}
              <a
                href="https://www.linkedin.com/in/tesfanesh-teshome-b7499033a"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[#1E3A4C] dark:hover:text-white"
              >
                <FaLinkedin className="h-4 w-4" />
              </a>
              {/* FIXED: real mailto instead of routing to /contact */}
              <a
                href="mailto:pkickmsupport@gmail.com"
                className="transition-colors hover:text-[#1E3A4C] dark:hover:text-white"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* METRICS & LEADER REGULATION BASE */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#CBDCE9]/60 dark:border-slate-800/40 pt-6 text-[10px] font-bold tracking-wider text-[#5C7282] dark:text-slate-500 md:flex-row uppercase">
          <p>© {currentYear} PKI Security Platform. All access logged.</p>
          <div className="flex space-x-4">
            <span className="px-2 py-0.5 bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border border-[#CBDCE9]/50 dark:border-slate-800/60 rounded-md">ISO 27001</span>
            <span className="px-2 py-0.5 bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border border-[#CBDCE9]/50 dark:border-slate-800/60 rounded-md">SOC2 Type II</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
