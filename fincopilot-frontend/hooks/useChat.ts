"use client";
import { useState, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((text: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Add user bubble + empty assistant bubble
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setIsLoading(true);

    const appendChunk = (chunk: string) => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, content: last.content + chunk };
        return updated;
      });
    };

    const onDone = () => setIsLoading(false);

    const doSend = (ws: WebSocket) => {
      // Always re-bind onmessage so it captures the right appendChunk/onDone
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "delta") appendChunk(data.content);
          else if (data.type === "done") onDone();
        } catch {}
      };
      ws.send(JSON.stringify({ message: text }));
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      doSend(wsRef.current);
      return;
    }

    // Create new connection
    const ws = new WebSocket(`${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => doSend(ws);
    ws.onerror = () => {
      setIsLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Connection error — make sure the backend is running.",
        };
        return updated;
      });
    };
    ws.onclose = () => {
      wsRef.current = null;
    };
  }, []);

  return { messages, sendMessage, isLoading };
}
