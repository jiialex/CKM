// components/ui/Button.jsx
import { motion } from 'framer-motion';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: "app-primary-action shadow-[0_0_15px_rgb(var(--app-primary)/0.32)]",
    secondary: "border border-app-border bg-app-surface-strong text-app-text hover:bg-app-surface-muted",
    outline: "border-2 border-app-primary/50 text-app-primary hover:bg-app-primary/10"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// components/ui/GlassCard.jsx
