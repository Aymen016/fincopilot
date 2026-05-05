"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { TrendingUp, ArrowRight, Sparkles, Shield, Target, Zap, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: Sparkles, label: "AI Insights", desc: "Personalized spending analysis" },
  { icon: Target, label: "Smart Goals", desc: "Savings tracking that adapts" },
  { icon: Shield, label: "Budget Alerts", desc: "Never overspend again" },
  { icon: Zap, label: "Forecasting", desc: "See next month's risks" },
];

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await apiClient.login(data.email, data.password);
      setTokens(res.access_token, res.refresh_token);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb w-[600px] h-[600px] bg-violet-600/20 -top-48 -left-24 animate-blob" />
        <div className="glow-orb w-[500px] h-[500px] bg-brand-500/15 top-1/2 -right-48 animate-blob" style={{ animationDelay: "4s" }} />
        <div className="glow-orb w-[400px] h-[400px] bg-sky-500/10 -bottom-32 left-1/3 animate-blob" style={{ animationDelay: "8s" }} />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex w-5/12 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FinCopilot</span>
        </div>

        <div>
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-white leading-[1.15] mb-4">
              Your money,{" "}
              <span className="text-gradient">intelligently</span>{" "}
              managed.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              AI-powered personal finance that helps you spend smarter and save faster — all in one dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass p-4 rounded-xl group hover:border-violet-500/20 transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center mb-3 group-hover:bg-violet-500/25 transition-colors">
                  <Icon size={15} className="text-violet-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© 2025 FinCopilot · Free forever</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-tight">FinCopilot</span>
          </div>

          <div className="glass p-8 rounded-2xl shadow-glass">
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Welcome back</h1>
              <p className="text-slate-400 text-sm">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  className="input-dark"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPw ? "text" : "password"}
                    className="input-dark pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-400 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-brand w-full py-3 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in <ArrowRight size={15} />
                  </span>
                )}
              </button>
            </form>

            <div className="divider my-6" />

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
