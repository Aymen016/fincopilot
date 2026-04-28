"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Receipt, Lightbulb, Wallet, Target,
  BarChart2, LogOut, MessageCircle, TrendingUp, Settings,
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">FinCopilot</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + actions */}
        <div className="px-3 py-4 border-t border-slate-800/60 space-y-1">
          <button
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all duration-150"
          >
            <MessageCircle size={17} />
            AI Assistant
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all duration-150"
          >
            <LogOut size={17} />
            Sign out
          </button>

          {/* User pill */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl bg-slate-800/50">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{me?.full_name ?? "User"}</p>
              <p className="text-xs text-slate-500 truncate">{me?.email ?? ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}
