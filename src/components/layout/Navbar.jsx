import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, LayoutDashboard, Layers3, FileText, Settings } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import ThemeToggle from '../ui/ThemeToggle';
import UserMenu from "./UserMenu";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Map the navigation tree structure directly to components matching 3f626227d1f93fa568b640078727594f_3.jpg
  const menuItems = [
    { name: "Home", path: "/", icon: <Layers3 size={15} /> },
    { name: "Security Architecture", path: "/about", icon: <FileText size={15} /> },
    { name: "Contact", path: "/contact", icon: <Settings size={15} /> },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 font-sans ${
        isScrolled 
          ? "bg-[#E1ECF4]/80 dark:bg-[#0F1E29]/80 backdrop-blur-md py-2.5 border-b border-[#CBDCE9] dark:border-slate-800/80 shadow-sm" 
          : "bg-transparent py-4 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* Left Side: Brand Logo and Title Stack */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="p-2 rounded-xl bg-[#224257] dark:bg-[#1E3A4C] text-white shadow-sm group-hover:opacity-95 transition-opacity">
            <ShieldCheck size={18} />
          </div>
          <span className="text-base font-bold tracking-tight text-[#224257] dark:text-slate-100 transition-colors">
            PKI<span className="text-[#3A7094] dark:text-sky-400"> CKM</span>
          </span>
        </Link>

        {/* Center: Sliding Tab System inspired by 3f626227d1f93fa568b640078727594f_3.jpg */}
        <div className="hidden md:flex items-center space-x-1 bg-[#F0F5F9]/60 dark:bg-slate-900/30 p-1 rounded-xl border border-[#DCE6ED]/50 dark:border-slate-800/50 backdrop-blur-sm">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors duration-200 flex items-center gap-2 ${
                  isActive 
                    ? "text-[#224257] dark:text-white" 
                    : "text-[#5C7282] dark:text-slate-400 hover:text-[#224257] dark:hover:text-slate-200"
                }`}
              >
                {/* Underlay layout animation frame */}
                {isActive && (
                  <motion.div
                    layoutId="navbarActiveIndicator"
                    className="absolute inset-0 bg-white dark:bg-[#1E3A4C] shadow-sm rounded-md border border-[#CBDCE9]/60 dark:border-slate-700/50 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="opacity-70">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right Side: Identity Controls and Mode Utilities */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="h-4 w-[1px] bg-[#CBDCE9] dark:bg-slate-800" />

          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-3.5">
              <Link 
                to="/login" 
                className="text-xs font-bold text-[#5C7282] hover:text-[#224257] dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Login
              </Link>
              <Link to="/signup">
                <motion.button 
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#224257] hover:bg-[#1A3344] dark:bg-sky-500 dark:hover:bg-sky-600 text-white dark:text-[#0B151D] text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}