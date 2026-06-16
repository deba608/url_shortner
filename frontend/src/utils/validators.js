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

// Returns { error: string|null, normalised: string } so the caller can
// both surface a message and send the corrected URL to the backend.
export const validateUrl = (url) => {
  if (!url) return { error: "URL is required", normalised: url };

  // Auto-prepend https:// when the user types a bare domain (e.g. "google.com")
  let normalised = url;
  if (!/^https?:\/\//i.test(normalised)) {
    normalised = `https://${normalised}`;
  }

  try {
    new URL(normalised);
    return { error: null, normalised };
  } catch {
    return { error: "Enter a valid URL (e.g. https://example.com)", normalised };
  }
};
