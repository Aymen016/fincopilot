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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Savings Goals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your financial milestones</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-brand text-sm px-4 py-2">
          <Plus size={15} /> New Goal
        </button>
      </div>

      {/* Summary */}
      {goals && goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Saved", value: formatCurrency(totalSaved), accent: "text-emerald-600 dark:text-emerald-400" },
            { label: "Total Target", value: formatCurrency(totalTarget), accent: "text-slate-900 dark:text-white" },
            { label: "Avg. Progress", value: `${avgProgress}%`, accent: "text-violet-600 dark:text-violet-400" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="stat-card">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
              <p className={`text-xl font-bold ${accent} tracking-tight`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* New goal form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 animate-slide-up border-violet-500/20">
          <p className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Create New Goal</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="Goal name (e.g. Emergency Fund)"
              className="input-dark col-span-2"
            />
            <input
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData((f) => ({ ...f, target_amount: e.target.value }))}
              placeholder="Target amount"
              className="input-dark"
            />
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData((f) => ({ ...f, target_date: e.target.value }))}
              className="input-dark"
            />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
              className="input-dark col-span-2 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-brand text-sm px-4 py-2">
              Create Goal
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2">
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
          <div className="col-span-2 glass rounded-2xl p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/[0.07] dark:border-white/[0.07] flex items-center justify-center mx-auto mb-4">
              <Target size={20} className="text-slate-400 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No goals yet</p>
            <p className="text-slate-500 dark:text-slate-600 text-xs mt-1.5">Create a savings goal to start tracking your progress</p>
          </div>
        )}
      </div>
    </div>
  );
}
