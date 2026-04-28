const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function createChatWebSocket(token: string, onChunk: (text: string) => void, onDone: () => void) {
  const ws = new WebSocket(`${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "delta") onChunk(data.content);
    else if (data.type === "done") onDone();
  };

  return ws;
}
