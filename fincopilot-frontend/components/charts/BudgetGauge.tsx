"use client";
import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Budget {
  id: string;
  category: { name: string; icon: string; color: string };
  amount_limit: number;
  spent: number;
  percent_used: number;
  is_over_budget: boolean;
}

interface Props {
  budget: Budget;
  onUpdate: (newLimit: number) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function BudgetGauge({ budget, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(budget.amount_limit));
  const [saving, setSaving] = useState(false);

  const pct = Math.min(budget.percent_used, 100);
  const remaining = Math.max(0, budget.amount_limit - budget.spent);

  const isOver = budget.is_over_budget;
  const isNear = !isOver && pct >= 80;
  const barColor = isOver ? "bg-rose-500" : isNear ? "bg-amber-400" : "bg-emerald-500";
  const statusText = isOver ? "Over budget" : isNear ? "Near limit" : "On track";
  const statusColor = isOver ? "text-rose-400" : isNear ? "text-amber-400" : "text-emerald-400";
  const glowBorder = isOver ? "group-hover:border-rose-500/20" : isNear ? "group-hover:border-amber-500/20" : "group-hover:border-emerald-500/20";

  const handleSave = async () => {
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    setSaving(true);
    await onUpdate(num);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete budget for ${budget.category.name}?`)) return;
    await onDelete();
  };

  return (
    <div className={`glass glass-hover rounded-2xl p-5 group ${glowBorder} transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">
            {budget.category.icon}
          </div>
          <div>
            <p className="font-semibold text-slate-100 text-sm">{budget.category.name}</p>
            <p className={`text-xs font-semibold ${statusColor}`}>{statusText}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!editing && (
            <>
              <button
                onClick={() => { setValue(String(budget.amount_limit)); setEditing(true); }}
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
          )}
          {editing && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/[0.05] transition-colors"
              >
                <X size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="mb-3">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            className="input-dark"
            placeholder="New budget limit (PKR)"
          />
        </div>
      )}

      <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-3 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-300">
          {formatCurrency(budget.spent)} <span className="font-normal text-slate-600">spent</span>
        </span>
        <span>
          {isOver ? (
            <span className="text-rose-400 font-semibold">{formatCurrency(budget.spent - budget.amount_limit)} over</span>
          ) : (
            <span>{formatCurrency(remaining)} left of {formatCurrency(budget.amount_limit)}</span>
          )}
        </span>
      </div>
    </div>
  );
}
