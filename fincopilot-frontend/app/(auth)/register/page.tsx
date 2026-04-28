"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { TrendingUp, ShieldCheck, Sparkles, Target, Mail } from "lucide-react";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: Sparkles, text: "AI-powered spending insights" },
  { icon: Target, text: "Smart savings goal tracking" },
  { icon: ShieldCheck, text: "Budget alerts before you overspend" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await apiClient.register(data.full_name, data.email, data.password);
      setPendingEmail(data.email);
      setStep("verify");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    }
  };

  const onVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    setError("");
    try {
      const tokens = await apiClient.verifyEmail(pendingEmail, code);
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const left = (
    <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 flex-col items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white blur-3xl" />
      </div>
      <div className="relative z-10 text-white max-w-xs">
        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-8 shadow-lg">
          <TrendingUp size={28} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3 leading-tight">Start your financial journey</h2>
        <p className="text-brand-200 mb-10 leading-relaxed">
          Join thousands using AI to take control of their spending and savings.
        </p>
        <ul className="space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-brand-100 text-sm">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-white" />
              </div>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (step === "verify") {
    return (
      <div className="min-h-screen flex">
        {left}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-sm animate-slide-up text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail size={28} className="text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-slate-500 text-sm mb-8">
              We sent a 6-digit code to <span className="font-medium text-slate-700">{pendingEmail}</span>
            </p>

            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-white mb-4"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
            />

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 mb-4">
                <p className="text-rose-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={onVerify}
              disabled={code.length !== 6 || verifying}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
            >
              {verifying ? "Verifying…" : "Verify & continue"}
            </button>

            <button
              onClick={() => { setStep("register"); setCode(""); setError(""); }}
              className="mt-4 text-sm text-slate-500 hover:text-slate-700"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {left}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-white" />
              </div>
              <span className="font-bold text-slate-900">FinCopilot</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Free forever, no credit card required</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                {...register("full_name")}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-white"
                placeholder="Jane Smith"
              />
              {errors.full_name && <p className="text-rose-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-white"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                {...register("password")}
                type="password"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-white"
                placeholder="Min. 8 characters"
              />
              {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                <p className="text-rose-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
            >
              {isSubmitting ? "Sending code…" : "Continue"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
