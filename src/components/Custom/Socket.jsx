import { io } from "socket.io-client";
import { isLocalhost } from "@/util";

let socket = null;

export const getSocket = (secret) => {
  if (!socket) {
    socket = io(isLocalhost() ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_BACKEND_URL, {
      auth: { secret },
      transports: ["websocket"],
    });
  }
  return socket;
}