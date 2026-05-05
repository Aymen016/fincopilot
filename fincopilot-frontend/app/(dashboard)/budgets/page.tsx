"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { BudgetGauge } from "@/components/charts/BudgetGauge";
import { Plus, AlertTriangle, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const { data: budgets, mutate } = useSWR("budgets", () => apiClient.getBudgets());
  const { data: alerts, mutate: mutateAlerts } = useSWR("budget-alerts", () => apiClient.getBudgetAlerts());
  const { data: categories } = useSWR("categories", () => apiClient.getCategories());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category_id: "", amount_limit: "" });

  const now = new Date();

  const handleCreate = async () => {
    if (!formData.category_id || !formData.amount_limit) return;
    await apiClient.createBudget({
      category_id: formData.category_id,
      amount_limit: parseFloat(formData.amount_limit),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    mutate();
    mutateAlerts();
    setShowForm(false);
    setFormData({ category_id: "", amount_limit: "" });
  };

  const totalBudget = budgets?.reduce((s: number, b: any) => s + b.amount_limit, 0) ?? 0;
  const totalSpent = budgets?.reduce((s: number, b: any) => s + (b.spent ?? 0), 0) ?? 0;
  const remaining = Math.max(0, totalBudget - totalSpent);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Budgets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {now.toLocaleString("default", { month: "long" })} {now.getFullYear()}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-brand text-sm px-4 py-2">
          <Plus size={15} /> Set Budget
        </button>
      </div>

      {/* Summary cards */}
      {budgets && budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Budget", value: formatCurrency(totalBudget), accent: "text-violet-400" },
            { label: "Total Spent", value: formatCurrency(totalSpent), accent: totalSpent > totalBudget ? "text-rose-400" : "text-white" },
            { label: "Remaining", value: formatCurrency(remaining), accent: "text-emerald-400" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="stat-card">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
              <p className={`text-xl font-bold ${accent} tracking-tight`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="glass rounded-2xl p-4 border-amber-500/20 bg-amber-500/[0.04]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={13} className="text-amber-400" />
            </div>
            <p className="font-semibold text-amber-300 text-sm">Budget Alerts ({alerts.length})</p>
          </div>
          <div className="space-y-2">
            {alerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white/[0.03] rounded-xl px-3.5 py-2.5 border border-amber-500/10">
                <span className="flex items-center gap-2">
                  <span>{alert.category.icon}</span>
                  <span className="font-medium text-slate-200">{alert.category.name}</span>
                </span>
                <span className="text-amber-400 font-semibold text-xs">{alert.percent_used.toFixed(0)}% used</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New budget form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 animate-slide-up border-violet-500/20">
          <p className="font-semibold text-white mb-4 text-sm">New Budget</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select
              value={formData.category_id}
              onChange={(e) => setFormData((f) => ({ ...f, category_id: e.target.value }))}
              className="input-dark"
              style={{ colorScheme: "dark" }}
            >
              <option value="">Select category</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={formData.amount_limit}
              onChange={(e) => setFormData((f) => ({ ...f, amount_limit: e.target.value }))}
              placeholder="Budget amount"
              className="input-dark"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-brand text-sm px-4 py-2">
              Save Budget
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Budget gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets?.map((budget: any) => (
          <BudgetGauge
            key={budget.id}
            budget={budget}
            onUpdate={async (newLimit) => {
              await apiClient.createBudget({
                category_id: budget.category.id,
                amount_limit: newLimit,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
              });
              mutate();
              mutateAlerts();
            }}
            onDelete={async () => {
              await apiClient.deleteBudget(budget.id);
              mutate();
              mutateAlerts();
            }}
          />
        ))}
        {(!budgets || budgets.length === 0) && (
          <div className="col-span-3 glass rounded-2xl p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
              <Wallet size={20} className="text-slate-600" />
            </div>
            <p className="font-semibold text-slate-300 text-sm">No budgets set</p>
            <p className="text-slate-600 text-xs mt-1.5">Click &quot;Set Budget&quot; to start tracking your spending limits</p>
          </div>
        )}
      </div>
    </div>
  );
}
