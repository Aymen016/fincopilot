"use client";
import { X, TrendingUp, PiggyBank, CreditCard, RefreshCw, Repeat, BarChart2 } from "lucide-react";

const SEVERITY_CONFIG = {
  high: {
    bar: "bg-rose-500",
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-400",
    badge: "badge-rose",
    border: "border-rose-500/15",
  },
  medium: {
    bar: "bg-amber-400",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-400",
    badge: "badge-amber",
    border: "border-amber-500/15",
  },
  low: {
    bar: "bg-sky-400",
    iconBg: "bg-sky-500/15",
    iconText: "text-sky-400",
    badge: "badge-sky",
    border: "border-sky-500/15",
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
    <div className={`relative glass glass-hover rounded-2xl p-4 group border ${cfg.border}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${cfg.bar}`} />

      <div className="flex items-start gap-3 pl-3">
        <div className={`w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon size={14} className={cfg.iconText} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-semibold text-sm text-slate-100">{insight.title}</p>
            <span className={`badge ${cfg.badge}`}>{insight.severity}</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{insight.body}</p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-300 transition-all shrink-0 p-1 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
