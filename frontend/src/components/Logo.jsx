import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

export default function Logo({ size = "sm", showText = true, onClick }) {
  const iconSizes = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-10 w-10" };
  const textSizes = { sm: "text-sm", md: "text-xl", lg: "text-2xl" };
  const iconClass = iconSizes[size] || iconSizes.md;
  const textClass = textSizes[size] || textSizes.md;

  return (
    <Link
      to={ROUTES.HOME}
      onClick={onClick}
      className="flex items-center gap-2.5 shrink-0"
    >
      <svg className={`${iconClass} text-indigo-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {showText && (
        <span className={`${textClass} font-black tracking-tight text-white`}>Shortly</span>
      )}
    </Link>
  );
}
