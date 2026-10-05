import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from "lucide-react";

import { authApi } from "../api/axios";
import { GlassCard, Button, Input } from "../components/ui/Core";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      setSuccess(true);

      // Auto redirect after success
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg || "Failed to reset password. Token may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

      <GlassCard className="w-full max-w-md p-8 md:p-10 border-indigo-500/10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20 shadow-inner"
          >
            <ShieldCheck className="h-10 w-10 text-indigo-500" />
          </motion.div>

          <h2 className="text-3xl font-bold dark:text-white text-slate-900 tracking-tight text-center">
            Set New Password
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-green-500">Password Updated!</h3>
              <p className="text-slate-500 mt-2">Redirecting to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* New Password */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                  <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400" />
                </div>

                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-11 pr-10 bg-slate-950/20"
                  required
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                  <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400" />
                </div>

                <Input
                  label="Confirm New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-11 bg-slate-950/20"
                  required
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full py-4 font-bold shadow-lg shadow-indigo-500/10"
                disabled={loading || !token}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}