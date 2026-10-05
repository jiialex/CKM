// components/ui/Core.jsx
import { motion } from 'framer-motion';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: "app-primary-action shadow-lg shadow-app-primary/20",
    secondary: "border border-app-border bg-app-surface-strong text-app-text hover:bg-app-surface-muted",
    ghost: "text-app-muted hover:bg-app-surface-muted hover:text-app-heading"
  };
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className={`px-5 py-2.5 rounded-lg font-medium transition-all ${styles[variant]} ${className}`} 
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Input = ({ label, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="app-muted text-xs font-bold uppercase tracking-widest">
        {label}
      </label>
    )}

    <input
      {...props}
      className={`app-input w-full rounded-lg py-2.5
      ${className}`}
    />
  </div>
);

// Updated GlassCard example
export const GlassCard = ({ children, className = "" }) => (
  <div className={`
    app-card backdrop-blur-xl transition-colors duration-300
    rounded-2xl p-6 ${className}
  `}>
    {children}
  </div>
);

