"use client";

import { useState, useRef, useEffect } from "react";
import { AppState } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "brain";
  text: string;
  timestamp: Date;
}

interface Props {
  state: AppState;
}

const SUGGESTIONS = [
  "How has my energy been this week?",
  "What habits have I been skipping?",
  "Summarise what I worked on recently",
  "What tasks are still pending?",
  "How much deep work have I done today?",
  "What did I write in my notes?",
];

export default function SecondBrain({ state }: Props) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (query: string) => {
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const brainMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "brain",
      text: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, brainMsg]);

    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          context: {
            tasks:          state.tasks,
            habits:         state.habits,
            focusSessions:  state.focusSessions,
            notes:          state.notes,
            dayContext:     state.dayContext,
            calendarEvents: state.calendarEvents,
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full      = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const parsed = JSON.parse(line.slice(6).trim());
            if (parsed.text) {
              full += parsed.text;
              setMessages((prev) =>
                prev.map((m) => m.id === brainMsg.id ? { ...m, text: full } : m)
              );
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === brainMsg.id
            ? { ...m, text: "Something went wrong. Make sure your API key is set." }
            : m
        )
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] animate-fade-in">

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD60A]/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#FFD60A] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              neurology
            </span>
          </div>
          <h3 className="text-[20px] font-bold text-[#FFFDE7] mb-1">Second Brain</h3>
          <p className="text-[13px] text-[#FF9FCA] text-center max-w-xs mb-8">
            Ask anything about your tasks, habits, focus sessions, notes, and history.
          </p>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[12px] font-medium text-[#FF9FCA] hover:border-[#FFD60A]/30 hover:bg-[#E3F0FF] hover:text-[#FFD60A] transition-all interactive-scale text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "brain" && (
                <div className="w-7 h-7 rounded-full bg-[#FFD60A] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    neurology
                  </span>
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#FFD60A] text-white rounded-tr-sm"
                  : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#FFFDE7] rounded-tl-sm shadow-sm"
              }`}>
                {msg.role === "brain" && msg.text === "" ? (
                  <span className="flex gap-1 items-center py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="pt-3 pb-2">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-2.5 shadow-sm focus-within:border-[#FFD60A]/40 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your Second Brain anything…"
            disabled={loading}
            className="flex-1 text-[14px] text-[#FFFDE7] placeholder-[#C6C6C8] bg-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !loading
                ? "bg-[#FFD60A] text-white interactive-scale shadow-sm"
                : "bg-[#0C0C0C] text-[#C6C6C8]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              arrow_upward
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
