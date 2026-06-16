import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Custom tooltip component
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-indigo-600 dark:text-indigo-400 mt-0.5">
        {payload[0].value} {payload[0].value === 1 ? "click" : "clicks"}
      </p>
    </div>
  );
}

export default function ClicksChart({ data }) {
  if (!data) return null;
  const hasClicks = data.some((d) => d.clicks > 0);
  const maxVal = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div className="px-2 pb-4">
      {!hasClicks && (
        <div className="flex flex-col items-center gap-2 py-6 mb-2 text-gray-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-xs">No clicks in this period</p>
        </div>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-100 dark:text-gray-800"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-gray-400"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.ceil(maxVal * 1.2)]}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-gray-400"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#clickGradient)"
              dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
