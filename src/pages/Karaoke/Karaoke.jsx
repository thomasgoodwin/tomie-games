import { useEffect, useState } from "react";
import YouTubePlayer from "../../components/Custom/YoutubePlayer";
import { Input, Button } from "@chakra-ui/react";

const fetchQueue = async (secret) => {
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const response = await fetch(`${apiUrl}/songs`, {
    headers: { 'X-Queue-Secret': secret },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch songs');
  }
  return response.json();
};

const Karaoke = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    const secret = window.location.pathname
      .split("/")
      .filter(Boolean)
      .pop();

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
      <YouTubePlayer queue={queue} setQueue={setQueue} />
    </div>
    <div style={{ width: "20%", display: "flex", flexDirection: "column", gap: ".5rem" }}>
      <h2 style={{ fontSize: "2rem" }}>Queue</h2>
      {queue.map((song) => {
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
            let queueCopy = queue.slice();
            queueCopy.push(newLink);
            setQueue(queueCopy);
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