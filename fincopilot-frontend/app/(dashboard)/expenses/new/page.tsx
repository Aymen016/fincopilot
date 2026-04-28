"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";

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
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Add Expense</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (PKR)</label>
            <input
              {...register("amount")}
              type="number"
              step="1"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              placeholder="0"
            />
            {errors.amount && <p className="text-rose-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              {...register("expense_date")}
              type="date"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            {errors.expense_date && <p className="text-rose-500 text-xs mt-1">{errors.expense_date.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <input
            {...register("description")}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            placeholder="e.g. Starbucks coffee"
          />
          {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Merchant <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            {...register("merchant")}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            placeholder="e.g. Carrefour"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
          <select
            {...register("category_id")}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            disabled={catsLoading}
          >
            <option value="">— Select a category —</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-rose-500 text-xs mt-1">{errors.category_id.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || catsLoading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
        >
          {isSubmitting ? "Saving…" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
