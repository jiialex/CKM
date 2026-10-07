import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

export default function UserMenu() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { preferences } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = useMemo(() => {
    return preferences.displayName?.trim() || user?.username || 'Operator';
  }, [preferences.displayName, user?.username]);

  const initial = displayName.charAt(0).toUpperCase() || 'O';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative font-sans" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-left border border-[#CBDCE9]/40 dark:border-slate-800/60 bg-white/60 dark:bg-[#122430]/60 hover:bg-[#E1ECF4]/40 dark:hover:bg-[#0B151D]/60 transition-all duration-150 select-none"
      >
        {/* Avatar badge matching CA operator theme */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#224257] dark:bg-sky-500 text-xs font-bold text-white dark:text-[#0B151D] shadow-sm">
          {initial}
        </div>

        <div className="hidden sm:block">
          <div className="text-xs font-bold text-[#1E3A4C] dark:text-white">{displayName}</div>
          <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#5C7282] dark:text-slate-400 mt-0.5">
            {user?.role || 'Secure User'}
          </div>
        </div>

        <ChevronDown 
          size={14} 
          className={`text-[#5C7282] dark:text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 rounded-xl border border-[#CBDCE9] dark:border-slate-800 bg-white dark:bg-[#122430] p-1.5 shadow-md">
          
          {/* Header metadata segment */}
          <div className="rounded-lg bg-[#F4F7F9]/60 dark:bg-[#0B151D]/40 border border-[#CBDCE9]/30 dark:border-slate-800/40 px-3 py-2.5 mb-1.5">
            <div className="flex items-center gap-2.5">
              <UserCircle2 className="text-[#3A7094] dark:text-sky-400 shrink-0" size={16} />
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-[#1E3A4C] dark:text-white">
                  {displayName}
                </div>
                <div className="truncate text-[10px] text-[#5C7282] dark:text-slate-400 font-medium mt-0.5">
                  {preferences.contactEmail || 'Authenticated session'}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Nav Option */}
          <Link
            to="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-[#5C7282] dark:text-slate-300 hover:text-[#1E3A4C] dark:hover:text-white hover:bg-[#F4F7F9] dark:hover:bg-[#0B151D]/50 transition-colors"
          >
            <Settings size={14} className="text-[#3A7094] dark:text-sky-400" />
            <span>Settings</span>
          </Link>

          {/* Revoke/Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors mt-0.5"
          >
            <LogOut size={14} />
            <span>Terminate Session</span>
          </button>
          
        </div>
      )}
    </div>
  );
}