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
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-semibold text-amber-900 text-sm">Forecast Alert</p>
        <p className="text-amber-800 text-sm mt-0.5">
          On track to exceed <strong>{topRisk.category_name}</strong> budget by{" "}
          <strong>{formatCurrency(topRisk.overspend_by)}</strong> this month.
          {riskFlags.length > 1 && ` (+${riskFlags.length - 1} more categories at risk)`}
        </p>
      </div>
    </div>
  );
}
