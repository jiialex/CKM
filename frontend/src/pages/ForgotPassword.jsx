import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

import { authApi } from "../api/axios";
import { GlassCard, Button, Input } from "../components/ui/Core";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await authApi.post("/auth/forgot-password", { email });

      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

      <GlassCard className="w-full max-w-md p-8 md:p-10 border-indigo-500/10 shadow-2xl">
        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20 shadow-inner"
          >
            <ShieldCheck className="h-10 w-10 text-indigo-500" />
          </motion.div>

          <h2 className="text-3xl font-bold dark:text-white text-slate-900 tracking-tight text-center">
            Password Recovery
          </h2>
          <p className="text-slate-500 mt-2 text-center text-sm">
            Enter your email to receive a reset link
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-green-500">Check Your Email</h3>
              <p className="text-slate-500 mt-2">
                If an account exists with that email, we’ve sent a password reset link.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block text-indigo-400 hover:text-indigo-300 font-medium"
              >
                ← Back to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                  <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>

                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-11 bg-slate-950/20"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full py-4 font-bold shadow-lg shadow-indigo-500/10"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}