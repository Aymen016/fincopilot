"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#a78bfa", "#818cf8", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#f97316", "#c084fc"];

interface Expense {
  amount: number;
  category: { name: string; icon: string };
}

export function SpendingDonut({ expenses }: { expenses: Expense[] }) {
  const grouped = expenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.category?.name || "Other";
    acc[key] = (acc[key] || 0) + e.amount;
    return acc;
  }, {});

  const data = Object.entries(grouped)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="text-xs font-semibold text-white mb-0.5">{payload[0].name}</p>
        <p className="text-xs text-slate-400">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={68}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-1">
        {data.slice(0, 6).map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] text-slate-500 truncate">{d.name}</span>
            <span className="text-[11px] font-semibold text-slate-300 ml-auto shrink-0">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
