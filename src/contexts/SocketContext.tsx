import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only attempt socket connection if a backend URL is configured
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    if (!backendUrl || backendUrl.includes("localhost")) {
      // No backend available in production — run in offline mode
      setConnected(false);
      setSocket(null);
      return;
    }

    try {
      const socketInstance = io(backendUrl, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        reconnection: false,
      });

      socketInstance.on("connect", () => {
        setConnected(true);
        if (user?.id) {
          socketInstance.emit("register_user", user.id);
        }
      });

      socketInstance.on("disconnect", () => {
        setConnected(false);
      });

      socketInstance.on("connect_error", () => {
        setConnected(false);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } catch {
      setConnected(false);
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
