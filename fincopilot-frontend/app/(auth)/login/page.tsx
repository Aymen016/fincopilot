"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { TrendingUp, ArrowRight, Sparkles, Shield, Target, Zap, Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";

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
  const [step, setStep] = useState<"login" | "verify">("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await apiClient.login(data.email, data.password);
      setPendingEmail(data.email);
      setStep("verify");
      setResendCooldown(30);
    } catch (e: any) {
      setError(e.message || "Login failed");
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setResendMsg("");
    try {
      await apiClient.resendCode(pendingEmail);
      setResendMsg("A new code has been sent.");
      setResendCooldown(30);
    } catch (e: any) {
      setError(e.message || "Couldn't resend code");
    }
  };

  const handleCodeInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0) codeRefs.current[idx - 1]?.focus();
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setCode(next);
      codeRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const onVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;
    setVerifying(true);
    setError("");
    try {
      const tokens = await apiClient.verifyEmail(pendingEmail, fullCode) as { access_token: string; refresh_token: string };
      setTokens(tokens.access_token, tokens.refresh_token);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  if (step === "verify") {
    const fullCode = code.join("");
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-8 overflow-hidden">
        {/* Background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="glow-orb w-[600px] h-[600px] bg-violet-600/20 -top-48 -left-24 animate-blob" />
          <div className="glow-orb w-[400px] h-[400px] bg-sky-500/10 -bottom-32 left-1/3 animate-blob" style={{ animationDelay: "4s" }} />
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          <div className="glass p-8 rounded-2xl shadow-glass text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <Mail size={28} className="text-violet-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Verify it&apos;s you</h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              We sent a 6-digit verification code to{" "}
              <span className="text-white font-medium">{pendingEmail}</span>
            </p>

            {/* OTP input */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handleCodePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { codeRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeInput(idx, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Backspace" && !digit && idx > 0) {
                      codeRefs.current[idx - 1]?.focus();
                    }
                  }}
                  className={`w-11 h-13 text-center text-xl font-bold rounded-xl border transition-all duration-200 outline-none bg-white/[0.04] text-white
                    ${digit
                      ? "border-violet-500/60 bg-violet-500/10 shadow-glow-sm"
                      : "border-white/10 focus:border-violet-500/50 focus:bg-white/[0.06]"
                    }`}
                  style={{ height: "3.25rem" }}
                />
              ))}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            {resendMsg && !error && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-emerald-400 text-sm">{resendMsg}</p>
              </div>
            )}

            {fullCode.length === 6 && (
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs mb-4">
                <CheckCircle2 size={13} />
                <span>Code entered</span>
              </div>
            )}

            <button
              onClick={onVerify}
              disabled={fullCode.length !== 6 || verifying}
              className="btn-brand w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  Verify &amp; continue <ArrowRight size={15} />
                </span>
              )}
            </button>

            <div className="mt-5 text-sm text-slate-500">
              Didn&apos;t get it?{" "}
              <button
                onClick={onResend}
                disabled={resendCooldown > 0}
                className="text-violet-400 font-semibold hover:text-violet-300 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            <button
              onClick={() => { setStep("login"); setCode(["", "", "", "", "", ""]); setError(""); setResendMsg(""); }}
              className="mt-3 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                    Sending code…
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
