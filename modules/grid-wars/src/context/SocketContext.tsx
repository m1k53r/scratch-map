import { useWebSocket } from "@/lib/websocket-client";
import React, { createContext, useContext } from "react";

const SocketContext = createContext<ReturnType<typeof useWebSocket> | null>(
  null,
);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socket = useWebSocket();

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
