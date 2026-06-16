import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

export default function Logo({ className = "", asLink = true, size = "md" }) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-6 w-6";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-xl";

  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg className={`${iconSize} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <span className={`${textSize} font-black tracking-tight text-white`}>Shortly</span>
    </span>
  );

  if (asLink) {
    return (
      <Link to={ROUTES.HOME} className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
