"use client";
import useSWR from "swr";
import { useMemo } from "react";
import { apiClient } from "@/lib/api";
import { HealthScoreRing } from "@/components/charts/HealthScoreRing";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { TrendLine } from "@/components/charts/TrendLine";
import { InsightCard } from "@/components/ai/InsightCard";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt, Wallet, PiggyBank, Activity, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Plus, Zap, Sparkles, TrendingUp,
} from "lucide-react";
import Link from "next/link";

const ACCENT = {
  violet: {
    icon: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/20",
    bar: "from-violet-500 to-violet-400",
    border: "hover:border-violet-500/30",
    glow: "hover:shadow-[0_8px_32px_rgba(124,58,237,0.2)]",
    value: "text-violet-700 dark:text-violet-300",
  },
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/20",
    bar: "from-emerald-500 to-emerald-400",
    border: "hover:border-emerald-500/30",
    glow: "hover:shadow-[0_8px_32px_rgba(16,185,129,0.2)]",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  sky: {
    icon: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-500/20",
    bar: "from-sky-500 to-sky-400",
    border: "hover:border-sky-500/30",
    glow: "hover:shadow-[0_8px_32px_rgba(14,165,233,0.2)]",
    value: "text-sky-700 dark:text-sky-300",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/20",
    bar: "from-amber-500 to-amber-400",
    border: "hover:border-amber-500/30",
    glow: "hover:shadow-[0_8px_32px_rgba(251,191,36,0.2)]",
    value: "text-amber-700 dark:text-amber-300",
  },
};

