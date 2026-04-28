"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Target, Plus, Calendar, CheckCircle2, Pencil, Trash2, Check, X } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  progress_percent: number;
  is_active: boolean;
}

export function GoalCard({ goal, onMutate }: { goal: Goal; onMutate: () => void }) {
  const [depositing, setDepositing] = useState(false);
  const [amount, setAmount] = useState("");
  const [depositError, setDepositError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: goal.name,
    description: goal.description ?? "",
    target_amount: String(goal.target_amount),
    target_date: goal.target_date,
  });

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const daysLeft = Math.max(0, Math.floor((new Date(goal.target_date).getTime() - Date.now()) / 86400000));
  const pct = Math.min(100, goal.progress_percent);
  const isComplete = pct >= 100;

  const barColor = isComplete
    ? "bg-emerald-500"
    : pct >= 70
    ? "bg-brand-500"
    : pct >= 40
    ? "bg-amber-400"
    : "bg-rose-400";

  const handleDeposit = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) return;
    setDepositError("");
    try {
      await apiClient.depositGoal(goal.id, parsed);
      onMutate();
      setDepositing(false);
      setAmount("");
    } catch (e: any) {
      setDepositError(e.message || "Deposit failed");
    }
  };

  const handleSaveEdit = async () => {
    const payload: any = {};
    if (editData.name) payload.name = editData.name;
    if (editData.description) payload.description = editData.description;
    if (editData.target_amount) payload.target_amount = parseFloat(editData.target_amount);
    if (editData.target_date) payload.target_date = editData.target_date;
    await apiClient.updateGoal(goal.id, payload);
    onMutate();
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    await apiClient.deleteGoal(goal.id);
    onMutate();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:shadow-card-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? "bg-emerald-50" : "bg-brand-50"}`}>
            {isComplete ? <CheckCircle2 size={20} className="text-emerald-600" /> : <Target size={20} className="text-brand-600" />}
          </div>
          <div>
            <p className="font-bold text-slate-900">{goal.name}</p>
            {goal.description && <p className="text-xs text-slate-400 mt-0.5">{goal.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!editing ? (
            <>
              <span className={`text-xl font-black mr-1 ${isComplete ? "text-emerald-600" : "text-brand-600"}`}>{pct}%</span>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                title="Edit goal"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Delete goal"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSaveEdit} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                <Check size={14} />
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="mb-4 space-y-2">
          <input
            value={editData.name}
            onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
            placeholder="Goal name"
            className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={editData.target_amount}
              onChange={(e) => setEditData((d) => ({ ...d, target_amount: e.target.value }))}
              placeholder="Target amount"
              className="border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <input
              type="date"
              value={editData.target_date}
              onChange={(e) => setEditData((d) => ({ ...d, target_date: e.target.value }))}
              className="border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <input
            value={editData.description}
            onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
        <div className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      {/* Numbers */}
      <div className="flex justify-between text-xs mb-4">
        <span className="font-semibold text-slate-700">{formatCurrency(goal.current_amount)} <span className="font-normal text-slate-400">saved</span></span>
        <span className="text-slate-500">of {formatCurrency(goal.target_amount)}</span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
        <Calendar size={12} />
        <span>{isComplete ? "Goal reached!" : `${formatCurrency(remaining)} to go · ${daysLeft} days left`}</span>
      </div>

      {/* Deposit */}
      {!isComplete && !editing && (
        depositing ? (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setDepositError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleDeposit(); }}
                placeholder="Amount to deposit"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                autoFocus
              />
              <button onClick={handleDeposit} className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors">
                Save
              </button>
              <button onClick={() => { setDepositing(false); setDepositError(""); }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
            {depositError && <p className="text-rose-500 text-xs">{depositError}</p>}
          </div>
        ) : (
          <button onClick={() => setDepositing(true)} className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
            <Plus size={15} /> Add deposit
          </button>
        )
      )}
    </div>
  );
}
