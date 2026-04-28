"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import useSWR from "swr";
import { apiClient } from "@/lib/api";

interface Props {
  showForecast?: boolean;
}

export function TrendLine({ showForecast }: Props) {
  const { data: expenses } = useSWR("expenses-trend", () => apiClient.getExpenses({ limit: 200 }));

  if (!expenses?.items?.length) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        Add expenses to see your trend
      </div>
    );
  }

  // Group by month
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
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(val: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(val)} />
        <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        {showForecast && (
          <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
