"use client";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RiskFlag {
  category_name: string;
  predicted: number;
  budget: number;
  risk_level: string;
  overspend_by: number;
}

export function ForecastBanner({ riskFlags }: { riskFlags: RiskFlag[] }) {
  const topRisk = riskFlags[0];
  if (!topRisk) return null;

  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3 border-amber-500/15 bg-amber-500/[0.04]">
      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle size={14} className="text-amber-400" />
      </div>
      <div>
        <p className="font-semibold text-amber-300 text-sm">Forecast Alert</p>
        <p className="text-amber-500/80 text-xs mt-0.5 leading-relaxed">
          On track to exceed <strong className="text-amber-400">{topRisk.category_name}</strong> budget by{" "}
          <strong className="text-amber-400">{formatCurrency(topRisk.overspend_by)}</strong> this month.
          {riskFlags.length > 1 && ` (+${riskFlags.length - 1} more at risk)`}
        </p>
      </div>
    </div>
  );
}
