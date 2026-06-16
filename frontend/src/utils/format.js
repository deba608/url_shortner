// Human-friendly date like "Jun 16, 2026". Falls back gracefully on bad input.
export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// Truncate long original URLs for display without breaking layout.
export const truncate = (str, max = 48) =>
  str && str.length > max ? `${str.slice(0, max)}…` : str;

// Date + time like "Jun 16, 2026, 3:40 PM" for "last accessed".
export const formatDateTime = (value) => {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

// Bucket a clickHistory array into per-day counts for the last `days` days,
// returning a zero-filled, chronologically ordered series the chart can render
// directly. Zero-filling matters: gaps would otherwise make a quiet day vanish
// and distort the trend.
export const buildDailySeries = (clickHistory = [], days = 7) => {
  const buckets = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    buckets.set(key, {
      date: key,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      clicks: 0,
    });
  }

  for (const click of clickHistory) {
    const key = new Date(click.clickedAt).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.get(key).clicks += 1;
  }

  return Array.from(buckets.values());
};
