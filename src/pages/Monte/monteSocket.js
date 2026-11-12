import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { isLocalhost } from "@/util";

let socket = null;

// one shared connection so it survives moving from the lobby into a game
export const getMonteSocket = () => {
  if (!socket) {
    const baseUrl = isLocalhost() ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_BACKEND_URL;
    socket = io(`${baseUrl}/monte`, { transports: ["websocket"] });
  }
  return socket;
};

export const getPlayerId = () => {
  // per tab so two tabs in one browser can play each other
  try {
    let id = sessionStorage.getItem("monte-player-id");
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem("monte-player-id", id);
    }
    return id;
  } catch {
    return uuidv4();
  }
};
