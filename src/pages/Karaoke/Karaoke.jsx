import { useEffect, useState } from "react";
import YouTubePlayer from "../../components/Custom/YoutubePlayer";
import { Input, Button } from "@chakra-ui/react";
import { isLocalhost } from "@/util";
import { useQueueSocket } from "@/components/Custom/useQueueSocket";
import { v4 as uuidv4 } from 'uuid';

const fetchQueue = async (secret) => {
  const apiUrl = isLocalhost() ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_BACKEND_URL;
  const response = await fetch(`${apiUrl}/songs`, {
    headers: { 'X-Queue-Secret': secret },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch songs');
  }
  return response.json();
};

const addSongToDB = async (secret, newLink) => {
  const apiUrl = isLocalhost() ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_BACKEND_URL;
  const response = await fetch(`${apiUrl}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Queue-Secret': secret
    },
    body: JSON.stringify({
      id: uuidv4(),
      url: newLink,
      title: "placeholder"
    })
  });
  if (!response.ok) {
    throw new Error('Failed to post new song');
  }
}

const Karaoke = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLink, setNewLink] = useState("");
  const secret = window.location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

  useQueueSocket(
    secret,
    (song) => {
      setQueue((prev) => [...prev, song]);
    }, (id) => {
      let index = -1;
      queue.forEach((song, k) => {
        if (song.id === id) {
          index = k;
        }
      });
      let queueCopy = queue.slice();
      queueCopy.splice(index, 1);
      setQueue(queueCopy);
    }, () => {
      setQueue([]);
    }
  );

  useEffect(() => {
    fetchQueue(secret)
      .then(data => setQueue(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Error: {error}</p>;
  }
  return <div style={{ display: "flex", justifyContent: "space-betwen", padding: "2rem", gap: "2rem" }}>
    <div style={{ width: "80%" }}>
      <YouTubePlayer queue={queue} setQueue={setQueue} secret={secret} />
    </div>
    <div style={{ width: "20%", display: "flex", flexDirection: "column", gap: ".5rem" }}>
      <h2 style={{ fontSize: "2rem" }}>Queue</h2>
      {queue.map((song) => {
        console.log(song)
        return <div key={song.id}>
          {song.title}
        </div>
      })}
      <div style={{ display: "flex" }}>
        <Input
          size="md"
          value={newLink}
          placeholder="YouTube Link..."
          variant="subtle"
          backgroundColor={"white"}
          borderTopRightRadius={"0px"}
          borderBottomRightRadius={"0px"}
          height="50px"
          color="black"
          onChange={(e) => {
            setNewLink(e.target.value)
          }}
        />
        <Button
          size="md"
          borderTopLeftRadius={"0px"}
          borderBottomLeftRadius={"0px"}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          fontSize={"2rem"}
          height="50px"
          paddingInline={"0px"}
          padding="1rem"
          onClick={() => {
            addSongToDB(secret, newLink);
            setNewLink("");
          }}
        >
          <strong>+</strong>
        </Button>
      </div>
    </div>
  </div>
};

export default Karaoke;