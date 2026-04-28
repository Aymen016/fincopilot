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

  if (!expenses.length) {
    return (
      <div className="p-14 text-center text-slate-400">
        <p className="font-medium">No expenses found</p>
        <p className="text-sm mt-1">
          <a href="/expenses/new" className="text-brand-600 hover:text-brand-700">Add your first expense</a>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Category</th>
            <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
            <th className="px-5 py-3.5 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors group">
              <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                {new Date(expense.expense_date).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
              </td>
              <td className="px-5 py-3.5">
                <div>
                  <p className="font-medium text-slate-900">{expense.description}</p>
                  {expense.merchant && <p className="text-xs text-slate-400">{expense.merchant}</p>}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                    {expense.category?.icon}
                  </div>
                  <span className="text-slate-700">{expense.category?.name}</span>
                  {!expense.is_corrected && expense.ai_confidence < 1.0 && (
                    <AIConfidencePill expense={expense} onCorrected={onMutate} />
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                {formatCurrency(expense.amount)}
              </td>
              <td className="px-5 py-3.5">
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
