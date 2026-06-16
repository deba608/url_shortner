// Skeleton loading placeholder with shimmer effect
export default function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-xl ${className}`}
    />
  );
}
