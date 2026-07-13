"use client";
import { AIConfidencePill } from "./AIConfidencePill";
import { Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface Expense {
  id: string;
  amount: number;
  description: string;
  merchant: string | null;
  expense_date: string;
  category: { id: string; name: string; icon: string };
  ai_confidence: number;
  is_corrected: boolean;
}

interface Props {
  expenses: Expense[];
  onMutate: () => void;
}

export function ExpenseTable({ expenses, onMutate }: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await apiClient.deleteExpense(id);
    onMutate();
  };

  if (!expenses.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-900/[0.06] dark:border-white/[0.05]">
            <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
            <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
            <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
            <th className="text-right px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
            <th className="px-5 py-3.5 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900/[0.04] dark:divide-white/[0.04]">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
              <td className="px-5 py-3.5 text-slate-500 dark:text-slate-600 whitespace-nowrap text-xs tabular-nums">
                {new Date(expense.expense_date).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
              </td>
              <td className="px-5 py-3.5">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{expense.description}</p>
                  {expense.merchant && <p className="text-xs text-slate-500 dark:text-slate-600">{expense.merchant}</p>}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900/[0.05] dark:bg-white/[0.05] border border-slate-900/[0.06] dark:border-white/[0.06] flex items-center justify-center text-sm">
                    {expense.category?.icon}
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{expense.category?.name}</span>
                  {!expense.is_corrected && expense.ai_confidence < 1.0 && (
                    <AIConfidencePill expense={expense} onCorrected={onMutate} />
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(expense.amount)}
              </td>
              <td className="px-5 py-3.5">
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-all p-1 rounded-lg hover:bg-rose-500/10"
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
