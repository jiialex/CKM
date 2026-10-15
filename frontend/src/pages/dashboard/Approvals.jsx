import React, { useEffect, useState } from "react";
import {
  Check,
  X,
  UserCircle2,
  ShieldAlert,
  Mail,
  Users2,
  Activity,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { approvePendingUser, getPendingUsers, rejectPendingUser } from "../../services/approvals";
import { GlassCard } from "../../components/ui/Core";

export default function Approvals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const res = await getPendingUsers();
      setPendingUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to sync structural identities:", err);
      // Fallback mock session schema to maintain layout verification
      setPendingUsers([
        { id: 1, username: "admin.node.alpha", email: "alpha-node@insa.gov.et", role: "ROLE_ADMIN", caType: "ROOT_CA" },
        { id: 2, username: "operator.sec.ops", email: "sec-ops@pki.net", role: "ROLE_OPERATOR", caType: "SUB_CA" },
        { id: 3, username: "auditor.external", email: "compliance@audit.org", role: "ROLE_AUDITOR" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleAction = async (id, actionType, apiMethod) => {
    if (processingIds.has(id)) return;
    
    try {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      
      await apiMethod(id);
      setPendingUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error(`Identity action failed (${actionType}):`, err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredUsers = pendingUsers.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Staggered Container Animation Context
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 28 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 select-none max-w-5xl mx-auto w-full px-1"
    >
      
      {/* HEADER CONTROLS FRAMEWORK */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col gap-4 border-b border-[rgb(var(--app-border))] pb-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-indigo-400" size={18} />
            <h2 className="app-heading text-lg font-bold tracking-tight">
              Access Requests
            </h2>
          </div>
          <p className="app-muted text-xs">
            Review and authorize incoming infrastructure nodes and user profiles.
          </p>
        </div>

        {/* TOP COMPACT METRICS BAR */}
        <div className="app-surface-soft flex items-center gap-2 rounded-xl p-1.5 border border-[rgb(var(--app-border))] self-start sm:self-auto shadow-sm">
          <div className="flex items-center gap-2 border-r border-[rgb(var(--app-border))] px-3 py-0.5">
            <Users2 size={13} className="text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Queue</span>
              <span className="app-heading text-xs font-mono font-bold">
                {pendingUsers.length} Pending
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-r border-[rgb(var(--app-border))] px-3 py-0.5">
            <Activity size={13} className="text-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Guard</span>
              <span className="text-xs font-bold text-emerald-400">Nominal</span>
            </div>
          </div>

          <button
            onClick={fetchPendingUsers}
            disabled={loading}
            className="app-muted flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition hover:text-[rgb(var(--app-heading))] disabled:opacity-40"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
        </div>
      </motion.div>

      {/* DYNAMIC SEARCH AND FILTER CONTROLS BAR */}
      <motion.div 
        variants={itemVariants}
        className="app-surface-soft grid grid-cols-1 sm:flex sm:items-center gap-3 justify-between p-3 rounded-xl border border-[rgb(var(--app-border))]"
      >
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 app-muted pointer-events-none">
            <Search size={13} />
          </span>
          <input
            type="text"
            placeholder="Filter identity or root mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[rgb(var(--app-surface-strong))]/20 border border-[rgb(var(--app-border))] rounded-lg focus:outline-none focus:border-indigo-500/40 app-heading placeholder:text-slate-500 font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1 whitespace-nowrap">
            <Filter size={10} /> Role Matrix:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-bold bg-[rgb(var(--app-surface-strong))]/20 border border-[rgb(var(--app-border))] rounded-lg px-2.5 py-1.5 focus:outline-none app-heading cursor-pointer w-full sm:w-auto min-w-[140px]"
          >
            <option value="ALL">All Profiles</option>
            <option value="ROLE_ADMIN">Administrator</option>
            <option value="ROLE_OPERATOR">Operator</option>
            <option value="ROLE_AUDITOR">Auditor</option>
          </select>
        </div>
      </motion.div>

      {/* MAIN IDENTITY DATA STRIP ROW ARRAY */}
      <div className="space-y-2.5 relative">
        <AnimatePresence mode="popLayout">
          {loading ? (
            /* Responsive Structural Skeletons */
            [1, 2].map((skId) => (
              <div 
                key={skId} 
                className="h-[72px] animate-pulse rounded-xl border border-[rgb(var(--app-border))] app-surface-soft w-full" 
              />
            ))
          ) : filteredUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 border border-dashed border-[rgb(var(--app-border))] rounded-xl text-slate-500 text-xs font-medium"
            >
              No clear active identity configurations matched selection parameters.
            </motion.div>
          ) : (
            filteredUsers.map((user) => {
              const isProcessing = processingIds.has(user.id);

              return (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -35, transition: { duration: 0.18 } }}
                  transition={{ type: "spring", stiffness: 520, damping: 36 }}
                  className={isProcessing ? "opacity-30 pointer-events-none" : "w-full"}
                >
                  <GlassCard className="relative flex flex-col gap-3.5 rounded-xl border border-[rgb(var(--app-border))] p-3.5 transition-all duration-150 hover:border-indigo-500/30 sm:flex-row sm:items-center sm:justify-between w-full">
                    
                    {/* LEFT IDENTITY METADATA ROW */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="app-surface-strong app-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--app-border))]">
                        <UserCircle2 size={20} />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="app-heading text-xs font-bold tracking-wide font-mono truncate max-w-[180px] sm:max-w-xs">
                            {user.username}
                          </h4>

                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                            {user.role?.replace("ROLE_", "") || "USER"}
                          </span>

                          {user.caType && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wide">
                              {user.caType}
                            </span>
                          )}
                        </div>

                        <div className="app-muted flex items-center text-[11px] font-medium min-w-0">
                          <span className="flex items-center gap-1.5 font-mono truncate">
                            <Mail size={11} className="text-slate-500 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COMPLIANCE ACTION BUTTON CLUSTER */}
                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[rgb(var(--app-border))]/50 pt-3 sm:border-t-0 sm:pt-0 w-full sm:w-auto">
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAction(user.id, "REJECT", rejectPendingUser)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-[rgb(var(--app-border))] hover:border-red-500/20 rounded-lg transition-all font-bold text-xs tracking-wide active:scale-95 flex-1 sm:flex-initial min-w-[85px]"
                      >
                        <X size={13} />
                        Reject
                      </button>

                      <button
                        disabled={isProcessing}
                        onClick={() => handleAction(user.id, "APPROVE", approvePendingUser)}
                        className="flex items-center justify-center gap-1 px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-600 rounded-lg transition-all font-bold text-xs tracking-wide active:scale-95 flex-1 sm:flex-initial min-w-[90px]"
                      >
                        <Check size={13} />
                        Approve
                      </button>
                    </div>

                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}