export default function BreakdownPanel({ title, items = [] }) {
  if (!items || items.length === 0) return null;

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <span className="text-xs text-gray-700 dark:text-gray-300 w-20 truncate flex-shrink-0">{item.value}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 w-8 text-right flex-shrink-0">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
