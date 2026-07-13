"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api";

interface Expense {
  id: string;
  ai_confidence: number;
  category: { id: string; name: string; icon: string };
}

export function AIConfidencePill({ expense, onCorrected }: { expense: Expense; onCorrected: () => void }) {
  const [correcting, setCorrecting] = useState(false);
  const { data: categories } = useSWR(correcting ? "categories" : null, () => apiClient.getCategories());

  const handleCorrect = async (newCategoryId: string) => {
    await apiClient.correctCategory(expense.id, newCategoryId);
    onCorrected();
    setCorrecting(false);
  };

  const confidence = Math.round(expense.ai_confidence * 100);
  const isLow = expense.ai_confidence < 0.7;

  if (correcting) {
    return (
      <div className="flex items-center gap-1">
        <select
          autoFocus
          onChange={(e) => e.target.value && handleCorrect(e.target.value)}
          onBlur={() => setCorrecting(false)}
          className="text-xs input-dark w-auto px-2 py-1"
          defaultValue=""
        >
          <option value="">Select…</option>
          {categories?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <button
      onClick={() => setCorrecting(true)}
      title="Click to correct AI category"
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
        isLow
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/25"
          : "bg-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/25"
      }`}
    >
      AI · {confidence}%
    </button>
  );
}
