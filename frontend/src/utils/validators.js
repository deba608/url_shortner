// Lightweight client-side validation. Mirrors the backend's rules so users get
// instant feedback, but the server stays the source of truth (never trust the client).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  if (!email) return "Email is required";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};
