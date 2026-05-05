"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Upload, Search, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
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

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data?.total != null ? `${data.total} total transactions` : "Loading…"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/expenses/upload" className="btn-ghost text-sm">
            <Upload size={14} /> Import CSV
          </Link>
          <Link href="/expenses/new" className="btn-brand text-sm px-4 py-2">
            <Plus size={14} /> Add Expense
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-2xl">
        <div className="flex items-center gap-4 flex-wrap">
          <Search size={15} className="text-slate-500 shrink-0" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap font-medium">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input-dark w-auto px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap font-medium">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input-dark w-auto px-3 py-1.5 text-sm"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <ExpenseTable expenses={data?.items ?? []} onMutate={mutate} />
        {(!data?.items?.length) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Receipt size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">No expenses found</p>
            <Link href="/expenses/new" className="text-violet-400 text-xs font-semibold hover:text-violet-300 transition-colors">
              + Add your first expense
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost px-3 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    page === pageNum
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= data.total}
            className="btn-ghost px-3 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
