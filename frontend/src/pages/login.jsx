import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

import { authApi } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { decodeJWT } from "../utils/jwt";
import { GlassCard, Button, Input } from "../components/ui/Core";

export default function Login() {

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setTokens = useAuthStore((s) => s.setTokens);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authApi.post("/auth/login", form);

      const { accessToken, refreshToken } = res.data;

      const decoded = decodeJWT(accessToken);

      const user = {
        username: decoded?.sub,
        role: decoded?.role,
        caType: decoded?.caType,
      };

      setTokens({ accessToken, refreshToken, user });

      // Role-based navigation (your existing logic)
      const role = decoded?.role;
      const caType = decoded?.caType;

      if (role === "ADMIN" || role === "AUDITOR") {
        navigate("/dashboard");
      } else if (role === "CA_OPERATOR") {
        navigate("/keys");
      } else if (role === "USER") {
        navigate("/keys");
      } else {
        navigate("/");
      }

    } catch (err) {
      const msg = err.response?.data?.message || 
                  err.response?.data || 
                  err.message || "Login failed";

      if (msg.includes("Bad credentials") || msg.includes("Invalid username")) {
        setError("Invalid credentials. Please check your username and password.");
      } else if (msg.toLowerCase().includes("pending")) {
        setError("Access Request Pending. Awaiting admin approval.");
      } else if (msg.includes("disabled")) {
        setError("Account is suspended. Contact administrator.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-gradient-to-b from-[#F4F7F9] to-[#E9EFF2] dark:from-[#0B151D] dark:to-[#0F1E29] font-sans text-[#334756] dark:text-slate-300 pt-20">
      
      {/* Soft Light-Blue Dynamic Background Blurs */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(225,236,244,0.8),_transparent_55%)] dark:bg-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#CBDCE9]/30 dark:bg-sky-500/5 blur-[120px] rounded-full -z-10" />

      <GlassCard className="w-full max-w-md p-8 md:p-10 border-[#CBDCE9] dark:border-slate-800/80 bg-white/90 dark:bg-[#122430]/90 shadow-md rounded-2xl">

        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-3.5 bg-[#224257] dark:bg-[#1E3A4C] text-white rounded-xl mb-4 shadow-sm"
          >
            <ShieldCheck className="h-7 w-7" />
          </motion.div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#1E3A4C] dark:text-white text-center">
            Nexus<span className="text-[#3A7094] dark:text-sky-400">PKI</span> Vault
          </h2>
          <p className="text-[#5C7282] dark:text-slate-400 mt-2 text-[10px] uppercase tracking-wider font-bold text-center">
            Identity Verification Required
          </p>
        </div>

        {/* ERROR */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 font-medium"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Username */}
          <div className="relative group">
            <div className="absolute left-3.5 top-[38px] flex items-center pointer-events-none z-10">
              <User className="h-4 w-4 text-[#5C7282]/70 group-focus-within:text-[#3A7094] dark:group-focus-within:text-sky-400 transition-colors" />
            </div>
            <Input
              label="Subject Identifier"
              placeholder="Username"
              className="pl-11 bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border-[#CBDCE9] dark:border-slate-800 text-[#1E3A4C] dark:text-white rounded-xl placeholder:text-[#9BB1C1] text-xs font-medium focus:border-[#3A7094] dark:focus:border-sky-500"
              required
              autoComplete="username"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <div className="absolute left-3.5 top-[38px] flex items-center pointer-events-none z-10">
              <Lock className="h-4 w-4 text-[#5C7282]/70 group-focus-within:text-[#3A7094] dark:group-focus-within:text-sky-400 transition-colors" />
            </div>
            <Input
              label="Secret Key"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-11 pr-11 bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border-[#CBDCE9] dark:border-slate-800 text-[#1E3A4C] dark:text-white rounded-xl placeholder:text-[#9BB1C1] text-xs font-medium focus:border-[#3A7094] dark:focus:border-sky-500"
              required
              autoComplete="current-password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 bottom-3 text-[#5C7282]/80 hover:text-[#1E3A4C] dark:hover:text-white transition-colors z-10"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end px-0.5">
            <Link
              to="/forgot-password"
              className="text-xs text-[#3A7094] hover:text-[#224257] dark:text-sky-400 dark:hover:text-sky-300 transition-colors font-bold tracking-wide"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <Button
            variant="primary"
            type="submit"
            className="w-full py-3 bg-[#224257] hover:bg-[#1A3344] dark:bg-sky-500 dark:hover:bg-sky-600 text-white dark:text-[#0B151D] text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-98 mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Authenticating...
              </span>
            ) : (
              "Authorize Session"
            )}
          </Button>

          {/* Signup Link */}
          <div className="text-center pt-2 border-t border-[#E1ECF4]/60 dark:border-slate-800/40">
            <p className="text-xs text-[#5C7282] dark:text-slate-400 font-medium">
              Unregistered entity?{" "}
              <Link
                to="/signup"
                className="text-[#3A7094] dark:text-sky-400 font-bold hover:underline transition-all"
              >
                Request Access
              </Link>
            </p>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}