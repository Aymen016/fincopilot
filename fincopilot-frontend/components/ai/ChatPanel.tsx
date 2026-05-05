"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { useChat } from "@/hooks/useChat";

const STARTERS = [
  "Why did I spend more last month?",
  "Can I afford a vacation this summer?",
  "How can I improve my savings rate?",
];

interface Props {
  onClose: () => void;
}

export function ChatPanel({ onClose }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, isLoading } = useChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[520px] flex flex-col z-50 animate-slide-in-right">
      {/* Glass panel */}
      <div
        className="flex flex-col h-full rounded-2xl overflow-hidden border border-white/[0.08]"
        style={{
          background: "rgba(13, 14, 30, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">FinCopilot AI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] text-emerald-400 font-medium">Online</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={20} className="text-violet-400" />
              </div>
              <p className="text-slate-300 text-sm font-medium mb-1">Ask me about your finances</p>
              <p className="text-slate-600 text-xs mb-5">I have full context of your spending, goals, and budgets</p>
              <div className="space-y-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="block w-full text-left text-xs bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/10 text-slate-400 hover:text-slate-200 rounded-xl px-3 py-2.5 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Sparkles size={11} className="text-violet-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600/80 text-white rounded-br-sm"
                    : "bg-white/[0.07] text-slate-200 rounded-bl-sm border border-white/[0.06]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Sparkles size={11} className="text-violet-400" />
              </div>
              <div className="bg-white/[0.07] rounded-2xl rounded-bl-sm px-3.5 py-2.5 border border-white/[0.06]">
                <Loader2 size={13} className="text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances…"
              rows={1}
              className="flex-1 resize-none bg-white/[0.05] border border-white/[0.08] focus:border-violet-500/50 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:bg-white/[0.07] transition-all min-h-[38px] max-h-24"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:shadow-glow-sm flex-shrink-0"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
