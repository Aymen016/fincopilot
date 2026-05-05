"use client";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { InsightCard } from "@/components/ai/InsightCard";
import { Lightbulb, Zap } from "lucide-react";

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
        <h1 className="text-xl font-bold text-white tracking-tight">AI Insights</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalized recommendations based on your spending patterns</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 glass rounded-2xl skeleton" />
          ))}
        </div>
      )}

      {!isLoading && (!insights || insights.length === 0) && (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
            <Lightbulb size={24} className="text-slate-600" />
          </div>
          <p className="font-semibold text-slate-300 text-sm">No insights yet</p>
          <p className="text-slate-600 text-xs mt-1.5">Add expenses and we&apos;ll analyze your patterns automatically</p>
        </div>
      )}

      {high.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-4 rounded-full bg-rose-500" />
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">High Priority</p>
            <span className="badge badge-rose">{high.length}</span>
          </div>
          <div className="space-y-2">
            {high.map((insight: any) => (
              <InsightCard key={insight.id} insight={insight} onDismiss={() => handleDismiss(insight.id)} />
            ))}
          </div>
        </section>
      )}

      {medium.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-4 rounded-full bg-amber-500" />
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Medium Priority</p>
            <span className="badge badge-amber">{medium.length}</span>
          </div>
          <div className="space-y-2">
            {medium.map((insight: any) => (
              <InsightCard key={insight.id} insight={insight} onDismiss={() => handleDismiss(insight.id)} />
            ))}
          </div>
        </section>
      )}

      {low.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-4 rounded-full bg-sky-500" />
            <p className="text-xs font-bold text-sky-400 uppercase tracking-widest">Informational</p>
            <span className="badge badge-sky">{low.length}</span>
          </div>
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
