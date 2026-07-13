"use client";
import { useState, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  isError?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null); // null = unknown
  const [offlineReason, setOfflineReason] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  const appendChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = { ...last, content: last.content + chunk };
      return updated;
    });
  }, []);

  const showError = useCallback((text: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      // Replace a still-empty assistant bubble, otherwise append a new one.
      if (last && last.role === "assistant" && last.content === "") {
        updated[updated.length - 1] = { role: "system", content: text, isError: true };
      } else {
        updated.push({ role: "system", content: text, isError: true });
      }
      return updated;
    });
    setIsLoading(false);
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "status") {
        setAiOnline(msg.online);
        setOfflineReason(msg.message ?? "");
        return;
      }

      if (msg.type === "error") {
        if (msg.code === "ai_offline") {
          setAiOnline(false);
          setOfflineReason(msg.message ?? "");
        }
        showError(msg.message ?? "Something went wrong.");
        return;
      }

      if (msg.type === "delta") {
        setAiOnline(true);
        appendChunk(msg.content);
        return;
      }

      if (msg.type === "done") {
        setIsLoading(false);
      }
    },
    [appendChunk, showError]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      // Add user bubble + empty assistant bubble
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: "" },
      ]);
      setIsLoading(true);

      const doSend = (ws: WebSocket) => {
        ws.send(JSON.stringify({ message: text }));
      };

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        doSend(wsRef.current);
        return;
      }

      // Create new connection
      const ws = new WebSocket(`${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onmessage = handleMessage;
      ws.onopen = () => doSend(ws);
      ws.onerror = () => {
        setAiOnline(false);
        setOfflineReason("Can't reach the chat service.");
        showError("Connection error — make sure the backend is running.");
      };
      ws.onclose = () => {
        wsRef.current = null;
      };
    },
    [handleMessage, showError]
  );

  return { messages, sendMessage, isLoading, aiOnline, offlineReason };
}
