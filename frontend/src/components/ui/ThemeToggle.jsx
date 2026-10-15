// components/ui/ThemeToggle.jsx
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative h-8 w-14 rounded-full border border-app-border bg-app-surface-strong p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-app-primary/30"
      aria-label="Toggle Theme"
      title={`Current theme: ${resolvedTheme}`}
    >
      <motion.div
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-app-primary shadow-lg"
      >
        {isDark ? (
          <Moon size={12} className="text-white" />
        ) : (
          <Sun size={12} className="text-white" />
        )}
      </motion.div>
    </button>
  );
}