function StatCard({
  title, value, sub, icon: Icon, accent, trend, delay = 0,
}: {
  title: string; value: string; sub?: string; icon: any;
  accent: keyof typeof ACCENT; trend?: "up" | "down"; delay?: number;
}) {
  const a = ACCENT[accent];
  return (
    <div
      className={`stat-card ${a.border} ${a.glow} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl ${a.iconBg} flex items-center justify-center`}>
          <Icon size={16} className={a.icon} />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight mb-1.5 ${a.value}`}>{value}</p>
      {sub && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          {trend === "up" && <ArrowUpRight size={11} className="text-rose-600 dark:text-rose-400" />}
          {trend === "down" && <ArrowDownRight size={11} className="text-emerald-600 dark:text-emerald-400" />}
          {sub}
        </p>
      )}
      {/* Bottom accent bar */}
      <div className={`mt-4 h-0.5 w-12 rounded-full bg-gradient-to-r ${a.bar} opacity-60`} />
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
  const { data: me } = useSWR("me", () => apiClient.getMe(), { revalidateOnFocus: false });

  const monthTotal = useMemo(
    () => monthExpenses?.items?.reduce((s: number, e: any) => s + e.amount, 0) ?? 0,
    [monthExpenses]
  );
  const budgetAdherence = useMemo(() => {
    if (!budgets?.length) return null;
    return Math.round((budgets.filter((b: any) => !b.is_over_budget).length / budgets.length) * 100);
  }, [budgets]);

  const savingsRate = score?.breakdown?.savings_rate?.value;
  const savingsRatePct = savingsRate != null ? Math.round(savingsRate * 100) : null;
  const monthName = now.toLocaleString("default", { month: "long" });
  const firstName = me?.full_name?.split(" ")[0] ?? null;

  return (
    <div className="min-h-full">
      {/* Hero header with gradient */}
      <div className="relative overflow-hidden px-6 pt-8 pb-6">
        {/* Ambient gradient behind the header */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-sky-600/5 pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-brand-gradient flex items-center justify-center">
                <Sparkles size={11} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Overview</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {firstName ? `Good to see you, ${firstName} 👋` : "Dashboard"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{monthName} {now.getFullYear()} · Financial overview</p>
          </div>
          <Link href="/expenses/new" className="btn-brand px-4 py-2.5 text-sm">
            <Plus size={15} /> Add Expense
          </Link>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Spent This Month" value={formatCurrency(monthTotal)}
            sub={monthExpenses?.total ? `${monthExpenses.total} transactions` : "No transactions yet"}
            icon={Receipt} accent="violet" delay={0}
          />
          <StatCard
            title="Budget Adherence" value={budgetAdherence != null ? `${budgetAdherence}%` : "—"}
            sub={budgets?.length ? `${budgets.filter((b: any) => b.is_over_budget).length} over limit` : "No budgets set"}
            icon={Wallet} accent="emerald"
            trend={budgetAdherence != null && budgetAdherence < 70 ? "up" : "down"} delay={80}
          />
          <StatCard
            title="Savings Rate" value={savingsRatePct != null ? `${savingsRatePct}%` : "—"}
            sub={savingsRatePct != null ? (savingsRatePct >= 10 ? "On track ✓" : "Below 10% target") : "Add income"}
            icon={PiggyBank} accent="sky"
            trend={savingsRatePct != null && savingsRatePct < 10 ? "up" : "down"} delay={160}
          />
          <StatCard
            title="Health Score" value={score ? `${score.score}` : "—"}
            sub={score ? `Grade ${score.grade} · ${score.trend}` : "Calculating…"}
            icon={Activity} accent="amber" delay={240}
          />
        </div>

        {/* Risk banner */}
        {risk?.risk_flags?.length > 0 && (
          <div className="glass rounded-2xl p-4 flex items-start gap-3 border-amber-500/20 bg-amber-500/[0.06] animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Forecast Warning</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-0.5 leading-relaxed">
                {risk.risk_flags.map((f: any) => `${f.category_name} may exceed budget by ${formatCurrency(f.overspend_by)}`).join(" · ")}
              </p>
            </div>
            <Link href="/forecast" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 whitespace-nowrap transition-colors px-2">
              View →
            </Link>
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Health Ring */}
          <div className="glass p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 self-start relative z-10">Health Score</p>
            <div className="relative z-10">
              {score ? (
                <HealthScoreRing score={score.score} grade={score.grade} trend={score.trend} />
              ) : (
                <div className="w-32 h-32 rounded-full skeleton" />
              )}
            </div>
          </div>

          {/* Spending Donut */}
          <div className="glass p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600/5 to-transparent pointer-events-none" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 relative z-10">Spending by Category</p>
            <div className="relative z-10">
              {monthExpenses?.items?.length ? (
                <SpendingDonut expenses={monthExpenses.items} />
              ) : (
                <div className="h-44 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                  <Receipt size={24} className="opacity-40" />
                  <p className="text-sm">No expenses this month</p>
                </div>
              )}
            </div>
          </div>

          {/* Trend */}
          <div className="glass p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent pointer-events-none" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 relative z-10">Spending Trend</p>
            <div className="relative z-10">
              <TrendLine />
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {insights && insights.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-glow-sm">
                  <Zap size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">AI Insights</h2>
                <span className="badge badge-brand">{insights.length}</span>
              </div>
              <Link href="/insights" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.slice(0, 4).map((insight: any, i: number) => (
                <div key={insight.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                  <InsightCard insight={insight} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          {/* Header with gradient */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900/[0.06] dark:border-white/[0.05] bg-gradient-to-r from-slate-900/[0.02] dark:from-white/[0.03] to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900/[0.05] dark:bg-white/[0.07] flex items-center justify-center">
                <TrendingUp size={13} className="text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Transactions</h2>
            </div>
            <Link href="/expenses" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
              View all →
            </Link>
          </div>

          {recentExpenses?.items?.length ? (
            <div className="divide-y divide-slate-900/[0.04] dark:divide-white/[0.04]">
              {recentExpenses.items.map((e: any, i: number) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between py-3 px-5 hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.03] transition-colors group animate-fade-in"
                  style={{ animationDelay: `${300 + i * 50}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.06] border border-slate-900/[0.06] dark:border-white/[0.08] flex items-center justify-center text-base flex-shrink-0 group-hover:border-slate-900/[0.1] dark:group-hover:border-white/[0.12] transition-colors">
                      {e.category?.icon || "💰"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{e.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-600">{e.category?.name} · {e.expense_date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                <Receipt size={20} className="text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm">No expenses yet</p>
              <Link href="/expenses/new" className="text-violet-400 text-xs font-bold hover:text-violet-300 transition-colors">
                + Add your first expense
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
