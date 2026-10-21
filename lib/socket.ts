import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

let socket: Socket | null = null;

export const initSocket = (token?: string | null) => {
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: authToken ? { token: authToken } : undefined,
    });
  } else if (authToken && (!socket.auth || (socket.auth as any).token !== authToken)) {
    socket.auth = { token: authToken };
    if (!socket.connected) {
      socket.connect();
    }
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

