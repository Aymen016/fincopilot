"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Upload, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, mutate } = useSWR(
    ["expenses", page, dateFrom, dateTo],
    () => apiClient.getExpenses({ page, limit: 20, date_from: dateFrom || undefined, date_to: dateTo || undefined })
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {data?.total != null ? `${data.total} total transactions` : "Loading…"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/expenses/upload"
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Upload size={15} /> Import CSV
          </Link>
          <Link
            href="/expenses/new"
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Expense
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Search size={16} className="text-slate-400 shrink-0" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <ExpenseTable expenses={data?.items ?? []} onMutate={mutate} />
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm text-slate-500">
            Page <strong>{page}</strong> of <strong>{Math.ceil(data.total / 20)}</strong>
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= data.total}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
