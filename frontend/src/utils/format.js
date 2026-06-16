import { TRUNCATE_LENGTH } from "@/utils/constants";

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export const truncate = (str, max = TRUNCATE_LENGTH) =>
  str && str.length > max ? `${str.slice(0, max)}…` : str;

export const formatDateTime = (value) => {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

export const buildDailySeries = (clickHistory = [], days = 7) => {
  const buckets = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
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
