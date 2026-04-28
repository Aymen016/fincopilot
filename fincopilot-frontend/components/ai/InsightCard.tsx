"use client";
import { X, TrendingUp, PiggyBank, CreditCard, RefreshCw, Repeat, BarChart2 } from "lucide-react";

const SEVERITY_CONFIG = {
  high: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    badge: "bg-rose-100 text-rose-700",
    icon: "text-rose-500",
    bar: "bg-rose-400",
  },
  medium: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    icon: "text-amber-500",
    bar: "bg-amber-400",
  },
  low: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icon: "text-blue-500",
    bar: "bg-blue-400",
  },
};

const TYPE_ICONS: Record<string, any> = {
  overspend: CreditCard,
  savings: PiggyBank,
  pattern: TrendingUp,
  subscription: Repeat,
  goal: BarChart2,
  forecast: RefreshCw,
};

interface Insight {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  body: string;
}

export function InsightCard({ insight, onDismiss }: { insight: Insight; onDismiss?: () => void }) {
  const cfg = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.low;
  const Icon = TYPE_ICONS[insight.type] ?? TrendingUp;

  return (
    <div className={`relative bg-white border rounded-2xl p-4 shadow-card hover:shadow-card-md transition-shadow group ${cfg.border}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${cfg.bar}`} />

      <div className="flex items-start gap-3 pl-3">
        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon size={15} className={cfg.icon} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm text-slate-900">{insight.title}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {insight.severity}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{insight.body}</p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all shrink-0 p-0.5 rounded-lg hover:bg-slate-100"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
