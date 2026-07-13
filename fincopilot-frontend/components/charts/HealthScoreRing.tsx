"use client";
import { useTheme } from "next-themes";

interface Props {
  score: number;
  grade: string;
  trend: string;
}

export function HealthScoreRing({ score, grade, trend }: Props) {
  const { resolvedTheme } = useTheme();
  const trackColor = resolvedTheme === "light" ? "rgba(15,23,42,0.07)" : "rgba(255,255,255,0.06)";
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const { color, glowColor, label } =
    clampedScore >= 80
      ? { color: "#34d399", glowColor: "rgba(52,211,153,0.25)", label: "Excellent" }
      : clampedScore >= 65
      ? { color: "#a78bfa", glowColor: "rgba(167,139,250,0.25)", label: "Good" }
      : clampedScore >= 50
      ? { color: "#fbbf24", glowColor: "rgba(251,191,36,0.25)", label: "Fair" }
      : { color: "#fb7185", glowColor: "rgba(251,113,133,0.25)", label: "Needs work" };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        {/* Glow behind ring */}
        <div
          className="absolute inset-4 rounded-full blur-xl opacity-60"
          style={{ backgroundColor: glowColor }}
        />
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 relative z-10">
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{clampedScore}</span>
          <span className="text-sm font-bold" style={{ color }}>{grade}</span>
        </div>
      </div>
      <p className="text-xs font-semibold mt-2" style={{ color }}>{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{trend}</p>
    </div>
  );
}
