"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { BudgetGauge } from "@/components/charts/BudgetGauge";
import { Plus, AlertTriangle } from "lucide-react";
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
  const overCount = budgets?.filter((b: any) => b.is_over_budget).length ?? 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Budgets</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {now.toLocaleString("default", { month: "long" })} {now.getFullYear()}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {/* Summary row */}
      {budgets && budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Budget", value: formatCurrency(totalBudget), color: "text-slate-900" },
            { label: "Total Spent", value: formatCurrency(totalSpent), color: totalSpent > totalBudget ? "text-rose-600" : "text-slate-900" },
            { label: "Remaining", value: formatCurrency(Math.max(0, totalBudget - totalSpent)), color: "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="font-semibold text-amber-900 text-sm">Budget Alerts ({alerts.length})</p>
          </div>
          <div className="space-y-2">
            {alerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                <span className="flex items-center gap-2">
                  <span>{alert.category.icon}</span>
                  <span className="font-medium text-slate-900">{alert.category.name}</span>
                </span>
                <span className="text-amber-700 font-semibold">{alert.percent_used.toFixed(0)}% used</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New budget form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 animate-slide-up">
          <p className="font-semibold text-slate-900 mb-4">New Budget</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select
              value={formData.category_id}
              onChange={(e) => setFormData((f) => ({ ...f, category_id: e.target.value }))}
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors">
              Save Budget
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
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
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-card p-14 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Plus size={20} className="text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">No budgets set</p>
            <p className="text-slate-400 text-sm mt-1">Click &quot;Set Budget&quot; to start tracking your spending limits</p>
          </div>
        )}
      </div>
    </div>
  );
}
