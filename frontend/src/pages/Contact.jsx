import { Mail, Phone, Clock, Key } from 'lucide-react';
import { GlassCard } from '../components/ui/Core';

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col justify-start px-6 py-20 bg-gradient-to-b from-[#F4F7F9] to-[#E9EFF2] dark:from-[#0B151D] dark:to-[#0F1E29] font-sans text-[#334756] dark:text-slate-300 pt-28 max-w-2xl mx-auto w-full space-y-6">
      
      {/* HEADER SECTION */}
      <div className="space-y-1.5 border-b border-[#CBDCE9]/60 dark:border-slate-800/60 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1E3A4C] dark:text-white">
          System Support
        </h1>
        <p className="text-[#5C7282] dark:text-slate-400 text-xs font-medium">
          Direct communication paths for authenticated infrastructure administrators.
        </p>
      </div>

      {/* PRIMARY CHANNELS STACK */}
      <div className="space-y-3">
        
        {/* EMAIL CHANNEL */}
        <GlassCard className="p-4 border-[#CBDCE9] dark:border-slate-800/80 bg-white/90 dark:bg-[#122430]/90 shadow-sm rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#224257]/5 dark:bg-sky-500/10 text-[#224257] dark:text-sky-400 rounded-lg shrink-0">
              <Mail size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#5C7282] dark:text-slate-400">
                Operations Desk
              </p>
              {/* FIXED: was the fake placeholder support@pkisecure.io */}
              <p className="text-xs font-bold text-[#1E3A4C] dark:text-white select-all mt-0.5">
                pkickmsupport@gmail.com
              </p>
            </div>
          </div>
          <p className="text-[10px] text-[#9BB1C1] dark:text-slate-500 font-medium bg-[#F4F7F9] dark:bg-[#0B151D] px-2.5 py-1 rounded-md">
            Non-Emergency
          </p>
        </GlassCard>

        {/* PHONE CHANNEL */}
        <GlassCard className="p-4 border-[#CBDCE9] dark:border-slate-800/80 bg-white/90 dark:bg-[#122430]/90 shadow-sm rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
              <Phone size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600 dark:text-rose-400">
                SecOps Hotline
              </p>
              {/* FIXED: was the fake placeholder +1 (888) PKI-SAFE */}
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                +251 98 241 5293
              </p>
            </div>
          </div>
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold bg-rose-500/5 px-2.5 py-1 rounded-md">
            Critical Only
          </p>
        </GlassCard>
      </div>

      {/* SERVICE STATUS & ASSURANCE */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 rounded-xl border border-[#CBDCE9] dark:border-slate-800/80 bg-[#F4F7F9]/40 dark:bg-[#0B151D]/20 flex items-start gap-2.5">
          <Clock size={14} className="text-[#3A7094] dark:text-sky-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#1E3A4C] dark:text-white">Availability</p>
            <p className="text-[11px] text-[#5C7282] dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
              Active engineering monitoring 24/7/365 for platform faults.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#CBDCE9] dark:border-slate-800/80 bg-[#F4F7F9]/40 dark:bg-[#0B151D]/20 flex items-start gap-2.5">
          <Key size={14} className="text-[#3A7094] dark:text-sky-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#1E3A4C] dark:text-white">Signed Requests</p>
            <p className="text-[11px] text-[#5C7282] dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
              Verify sensitive change requests out-of-band using profile keys.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
