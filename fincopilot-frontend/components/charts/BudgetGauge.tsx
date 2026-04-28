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

  const { barColor, bgColor, textColor, status } =
    budget.is_over_budget
      ? { barColor: "bg-rose-500", bgColor: "bg-rose-50 border-rose-100", textColor: "text-rose-600", status: "Over budget" }
      : pct >= 80
      ? { barColor: "bg-amber-400", bgColor: "bg-amber-50 border-amber-100", textColor: "text-amber-600", status: "Near limit" }
      : { barColor: "bg-emerald-500", bgColor: "bg-white border-slate-100", textColor: "text-emerald-600", status: "On track" };

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
    <div className={`rounded-2xl border shadow-card p-5 hover:shadow-card-md transition-shadow ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
            {budget.category.icon}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{budget.category.name}</p>
            <p className={`text-xs font-medium ${textColor}`}>{status}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!editing && (
            <>
              <button
                onClick={() => { setValue(String(budget.amount_limit)); setEditing(true); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                title="Edit limit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Delete budget"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          {editing && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline edit input */}
      {editing && (
        <div className="mb-3">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            placeholder="New budget limit (PKR)"
          />
        </div>
      )}

      <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span className="font-medium">
          {formatCurrency(budget.spent)} <span className="font-normal text-slate-400">spent</span>
        </span>
        <span>
          {budget.is_over_budget ? (
            <span className="text-rose-600 font-medium">{formatCurrency(budget.spent - budget.amount_limit)} over</span>
          ) : (
            <span>{formatCurrency(remaining)} left of {formatCurrency(budget.amount_limit)}</span>
          )}
        </span>
      </div>
    </div>
  );
}
