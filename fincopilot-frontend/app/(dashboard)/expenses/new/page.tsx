"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import useSWR from "swr";
import { ArrowLeft, Plus } from "lucide-react";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  merchant: z.string().optional(),
  expense_date: z.string().min(1, "Date is required"),
  category_id: z.string().min(1, "Please select a category"),
});
type FormData = z.infer<typeof schema>;

export default function NewExpensePage() {
  const router = useRouter();
  const { data: categories, isLoading: catsLoading } = useSWR("categories", () => apiClient.getCategories());
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { expense_date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: FormData) => {
    await apiClient.createExpense(data);
    router.push("/expenses");
  };

  return (
    <div className="p-6 max-w-xl animate-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Add Expense</h1>
        <p className="text-sm text-slate-500 mt-0.5">Record a new transaction</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Amount (PKR)</label>
            <input
              {...register("amount")}
              type="number"
              step="1"
              className="input-dark"
              placeholder="0"
            />
            {errors.amount && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Date</label>
            <input
              {...register("expense_date")}
              type="date"
              className="input-dark"
            />
            {errors.expense_date && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5">{errors.expense_date.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
          <input
            {...register("description")}
            className="input-dark"
            placeholder="e.g. Starbucks coffee"
          />
          {errors.description && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Merchant <span className="text-slate-400 dark:text-slate-600 normal-case font-normal">(optional)</span>
          </label>
          <input
            {...register("merchant")}
            className="input-dark"
            placeholder="e.g. Carrefour"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
          <select
            {...register("category_id")}
            className="input-dark"
            disabled={catsLoading}
          >
            <option value="">— Select a category —</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5">{errors.category_id.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || catsLoading}
          className="btn-brand w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <Plus size={15} /> Add Expense
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
