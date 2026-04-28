"use client";
import useSWR from "swr";
import { useMemo } from "react";
import { apiClient } from "@/lib/api";
import { HealthScoreRing } from "@/components/charts/HealthScoreRing";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { TrendLine } from "@/components/charts/TrendLine";
import { InsightCard } from "@/components/ai/InsightCard";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Wallet, PiggyBank, Activity, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 hover:shadow-card-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      {sub && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          {trend === "up" && <ArrowUpRight size={12} className="text-rose-500" />}
          {trend === "down" && <ArrowDownRight size={12} className="text-emerald-500" />}
          {sub}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: score } = useSWR("health-score", () => apiClient.getHealthScore());
  const { data: insights } = useSWR("insights", () => apiClient.getInsights());
  const { data: recentExpenses } = useSWR("expenses-recent", () => apiClient.getExpenses({ limit: 6 }));
  const { data: monthExpenses } = useSWR("expenses-month", () =>
    apiClient.getExpenses({ date_from: monthStart, limit: 500 })
  );
  const { data: budgets } = useSWR("budgets", () => apiClient.getBudgets());
  const { data: risk } = useSWR("forecast-risk", () => apiClient.getForecastRisk());

  const monthTotal = useMemo(
    () => monthExpenses?.items?.reduce((s: number, e: any) => s + e.amount, 0) ?? 0,
    [monthExpenses]
  );

  const budgetAdherence = useMemo(() => {
    if (!budgets?.length) return null;
    const onTrack = budgets.filter((b: any) => !b.is_over_budget).length;
    return Math.round((onTrack / budgets.length) * 100);
  }, [budgets]);

  const savingsRate = score?.breakdown?.savings_rate?.value;
  const savingsRatePct = savingsRate != null ? Math.round(savingsRate * 100) : null;

  const monthName = now.toLocaleString("default", { month: "long" });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">{monthName} {now.getFullYear()} · Financial overview</p>
        </div>
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          + Add Expense
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Spent This Month"
          value={formatCurrency(monthTotal)}
          sub={monthExpenses?.total ? `${monthExpenses.total} transactions` : undefined}
          icon={Receipt}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
        />
        <StatCard
          title="Budget Adherence"
          value={budgetAdherence != null ? `${budgetAdherence}%` : "—"}
          sub={budgets?.length ? `${budgets.filter((b: any) => b.is_over_budget).length} over limit` : "No budgets set"}
          icon={Wallet}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={budgetAdherence != null && budgetAdherence < 70 ? "up" : "down"}
        />
        <StatCard
          title="Savings Rate"
          value={savingsRatePct != null ? `${savingsRatePct}%` : "—"}
          sub={savingsRatePct != null ? (savingsRatePct >= 10 ? "On track ✓" : "Below 10% target") : "Add income"}
          icon={PiggyBank}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          trend={savingsRatePct != null && savingsRatePct < 10 ? "up" : "down"}
        />
        <StatCard
          title="Health Score"
          value={score ? `${score.score}` : "—"}
          sub={score ? `Grade ${score.grade} · ${score.trend}` : "Loading…"}
          icon={Activity}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Risk banner */}
      {risk?.risk_flags?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Forecast Warning</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {risk.risk_flags.map((f: any) => `${f.category_name} may exceed budget by ${formatCurrency(f.overspend_by)}`).join(" · ")}
            </p>
          </div>
          <Link href="/forecast" className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap">
            View forecast →
          </Link>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-700 mb-4 self-start">Health Score</p>
          {score ? (
            <HealthScoreRing score={score.score} grade={score.grade} trend={score.trend} />
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-100 animate-pulse" />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Spending by Category</p>
          {monthExpenses?.items?.length ? (
            <SpendingDonut expenses={monthExpenses.items} />
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Spending Trend</p>
          <TrendLine />
        </div>
      </div>

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">AI Insights</h2>
              <span className="text-xs font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                {insights.length}
              </span>
            </div>
            <Link href="/insights" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.slice(0, 4).map((insight: any) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
          <Link href="/expenses" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
        {recentExpenses?.items?.length ? (
          <div className="space-y-1">
            {recentExpenses.items.map((e: any) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
                    {e.category?.icon || "💰"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{e.description}</p>
                    <p className="text-xs text-slate-400">{e.category?.name} · {e.expense_date}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-6">
            No expenses yet.{" "}
            <Link href="/expenses/new" className="text-brand-600 hover:underline">Add one</Link>
          </p>
        )}
      </div>
    </div>
  );
}
