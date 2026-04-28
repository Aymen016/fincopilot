"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { GoalCard } from "@/components/goals/GoalCard";
import { Plus, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function GoalsPage() {
  const { data: goals, mutate } = useSWR("goals", () => apiClient.getGoals());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", target_amount: "", target_date: "", description: "" });

  const handleCreate = async () => {
    if (!formData.name || !formData.target_amount || !formData.target_date) return;
    await apiClient.createGoal({
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      target_date: formData.target_date,
      description: formData.description || undefined,
    });
    mutate();
    setShowForm(false);
    setFormData({ name: "", target_amount: "", target_date: "", description: "" });
  };

  const totalSaved = goals?.reduce((s: number, g: any) => s + g.current_amount, 0) ?? 0;
  const totalTarget = goals?.reduce((s: number, g: any) => s + g.target_amount, 0) ?? 0;
  const avgProgress = goals?.length
    ? Math.round(goals.reduce((s: number, g: any) => s + g.progress_percent, 0) / goals.length)
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Savings Goals</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track your financial milestones</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Summary */}
      {goals && goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Saved", value: formatCurrency(totalSaved), color: "text-emerald-600" },
            { label: "Total Target", value: formatCurrency(totalTarget), color: "text-slate-900" },
            { label: "Avg. Progress", value: `${avgProgress}%`, color: "text-brand-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* New goal form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 animate-slide-up">
          <p className="font-semibold text-slate-900 mb-4">Create New Goal</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="Goal name (e.g. Emergency Fund)"
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <input
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData((f) => ({ ...f, target_amount: e.target.value }))}
              placeholder="Target amount"
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData((f) => ({ ...f, target_date: e.target.value }))}
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm col-span-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors">
              Create Goal
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals?.map((goal: any) => (
          <GoalCard key={goal.id} goal={goal} onMutate={mutate} />
        ))}
        {(!goals || goals.length === 0) && (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-14 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Target size={20} className="text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">No goals yet</p>
            <p className="text-slate-400 text-sm mt-1">Create a savings goal to start tracking your progress</p>
          </div>
        )}
      </div>
    </div>
  );
}
