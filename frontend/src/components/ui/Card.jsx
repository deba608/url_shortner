// Generic surface container. Use variant="glass" for the glassmorphism style.
export default function Card({ children, className = "", variant = "default", hover = false }) {
  const base = "rounded-2xl transition-all";
  const variants = {
    default:
      "border border-gray-200 bg-white shadow-sm dark:border-gray-800/80 dark:bg-gray-900/80",
    glass:
      "glass dark:border-white/10",
    flat:
      "border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50",
    elevated:
      "border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900",
  };
  const hoverClass = hover
    ? "hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    : "";

  return (
    <div className={`${base} ${variants[variant]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
