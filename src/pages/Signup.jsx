import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Loader2,
  ShieldAlert,
  FileSearch,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { GlassCard, Button, Input } from '../components/ui/Core';
import { authApi } from '../api/axios';
import { decodeJWT } from '../utils/jwt';
import { useAuthStore } from '../store/authStore';

export default function Signup() {

  const navigate = useNavigate();

  const setTokens = useAuthStore((s) => s.setTokens);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    caType: null
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const roles = [
    {
      id: 'USER',
      label: 'End User',
      icon: <User size={13} />,
    },
    {
      id: 'AUDITOR',
      label: 'Auditor',
      icon: <FileSearch size={13} />,
    },
    {
      id: 'CA_OPERATOR',
      label: 'CA Operator',
      icon: <ShieldAlert size={13} />,
    }
  ];

  const caTypes = [
    {
      id: 'ROOT',
      label: 'Root Trust Anchor',
      desc: 'Primary self-signed cryptographic root.'
    },
    {
      id: 'INTERMEDIATE',
      label: 'Intermediate Authority',
      desc: 'Subordinate certificate signing segment.'
    }
  ];

  const updateForm = (field, value) => {

    setForm(prev => {

      const updated = {
        ...prev,
        [field]: value
      };

      // PASSWORD VALIDATION

      if (
        (field === "password" || field === "confirmPassword") &&
        updated.confirmPassword
      ) {

        if (updated.password !== updated.confirmPassword) {
          setError("Passwords do not match");
        } else {
          setError("");
        }

      } else {
        setError("");
      }

      return updated;
    });
  };

  const handleSignup = async (e) => {

    e.preventDefault();

    setError('');

    // VALIDATION

    if (!form.password || !form.confirmPassword) {
      return setError("Please fill in both password fields");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (form.role === "CA_OPERATOR" && !form.caType) {
      return setError("Please select CA type");
    }

    setLoading(true);

    try {

      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        caType:
          form.role === "CA_OPERATOR"
            ? form.caType
            : null
      };

      const res = await authApi.post("/auth/signup", payload);

      // =========================
      // AUTO LOGIN FOR USER
      // =========================

      if (res.data.accessToken) {

        const { accessToken, refreshToken } = res.data;

        const decoded = decodeJWT(accessToken);

        const user = {
          username: decoded?.sub,
          role: decoded?.role,
          caType: decoded?.caType
        };

        setTokens({
          accessToken,
          refreshToken,
          user
        });

        navigate("/keys");
      }

      // =========================
      // PENDING APPROVAL
      // =========================

      else {

        navigate(
          "/login?message=awaiting_approval"
        );
      }

    } catch (err) {

      console.log(err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Signup failed";

      setError(
        typeof msg === "string"
          ? msg
          : JSON.stringify(msg)
      );

    } finally {

      setLoading(false);
    }
  };

  const passwordsMatch =
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden bg-gradient-to-b from-[#F4F7F9] to-[#E9EFF2] dark:from-[#0B151D] dark:to-[#0F1E29] font-sans text-[#334756] dark:text-slate-300 pt-24">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,_rgba(225,236,244,0.6),_transparent_60%)] dark:bg-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#CBDCE9]/20 dark:bg-sky-500/5 blur-[140px] rounded-full -z-10" />

      <GlassCard className="w-full max-w-lg p-8 md:p-10 border-[#CBDCE9] dark:border-slate-800/80 bg-white/90 dark:bg-[#122430]/90 shadow-sm rounded-2xl">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-[#224257] dark:bg-[#1E3A4C] text-white rounded-xl mb-3.5 shadow-sm">
            <UserPlus size={22} />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#1E3A4C] dark:text-white">
            Enroll Infrastructure Node
          </h2>
          <p className="text-[#5C7282] dark:text-slate-400 text-xs mt-1.5 font-medium">
            Register cryptographic profile parameters below
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSignup}>

          {/* ERROR ALERT */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs font-medium shadow-inner"
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SINGLE COLUMN INPUT STACK */}
          <div className="space-y-4">
            <Input
              label="Subject Distinguished Name (Username)"
              placeholder="e.g. operator_alpha"
              className="w-full bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border-[#CBDCE9] dark:border-slate-800 text-[#1E3A4C] dark:text-white rounded-xl placeholder:text-[#9BB1C1] text-xs font-medium focus:border-[#3A7094] dark:focus:border-sky-500"
              required
              onChange={(e) => updateForm('username', e.target.value)}
            />

            <Input
              label="Associated Entity Email"
              type="email"
              placeholder="operator@agency.gov"
              className="w-full bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border-[#CBDCE9] dark:border-slate-800 text-[#1E3A4C] dark:text-white rounded-xl placeholder:text-[#9BB1C1] text-xs font-medium focus:border-[#3A7094] dark:focus:border-sky-500"
              required
              onChange={(e) => updateForm('email', e.target.value)}
            />

            <Input
              type="password"
              label="Account Access Passphrase"
              placeholder="••••••••"
              className="w-full bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border-[#CBDCE9] dark:border-slate-800 text-[#1E3A4C] dark:text-white rounded-xl placeholder:text-[#9BB1C1] text-xs font-medium focus:border-[#3A7094] dark:focus:border-sky-500"
              required
              onChange={(e) => updateForm('password', e.target.value)}
            />

            <div className="relative">
              <Input
                type="password"
                label="Confirm Access Passphrase"
                placeholder="••••••••"
                className="w-full bg-[#F4F7F9]/60 dark:bg-[#0B151D]/50 border-[#CBDCE9] dark:border-slate-800 text-[#1E3A4C] dark:text-white rounded-xl placeholder:text-[#9BB1C1] text-xs font-medium focus:border-[#3A7094] dark:focus:border-sky-500"
                required
                onChange={(e) => updateForm('confirmPassword', e.target.value)}
              />
              
              {/* PASSWORD MATCH STATUS TEXT */}
              {passwordsMatch && (
                <div className="absolute right-3.5 bottom-3 text-emerald-500 flex items-center gap-1 text-[11px] font-bold z-10 bg-white/90 dark:bg-[#122430] pl-1 py-0.5">
                  <CheckCircle2 size={12} />
                  <span>Verified Match</span>
                </div>
              )}
            </div>
          </div>

          {/* HORIZONTAL SEGMENTED ROLE SELECTION */}
          <div className="space-y-2 pt-2">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#5C7282] dark:text-slate-400">
              Authority Assignment Objective
            </p>

            <div className="grid grid-cols-3 bg-[#F4F7F9]/60 dark:bg-[#0B151D]/40 border border-[#CBDCE9] dark:border-slate-800/80 p-1 rounded-xl">
              {roles.map((r) => {
                const isSelected = form.role === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() =>
                      setForm({
                        ...form,
                        role: r.id,
                        caType: null
                      })
                    }
                    className={`flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-150 select-none ${
                      isSelected
                        ? "bg-[#224257] text-white dark:bg-sky-500 dark:text-[#0B151D] shadow-sm"
                        : "text-[#5C7282] dark:text-slate-400 hover:text-[#1E3A4C] dark:hover:text-white"
                    }`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC SUBSIDIARY SCOPE SELECTION (VERTICAL ACCORDION) */}
          <AnimatePresence>
            {form.role === "CA_OPERATOR" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
                  Cryptographic Authority Level
                </p>
                
                <div className="space-y-2">
                  {caTypes.map((type) => {
                    const isTypeSelected = form.caType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => updateForm('caType', type.id)}
                        className={`relative p-3 rounded-xl cursor-pointer border transition-all ${
                          isTypeSelected
                            ? "border-amber-500 dark:border-amber-400 bg-amber-500/10"
                            : "border-[#CBDCE9] dark:border-slate-800/80 bg-[#F4F7F9]/30 dark:bg-[#0B151D]/20"
                        }`}
                      >
                        <p className="text-xs font-bold text-[#1E3A4C] dark:text-white">
                          {type.label}
                        </p>
                        <p className="text-[10px] text-[#5C7282] dark:text-slate-400 font-medium mt-0.5">
                          {type.desc}
                        </p>
                        
                        {isTypeSelected && (
                          <div className="absolute top-3 right-3.5 text-amber-500 dark:text-amber-400">
                            <CheckCircle2 size={12} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIONS AND ROUTING LINKS */}
          <div className="pt-3 space-y-4">
            <Button
              type="submit"
              className="w-full py-3 bg-[#224257] hover:bg-[#1A3344] dark:bg-sky-500 dark:hover:bg-sky-600 text-white dark:text-[#0B151D] text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-98"
              variant="primary"
              disabled={loading || !passwordsMatch}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={13} />
                  Provisioning Node...
                </span>
              ) : (
                "Initialize Registration Sequence"
              )}
            </Button>

            <div className="text-center pt-2.5 border-t border-[#E1ECF4]/60 dark:border-slate-800/40">
              <p className="text-xs text-[#5C7282] dark:text-slate-400 font-medium">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="text-[#3A7094] dark:text-sky-400 font-bold hover:underline transition-all"
                >
                  System Login
                </Link>
              </p>
            </div>
          </div>

        </form>
      </GlassCard>
    </div>
  );
}