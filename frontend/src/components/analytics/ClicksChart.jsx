import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Card from "@/components/ui/Card";

// Daily clicks bar chart. Bars (not a line) because the data is discrete daily
// counts, not a continuous signal — bars read as "how many on each day" without
// implying interpolation between points. Y axis uses integer ticks since clicks
// are whole numbers.
export default function ClicksChart({ data }) {
  const hasClicks = data.some((d) => d.clicks > 0);

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Clicks (last 7 days)</h2>
        {!hasClicks && <span className="text-xs text-gray-400">No clicks in this window</span>}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
            <Tooltip
              cursor={{ fill: "rgba(99,102,241,0.1)" }}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
              labelFormatter={(label) => `${label}`}
              formatter={(value) => [`${value} clicks`, ""]}
            />
            <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
