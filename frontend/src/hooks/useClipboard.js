import { useState, useCallback } from "react";

// Copy-to-clipboard with a transient "copied" flag for button feedback.
// Falls back gracefully if the Clipboard API is unavailable (e.g. non-HTTPS).
export function useClipboard(resetMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [resetMs]
  );

  return { copied, copy };
}
