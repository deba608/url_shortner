import { useEffect } from "react";
import { BRAND_NAME } from "@/utils/constants";

export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — ${BRAND_NAME}` : BRAND_NAME;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
