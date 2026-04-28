"use client";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { InsightCard } from "@/components/ai/InsightCard";
import { Lightbulb } from "lucide-react";

export default function InsightsPage() {
  const { data: insights, mutate, isLoading } = useSWR("insights", () => apiClient.getInsights());

  const handleDismiss = async (id: string) => {
    await apiClient.dismissInsight(id);
    mutate();
  };

  const high = insights?.filter((i: any) => i.severity === "high") ?? [];
  const medium = insights?.filter((i: any) => i.severity === "medium") ?? [];
  const low = insights?.filter((i: any) => i.severity === "low") ?? [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Insights</h1>
        <p className="text-sm text-slate-400 mt-0.5">Personalized recommendations based on your spending patterns</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!insights || insights.length === 0) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-14 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lightbulb size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No insights yet</p>
          <p className="text-slate-400 text-sm mt-1">Add expenses and we&apos;ll analyze your patterns automatically</p>
        </div>
      )}

      {high.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-3">High Priority</p>
          <div className="space-y-2">
            {high.map((insight: any) => (
              <InsightCard key={insight.id} insight={insight} onDismiss={() => handleDismiss(insight.id)} />
            ))}
          </div>
        </section>
      )}

      {medium.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">Medium Priority</p>
          <div className="space-y-2">
            {medium.map((insight: any) => (
              <InsightCard key={insight.id} insight={insight} onDismiss={() => handleDismiss(insight.id)} />
            ))}
          </div>
        </section>
      )}

      {low.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Informational</p>
          <div className="space-y-2">
            {low.map((insight: any) => (
              <InsightCard key={insight.id} insight={insight} onDismiss={() => handleDismiss(insight.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
