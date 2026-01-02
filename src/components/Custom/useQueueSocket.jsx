import { useEffect } from "react";
import { getSocket } from "./Socket";

export function useQueueSocket(secret, onSongAdded, onSongRemoved, onAllSongsRemoved) {
  useEffect(() => {
    if (!secret) {
      return
    };

    const socket = getSocket(secret);

    const handler = (payload) => {
      if (payload.type === "song-added") {
        onSongAdded(payload.song);
      } else if (payload.type === "song-removed") {
        onSongRemoved(payload.id);
      } else if (payload.type === "all-songs-removed") {
        onAllSongsRemoved();
      }
    };
    socket.on("queue:updated", handler);

    return () => {
      socket.off("queue:updated", handler);
    };
  }, [secret, onSongAdded, onSongRemoved, onAllSongsRemoved]);
}