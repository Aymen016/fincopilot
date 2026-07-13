"use client";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { TrendLine } from "@/components/charts/TrendLine";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

export default function ForecastPage() {
  const { data: forecast } = useSWR("forecast-monthly", () => apiClient.getMonthlyForecast());
  const { data: risk } = useSWR("forecast-risk", () => apiClient.getForecastRisk());

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName = nextMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Spending Forecast</h1>
        <p className="text-sm text-slate-500 mt-0.5">AI-predicted spending for {nextMonthName}</p>
      </div>

      {/* Risk flags */}
      {risk?.risk_flags?.length > 0 && (
        <div className="glass rounded-2xl p-4 border-amber-500/20 bg-amber-500/[0.04]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Risk Alerts ({risk.risk_flags.length})</p>
          </div>
          <div className="space-y-2">
            {risk.risk_flags.map((flag: any) => (
              <div key={flag.category_id} className="flex items-center justify-between bg-slate-900/[0.03] dark:bg-white/[0.03] rounded-xl px-3.5 py-2.5 border border-amber-500/10">
                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{flag.category_name}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">Predicted: <strong className="text-slate-800 dark:text-slate-300">{formatCurrency(flag.predicted)}</strong></span>
                  <span className="text-slate-500">Budget: {formatCurrency(flag.budget)}</span>
                  <span className={`font-bold badge ${flag.risk_level === "high" ? "badge-rose" : "badge-amber"}`}>
                    {flag.risk_level === "high" ? "High" : "Medium"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast summary */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Projected Total</p>
            {forecast && (
              <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(forecast.total_predicted)}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <BarChart2 size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Historical Trend</p>
        <TrendLine showForecast />
      </div>

      {/* By category */}
      {forecast?.by_category && forecast.by_category.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">Breakdown by Category</p>
          <div className="space-y-4">
            {forecast.by_category.map((cat: any) => {
              const isOver = cat.budget_amount && cat.predicted_amount > cat.budget_amount;
              const pct = cat.budget_amount
                ? Math.min(100, Math.round((cat.predicted_amount / cat.budget_amount) * 100))
                : null;
              return (
                <div key={cat.category_id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat.category_name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      {cat.budget_amount && (
                        <span className="text-slate-600">Budget: {formatCurrency(cat.budget_amount)}</span>
                      )}
                      <span className={`font-bold flex items-center gap-1 ${isOver ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {isOver ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {formatCurrency(cat.predicted_amount)}
                      </span>
                    </div>
                  </div>
                  {pct != null && (
                    <div className="w-full bg-slate-900/[0.05] dark:bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${isOver ? "bg-rose-500" : "bg-violet-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
