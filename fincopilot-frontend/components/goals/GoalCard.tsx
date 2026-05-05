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
    ? "bg-violet-500"
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
    <div className="glass glass-hover rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? "bg-emerald-500/15" : "bg-violet-500/15"}`}>
            {isComplete
              ? <CheckCircle2 size={19} className="text-emerald-400" />
              : <Target size={19} className="text-violet-400" />
            }
          </div>
          <div>
            <p className="font-bold text-slate-100 text-sm">{goal.name}</p>
            {goal.description && <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!editing ? (
            <>
              <span className={`text-lg font-black mr-1 ${isComplete ? "text-emerald-400" : "text-violet-400"}`}>{pct}%</span>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSaveEdit} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                <Check size={13} />
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-white/[0.05] transition-colors">
                <X size={13} />
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
            className="input-dark"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={editData.target_amount}
              onChange={(e) => setEditData((d) => ({ ...d, target_amount: e.target.value }))}
              placeholder="Target amount"
              className="input-dark"
            />
            <input
              type="date"
              value={editData.target_date}
              onChange={(e) => setEditData((d) => ({ ...d, target_date: e.target.value }))}
              className="input-dark"
              style={{ colorScheme: "dark" }}
            />
          </div>
          <input
            value={editData.description}
            onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
            placeholder="Description (optional)"
            className="input-dark"
          />
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-white/[0.06] rounded-full h-2 mb-3 overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      {/* Numbers */}
      <div className="flex justify-between text-xs mb-3">
        <span className="font-semibold text-slate-200">
          {formatCurrency(goal.current_amount)} <span className="font-normal text-slate-500">saved</span>
        </span>
        <span className="text-slate-500">of {formatCurrency(goal.target_amount)}</span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4">
        <Calendar size={11} />
        <span>{isComplete ? "🎉 Goal reached!" : `${formatCurrency(remaining)} to go · ${daysLeft} days left`}</span>
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
                className="input-dark flex-1"
                autoFocus
              />
              <button onClick={handleDeposit} className="btn-brand text-xs px-3 py-2">
                Save
              </button>
              <button onClick={() => { setDepositing(false); setDepositError(""); }} className="btn-ghost text-xs px-3 py-2">
                Cancel
              </button>
            </div>
            {depositError && <p className="text-rose-400 text-xs">{depositError}</p>}
          </div>
        ) : (
          <button
            onClick={() => setDepositing(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus size={13} /> Add deposit
          </button>
        )
      )}
    </div>
  );
}
