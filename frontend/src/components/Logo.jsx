import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

export default function Logo({ className = "", asLink = true, size = "md" }) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const containerSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const textSize = size === "sm" ? "text-sm" : "text-xl";

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex ${containerSize} items-center justify-center rounded-lg bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm border border-[var(--border-color)]`}>
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <span className={`${textSize} font-black tracking-tight text-[var(--text-main)]`}>Shortly</span>
    </div>
  );

  if (asLink) {
    return (
      <Link to={ROUTES.HOME} className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
