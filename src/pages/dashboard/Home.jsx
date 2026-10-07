import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  Users,
  FileSignature,
  Cpu,
  CheckCircle2
} from 'lucide-react';

import { GlassCard } from "../../components/ui/GlassCard";
import { getCertificates, getRevokedCertificates } from "../../services/certificates";
import { getMyKeys } from "../../services/keys";
import { getUsers } from "../../services/users";
import { getAuditStats } from "../../services/audit";

function StatBadge({ label, value, tone }) {
  const toneClass = {
    good: "text-emerald-500",
    bad: "text-rose-500",
    warn: "text-amber-500",
    neutral: "text-[#5C7282] dark:text-slate-400"
  }[tone] || "text-[#5C7282] dark:text-slate-400";

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BB1C1]">{label}</p>
      <p className={`text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function buildLinePath(values, w, h, pad = 8) {
  const max = Math.max(...values, 1);
  const stepX = (w - pad * 2) / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export const Home = () => {
  const [certificates, setCertificates] = useState([]);
  const [revoked, setRevoked] = useState([]);
  const [keys, setKeys] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditTrend, setAuditTrend] = useState(null); // null until we know real shape
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const results = await Promise.allSettled([
        getCertificates(),
        getRevokedCertificates(),
        getMyKeys(),
        getUsers(),
        getAuditStats(),
      ]);

      if (cancelled) return;

      const [certsRes, revokedRes, keysRes, usersRes, auditRes] = results;
      const errors = [];

      if (certsRes.status === "fulfilled") setCertificates(certsRes.value);
      else errors.push("certificates");

      if (revokedRes.status === "fulfilled") setRevoked(revokedRes.value);
      else errors.push("revoked certificates");

      if (keysRes.status === "fulfilled") setKeys(keysRes.value);
      else errors.push("keys");

      if (usersRes.status === "fulfilled") setUsers(usersRes.value);
      else errors.push("users");

      // TODO: confirm the real shape of getAuditStats() in your Network tab and
      // adjust this parsing. Currently attempts a couple of common shapes and
      // otherwise leaves the trend chart empty rather than showing fake numbers.
      if (auditRes.status === "fulfilled") {
        const data = auditRes.value;
        if (Array.isArray(data) && data.every((n) => typeof n === "number")) {
          setAuditTrend(data);
        } else if (Array.isArray(data) && data.length && "count" in data[0]) {
          setAuditTrend(data.map((d) => d.count));
        } else {
          setAuditTrend(null); // unrecognized shape — render empty state instead of guessing
        }
      } else {
        errors.push("audit stats");
      }

      setLoadErrors(errors);
      setLoading(false);
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // ---- Derived stats ----
  const certTotal = certificates.length;
  const revokedTotal = revoked.length;
  const activeTotal = Math.max(certTotal - revokedTotal, 0);

  const keyTotal = keys.length;
  // Confirmed: HsmController only exposes GET /api/hsm/my-keys (scoped to the
  // logged-in user) — there is no system-wide keys endpoint, so this card is
  // intentionally labeled "My Key Rings" rather than a system total.
  // TODO: the algorithm field name/values below are still a guess since
  // /my-keys returned [] for the test account — confirm against a real
  // KeyEntity once an account with keys calls this endpoint.
  const rsaCount = keys.filter((k) =>
    String(k.algorithm ?? k.type ?? "").toUpperCase().includes("RSA")
  ).length;
  const eccCount = keys.filter((k) =>
    String(k.algorithm ?? k.type ?? "").toUpperCase().match(/EC|ECC/)
  ).length;

  const userTotal = users.length;
  // Confirmed from /api/users response: role is one of "ADMIN", "CA_OPERATOR", "USER"
  const operatorCount = users.filter((u) =>
    u.role === "ADMIN" || u.role === "CA_OPERATOR"
  ).length;
  const endEntityCount = users.filter((u) => u.role === "USER").length;

  const summaryCards = useMemo(() => ([
    {
      label: "Certificates Estate",
      icon: <ShieldCheck size={18} className="text-[#3A7094] dark:text-sky-400" />,
      value: certTotal,
      badge: certTotal > 0 ? { text: "Active Live" } : null,
      stats: [
        { label: "Active Status", value: activeTotal, tone: "good" },
        { label: "Revoked (CRL)", value: revokedTotal, tone: revokedTotal > 0 ? "bad" : "neutral" }
      ]
    },
    {
      label: "My Key Rings",
      icon: <KeyRound size={18} className="text-[#3A7094] dark:text-sky-400" />,
      value: keyTotal,
      badge: keyTotal > 0 ? { text: "FIPS Managed" } : null,
      stats: [
        { label: "Algorithm RSA", value: rsaCount, tone: "good" },
        { label: "Algorithm ECC", value: eccCount, tone: "neutral" }
      ]
    },
    {
      label: "Identities Scope",
      icon: <Users size={18} className="text-[#3A7094] dark:text-sky-400" />,
      value: userTotal,
      badge: null,
      stats: [
        { label: "CA Operators / Admins", value: operatorCount, tone: "warn" },
        { label: "End-Entity Users", value: endEntityCount, tone: "good" }
      ]
    }
  ]), [certTotal, activeTotal, revokedTotal, keyTotal, rsaCount, eccCount, userTotal, operatorCount, endEntityCount]);

  const algoTotal = rsaCount + eccCount || 1;
  const rsaPct = (rsaCount / algoTotal) * 100;

  const trendValues = auditTrend ?? [];
  const trendMonths = trendValues.length
    ? trendValues.map((_, i) => `M${i + 1}`) // TODO: replace with real month labels once shape is confirmed
    : [];
  const w = 560, h = 220;
  const linePath = trendValues.length ? buildLinePath(trendValues, w, h) : "";

  if (loading) {
    return (
      <div className="pt-6 text-sm font-medium text-[#5C7282] dark:text-slate-400">
        Loading operations overview…
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {loadErrors.length > 0 && (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 px-4 py-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
          Couldn't load: {loadErrors.join(", ")}. Showing partial data.
        </div>
      )}

      {/* Summary Cards Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {summaryCards.map((card) => (
          <GlassCard
            key={card.label}
            className="p-5 bg-white dark:bg-[#122430] border border-[#CBDCE9] dark:border-slate-800/80 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#E1ECF4] dark:bg-[#1E3A4C] p-2">{card.icon}</div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5C7282] dark:text-slate-400">
                  {card.label}
                </p>
              </div>
              {card.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {card.badge.text}
                </span>
              )}
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A4C] dark:text-white mb-4">{card.value}</p>
            <div className="grid grid-cols-2 gap-3 border-t border-[#E1ECF4] dark:border-slate-800 pt-3">
              {card.stats.map((s) => (
                <StatBadge key={s.label} {...s} />
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Chart + Algorithm Density Row */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <GlassCard className="p-6 bg-white dark:bg-[#122430] border border-[#CBDCE9] dark:border-slate-800/80 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BB1C1] mb-1">
            Trust Infrastructure Posture
          </p>
          <h3 className="text-base font-bold text-[#1E3A4C] dark:text-white mb-4">
            Balance Summary (Audit Log Dist.)
          </h3>
          {trendValues.length ? (
            <>
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
                <path d={linePath} fill="none" stroke="#3A7094" strokeWidth="2.5" strokeLinecap="round" />
                {trendValues.map((v, i) => {
                  const max = Math.max(...trendValues, 1);
                  const stepX = (w - 16) / Math.max(trendValues.length - 1, 1);
                  const x = 8 + i * stepX;
                  const y = h - 8 - (v / max) * (h - 16);
                  return <circle key={i} cx={x} cy={y} r="3.5" fill="#3A7094" />;
                })}
              </svg>
              <div className="flex justify-between text-[10px] font-semibold text-[#9BB1C1] mt-1">
                {trendMonths.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs font-medium text-[#9BB1C1]">
              No audit trend data available yet — check getAuditStats() response shape.
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6 bg-white dark:bg-[#122430] border border-[#CBDCE9] dark:border-slate-800/80 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-[#1E3A4C] dark:text-white">Algorithm Density</h3>
          <p className="text-[11px] text-[#5C7282] dark:text-slate-400 mb-4">
            Active cryptographic distributions in key rings
          </p>
          <div className="flex-1 flex items-center justify-center">
            <div
              className="relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#3A7094 0% ${rsaPct}%, #1E3A4C ${rsaPct}% 100%)`
              }}
            >
              <div className="absolute inset-3 rounded-full bg-white dark:bg-[#122430] flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-[#1E3A4C] dark:text-white">{keyTotal}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#9BB1C1]">Total Keys</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs font-semibold text-[#5C7282] dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3A7094] inline-block" /> RSA ({rsaCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A4C] inline-block" /> ECC ({eccCount})
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: CSR Workflow / Recent Trail / Hardware Engine
          NOTE: these three panels are not wired yet — no CSR-queue-count,
          audit-trail-feed, or HSM-status endpoint was in the services files
          shared so far. Send me those (e.g. a csr.js / security.js service)
          and I'll wire this row the same way as the cards above. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 bg-white dark:bg-[#122430] border border-[#CBDCE9] dark:border-slate-800/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BB1C1]">Signing Pipeline</p>
              <h3 className="text-sm font-bold text-[#1E3A4C] dark:text-white">CSR Workflow Desk</h3>
            </div>
            <FileSignature size={16} className="text-[#5C7282] dark:text-slate-400" />
          </div>
          <div className="text-center py-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BB1C1] mb-1">
              Awaiting Operator Signature
            </p>
            <p className="text-3xl font-extrabold text-[#1E3A4C] dark:text-white">—</p>
            <p className="text-[11px] text-[#5C7282] dark:text-slate-400 mt-2">
              Not wired yet — needs a CSR queue endpoint
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-white dark:bg-[#122430] border border-[#CBDCE9] dark:border-slate-800/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BB1C1]">Real-Time Trace</p>
              <h3 className="text-sm font-bold text-[#1E3A4C] dark:text-white">Recent Security Trail</h3>
            </div>
          </div>
          <p className="text-[11px] text-[#5C7282] dark:text-slate-400">
            Not wired yet — needs the audit log feed endpoint (getAuditLogs likely fits; send its response shape).
          </p>
        </GlassCard>

        <GlassCard className="p-6 bg-[#0B151D] border border-slate-800 rounded-2xl shadow-sm text-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hardware Engine</p>
              <h3 className="text-sm font-bold text-white">SoftHSM Cluster</h3>
            </div>
            <div className="rounded-full bg-slate-500/10 border border-slate-500/30 p-1.5">
              <Cpu size={14} className="text-slate-400" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Not wired yet — no HSM/cluster-status endpoint was in the services shared. Send that service file and I'll finish this panel.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Home;
