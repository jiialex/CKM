export const GlassCard = ({ children, className = "" }) => (
  <div
    className={`app-card rounded-2xl p-6 backdrop-blur-md transition-colors duration-300 hover:border-app-primary/30 ${className}`}
  >
    {children}
  </div>
);
