"use client";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { TrendLine } from "@/components/charts/TrendLine";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function ForecastPage() {
  const { data: forecast } = useSWR("forecast-monthly", () => apiClient.getMonthlyForecast());
  const { data: risk } = useSWR("forecast-risk", () => apiClient.getForecastRisk());

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName = nextMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Spending Forecast</h1>
        <p className="text-sm text-slate-400 mt-0.5">AI-predicted spending for {nextMonthName}</p>
      </div>

      {/* Risk flags */}
      {risk?.risk_flags?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="font-semibold text-amber-900 text-sm">Risk Alerts ({risk.risk_flags.length})</p>
          </div>
          <div className="space-y-2">
            {risk.risk_flags.map((flag: any) => (
              <div key={flag.category_id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                <span className="font-medium text-slate-900 text-sm">{flag.category_name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">Predicted: <strong>{formatCurrency(flag.predicted)}</strong></span>
                  <span className="text-slate-500">Budget: {formatCurrency(flag.budget)}</span>
                  <span className={`font-semibold ${flag.risk_level === "high" ? "text-rose-600" : "text-amber-600"}`}>
                    {flag.risk_level === "high" ? "High risk" : "Medium risk"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="font-semibold text-slate-900">Projected Total</p>
          {forecast && (
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(forecast.total_predicted)}</p>
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-slate-500 mb-3">Historical Trend</p>
        <TrendLine showForecast />
      </div>

      {/* By category */}
      {forecast?.by_category && forecast.by_category.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="font-semibold text-slate-900 mb-4">Breakdown by Category</p>
          <div className="space-y-3">
            {forecast.by_category.map((cat: any) => {
              const isOver = cat.budget_amount && cat.predicted_amount > cat.budget_amount;
              const pct = cat.budget_amount
                ? Math.min(100, Math.round((cat.predicted_amount / cat.budget_amount) * 100))
                : null;
              return (
                <div key={cat.category_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{cat.category_name}</span>
                    <div className="flex items-center gap-3 text-sm">
                      {cat.budget_amount && (
                        <span className="text-slate-400 text-xs">Budget: {formatCurrency(cat.budget_amount)}</span>
                      )}
                      <span className={`font-semibold flex items-center gap-1 ${isOver ? "text-rose-600" : "text-slate-900"}`}>
                        {isOver ? <TrendingUp size={13} /> : <TrendingDown size={13} className="text-emerald-500" />}
                        {formatCurrency(cat.predicted_amount)}
                      </span>
                    </div>
                  </div>
                  {pct != null && (
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${isOver ? "bg-rose-500" : "bg-brand-500"}`}
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
