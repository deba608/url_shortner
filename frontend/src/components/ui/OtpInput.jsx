import { useRef } from "react";
import { OTP_LENGTH } from "@/utils/constants";

// Controlled 6-box OTP input. Parent holds the value as a string; this renders
// one box per character with auto-advance, backspace-to-previous, arrow nav,
// and full-code paste support. Numeric-only.
export default function OtpInput({ value, onChange, length = OTP_LENGTH, disabled, autoFocus }) {
  const refs = useRef([]);

  const focusBox = (i) => refs.current[i]?.focus();

  const setAt = (i, char) => {
    const arr = value.split("");
    while (arr.length < length) arr.push("");
    arr[i] = char;
    onChange(arr.join("").slice(0, length));
  };

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setAt(i, digit);
    if (i < length - 1) focusBox(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) {
        setAt(i, "");
      } else if (i > 0) {
        setAt(i - 1, "");
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusBox(i - 1);
    } else if (e.key === "ArrowRight" && i < length - 1) {
      focusBox(i + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    onChange(digits);
    focusBox(Math.min(digits.length, length - 1));
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-12 w-full min-w-0 rounded-md border border-white/10 bg-slate-900/40 text-center text-lg font-bold text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
        />
      ))}
    </div>
  );
}
