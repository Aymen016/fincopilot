"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useTheme } from "next-themes";

interface Props {
  showForecast?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-semibold" style={{ color: p.color }}>
          {new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  );
};

export function TrendLine({ showForecast }: Props) {
  const { data: expenses } = useSWR("expenses-trend", () => apiClient.getExpenses({ limit: 200 }));
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const tickColor = isDark ? "#475569" : "#64748b";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.06)";
  const cursorColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";

  if (!expenses?.items?.length) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
        Add expenses to see your trend
      </div>
    );
  }

  const monthly: Record<string, number> = {};
  expenses.items.forEach((e: any) => {
    const key = e.expense_date.slice(0, 7);
    monthly[key] = (monthly[key] || 0) + e.amount;
  });

  const data = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({
      month: new Date(month + "-01").toLocaleString("default", { month: "short" }),
      actual: Math.round(total),
      forecast: undefined as number | undefined,
    }));

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -24, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#a78bfa"
          strokeWidth={2}
          dot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
          activeDot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
        />
        {showForecast && (
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#fbbf24"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
