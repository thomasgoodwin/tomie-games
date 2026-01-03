import { useEffect, useState } from "react";
import YouTubePlayer from "../../components/Custom/YoutubePlayer";
import { getYouTubeTitle, isLocalhost } from "@/util";
import { useQueueSocket } from "@/components/Custom/useQueueSocket";
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  Portal,
  Input,
  Button
} from '@chakra-ui/react'

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

const sendAddRequest = async (apiUrl, secret, newLink, title) => {
  const response = await fetch(`${apiUrl}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Queue-Secret': secret
    },
    body: JSON.stringify({
      id: uuidv4(),
      url: newLink,
      title: title
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
  const [manualTitle, setManualTitle] = useState("");
  const [showManualTitleModal, setShowManualTitleModal] = useState(false);
  const apiUrl = isLocalhost() ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_BACKEND_URL;
  const secret = window.location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

  const addSongToDB = async (newLink) => {
    const title = await getYouTubeTitle(newLink);
    if (title === undefined) {
      setShowManualTitleModal(true);
    } else {
      sendAddRequest(apiUrl, secret, newLink, title);
      setNewLink("");
    }
  }

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
    <Dialog.Root
      role="alertdialog"
      motionPreset="slide-in-bottom"
      lazyMount
      open={showManualTitleModal}
      onOpenChange={(e) => setShowManualTitleModal(e.open)}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Set a Title Manually</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <p>
                This song is blocked by the karaoke site but can still be played on youtube.
              </p>
              <p>
                Please input a name manually so we know which song it is on the queue.
              </p>
              <Input
                size="md"
                value={manualTitle}
                placeholder="Title..."
                variant="subtle"
                backgroundColor={"white"}
                height="50px"
                color="black"
                onChange={(e) => {
                  setManualTitle(e.target.value)
                }}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                disabled={manualTitle.length < 3}
                variant='ghost'
                onClick={async () => {
                  setShowManualTitleModal(false);
                  setManualTitle("");
                  setNewLink("");
                  await sendAddRequest(apiUrl, secret, newLink, manualTitle);
                }}
              >
                Confirm
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
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
            addSongToDB(newLink);
          }}
        >
          <strong>+</strong>
        </Button>
      </div>
    </div>
  </div>
};

export default Karaoke;