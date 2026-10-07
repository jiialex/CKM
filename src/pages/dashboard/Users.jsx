import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Trash2, Eye, AlertTriangle, 
  X, Filter, Plus, Check, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteUserById, getUsers } from '../../services/users';
import { useAuthStore } from '../../store/authStore';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');
  
  // Track inline confirmation state per user row instead of using heavy native alert blocks
  const [deletingId, setDeletingId] = useState(null);

  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(
    currentUser?.role?.replace('ROLE_', '')
  );

  const mockUsers = useMemo(() => [
    { id: 90584, username: "teklewold", email: "teklewold@insa.local", role: "ADMIN", enabled: true, approved: true, lastLogin: "2026-05-22T10:15:00", createdAt: "2025-01-15" },
    { id: 31758, username: "admin01", email: "admin@insa.local", role: "ADMIN", enabled: true, approved: true, lastLogin: "2026-05-23T08:45:00", createdAt: "2024-11-20" },
    { id: 72043, username: "auditor01", email: "audit@insa.local", role: "AUDITOR", enabled: true, approved: true, lastLogin: "2026-05-20T14:30:00", createdAt: "2025-03-10" },
    { id: 67641, username: "operator22", email: "op22@insa.local", role: "USER", enabled: false, approved: false, lastLogin: "2026-04-15T09:10:00", createdAt: "2025-02-05" },
  ], []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getUsers();
      setUsers(Array.isArray(res) && res.length ? res : mockUsers);
    } catch (err) {
      console.error(err);
      setUsers(mockUsers);
      setError('Using localized backup system data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !search || 
        user.username?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleExecuteDelete = async (id) => {
    try {
      setProcessingIds(prev => new Set([...prev, id]));
      await deleteUserById(id);

      setUsers(prev => prev.filter(u => u.id !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
      setDeletingId(null);
    } catch (err) {
      console.error("Delete failure metrics:", err);
      alert('Failed to delete user. Check role authorities or base API protocols.');
    } finally {
      setProcessingIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredUsers.map(u => u.id);
    if (visibleIds.every(id => selectedIds.includes(id))) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#333333] antialiased px-6 py-10 font-sans max-w-7xl mx-auto w-full space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] tracking-tight">Clients</h1>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {error && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded font-medium flex items-center gap-1.5">
              <AlertTriangle size={13} /> Local Registry
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search components..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-700 placeholder:text-gray-400 w-44 transition-colors"
            />
          </div>

          <div className="flex items-center bg-white border border-gray-300 rounded px-2.5 py-1.5 gap-1 text-xs text-gray-600">
            <Filter size={12} className="text-gray-400" />
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)} 
              className="bg-transparent focus:outline-none cursor-pointer font-medium text-gray-700"
            >
              <option value="All">Filter</option>
              <option value="ADMIN">ADMIN</option>
              <option value="AUDITOR">AUDITOR</option>
              <option value="USER">USER</option>
            </select>
          </div>

          <button 
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center justify-center gap-1 rounded bg-[#4f46e5] text-white text-xs font-semibold px-3 py-1.5 hover:bg-[#4338ca] transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Plus size={14} />
            <span>Add New Client +</span>
          </button>
        </div>
      </div>

      {/* DATA SPREADSHEET */}
      <div className="bg-white border border-gray-200/90 rounded shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-white">
                <th className="py-4 px-4 w-14 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.includes(u.id))}
                    onChange={toggleSelectAll}
                    className="rounded-full border-gray-300 bg-white text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-4 px-4 text-gray-400 font-medium w-24">ID</th>
                <th className="py-4 px-4 text-gray-400 font-medium">Name</th>
                <th className="py-4 px-4 text-gray-400 font-medium">Company Domain Endpoint</th>
                <th className="py-4 px-4 text-gray-400 font-medium w-36">Status</th>
                <th className="py-4 px-4 text-gray-400 font-medium w-32">Clearance</th>
                <th className="py-4 px-4 text-gray-400 font-medium w-36 text-center">PKI Sign</th>
                <th className="py-4 px-4 w-36 text-right pr-6"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-normal">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  [1, 2, 3].map(idx => (
                    <tr key={idx} className="animate-pulse bg-gray-50/50">
                      <td colSpan="8" className="h-16"></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16 text-gray-400 font-medium">
                      No matching user records are currently registered.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const isChecked = selectedIds.includes(user.id);
                    const isProcessing = processingIds.has(user.id);
                    const isConfirmingDelete = deletingId === user.id;

                    return (
                      <motion.tr
                        key={user.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        // Keep 'group' active for premium hover triggering matching original spec
                        className={`group transition-colors duration-150 hover:bg-gray-50/70 relative ${
                          isChecked ? 'bg-blue-50/20' : 'bg-white'
                        } ${isProcessing ? 'opacity-40 pointer-events-none' : ''}`}
                      >
                        <td className="py-5 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            disabled={isProcessing}
                            onChange={() => toggleSelect(user.id)}
                            className="rounded-full border-gray-300 bg-white text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer accent-blue-500"
                          />
                        </td>

                        <td className="py-5 px-4 text-gray-400 font-medium">{user.id}</td>
                        <td className="py-5 px-4 font-medium text-gray-900">{user.username}</td>
                        <td className="py-5 px-4 text-gray-500 font-mono text-[11px]">{user.email}</td>

                        <td className="py-5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${user.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            <span className={user.enabled ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                              {user.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>

                        <td className="py-5 px-4">
                          <span className="text-[10px] font-semibold tracking-wide text-blue-600 bg-blue-50 px-2.5 py-1 rounded uppercase">
                            {user.role}
                          </span>
                        </td>

                        <td className="py-5 px-4 text-center">
                          <div className="flex justify-center">
                            {user.approved ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded font-medium">Secured</span>
                            ) : (
                              <span className="text-[10px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded font-medium animate-pulse">Pending</span>
                            )}
                          </div>
                        </td>

                        {/* PREMIUM HOVER-TO-REVEAL ACTION AREA WITH INLINE CONFIRM MATRIX */}
                        <td className="py-5 px-4 text-right pr-6 relative w-36">
                          
                          {/* Fallback Standby Icon (Disappears on hover or when confirmation triggers) */}
                          <div className={`transition-opacity duration-150 text-gray-300 flex justify-end ${
                            isConfirmingDelete ? 'opacity-0' : 'group-hover:opacity-0 opacity-100'
                          }`}>
                            <MoreVertical size={15} />
                          </div>

                          {/* Interactive Hover Component Base Block */}
                          <div 
                            className={`absolute inset-y-0 right-6 flex items-center gap-2 transition-all duration-150 z-20 pointer-events-auto bg-transparent ${
                              isConfirmingDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={(e) => e.stopPropagation()} // Guard row layout clicks completely
                          >
                            <AnimatePresence mode="wait">
                              {!isConfirmingDelete ? (
                                <motion.div 
                                  key="standard-actions"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center gap-1.5"
                                >
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => setSelectedUser(user)}
                                    className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded border border-gray-200/60 bg-white transition-all cursor-pointer"
                                    title="View details"
                                  >
                                    <Eye size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!isAdmin || isProcessing}
                                    onClick={() => setDeletingId(user.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded border border-gray-200/60 bg-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Delete user"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </motion.div>
                              ) : (
                                <motion.div 
                                  key="inline-confirmation"
                                  initial={{ opacity: 0, scale: 0.92 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.92 }}
                                  className="flex items-center bg-red-50 border border-red-200 rounded px-1.5 py-0.5 shadow-xs gap-1"
                                >
                                  <span className="text-[10px] font-medium text-red-700 px-1 select-none">Delete?</span>
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteDelete(user.id)}
                                    className="p-1 bg-red-600 text-white hover:bg-red-700 rounded transition-colors cursor-pointer"
                                    title="Confirm Permanent Deletion"
                                  >
                                    <Check size={11} />
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(null)}
                                    className="p-1 bg-white text-gray-500 border border-gray-300 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X size={11} />
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION OVERLAY */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">User Meta Matrix</span>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Account Label</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedUser.username}</p>
                  <p className="text-gray-500 font-mono text-[11px]">{selectedUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">System Rule</label>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{selectedUser.role}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Created On</label>
                    <span className="text-gray-600 font-mono">{selectedUser.createdAt || 'N/A'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded p-2.5 text-[11px]">
                  <span className="text-gray-400 font-medium block mb-0.5">Last Communication Pulse</span>
                  <span className="text-gray-700 font-mono">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never logged'}</span>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded font-medium transition-colors text-center shadow-xs"
                >
                  Dismiss Parameters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}