// Animated placeholder shown while data loads. Matching the shape of real content
// (instead of a spinner) reduces layout shift and feels faster. Expanded in Phase 6.
export default function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${className}`} />
  );
}
