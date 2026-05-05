"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Receipt, Lightbulb, Wallet, Target,
  BarChart2, LogOut, MessageCircle, TrendingUp, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { useState } from "react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { apiClient } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/forecast", label: "Forecast", icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [chatOpen, setChatOpen] = useState(false);
  const { data: me } = useSWR("me", () => apiClient.getMe(), { revalidateOnFocus: false });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = me?.full_name
    ? me.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex h-screen bg-surface-0 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col flex-shrink-0 border-r border-white/[0.07] relative">
        {/* Richer background with gradient */}
        <div className="absolute inset-0 bg-[#080b14]" />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-600/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm flex-shrink-0">
                <TrendingUp size={15} className="text-white" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">FinCopilot</span>
            </div>
          </div>

          <div className="px-3 mb-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                    isActive
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                      : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-violet-400 to-violet-600" />
                  )}
                  <Icon size={16} className={isActive ? "text-violet-400" : "text-slate-600 group-hover:text-slate-400"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={12} className="text-violet-500" />}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 mb-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          </div>

          {/* Bottom actions */}
          <div className="px-3 pb-4 space-y-0.5">
            <button
              onClick={() => setChatOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 transition-all duration-150 group"
            >
              <MessageCircle size={16} className="text-slate-600 group-hover:text-slate-400" />
              AI Assistant
              <span className="ml-auto badge badge-brand text-[9px] px-1.5 py-0.5">AI</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-150 group"
            >
              <LogOut size={16} className="text-slate-600 group-hover:text-rose-400" />
              Sign out
            </button>

            {/* User card */}
            <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-glow-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{me?.full_name ?? "User"}</p>
                <p className="text-[10px] text-slate-600 truncate">{me?.email ?? ""}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-surface-0">
        {children}
      </main>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}
