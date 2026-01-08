import { useEffect } from "react";
import { getSocket } from "./Socket";

export const useQueueSocket = (secret, onSongAdded, onSongRemoved, onAllSongsRemoved, onAdminChanged, onQueueReordered) => {
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
      } else if (payload.type === "admin-changed") {
        onAdminChanged(payload.newId);
      } else if (payload.type === "queue-reordered") {
        onQueueReordered(payload.currentIndex, payload.newIndex);
      }
    };
    socket.on("queue:updated", handler);

    return () => {
      socket.off("queue:updated", handler);
    };
  }, [secret, onSongAdded, onSongRemoved, onAllSongsRemoved]);
}