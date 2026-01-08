import { useEffect, useRef, useState } from "react";
import YouTubePlayer from "../../components/Custom/YoutubePlayer";
import { getYouTubeTitle, isLocalhost } from "@/util";
import { useQueueSocket } from "@/components/Custom/useQueueSocket";
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  Portal,
  Input,
  Button
} from '@chakra-ui/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from "@/components/Custom/SortableItem";

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

const fetchAdmin = async (secret, clientId, setAdminActive, setIsAdmin) => {
  const apiUrl = isLocalhost() ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_BACKEND_URL;
  if (!!clientId) {
    const response = await fetch(`${apiUrl}/admin/` + clientId, {
      headers: { 'X-Queue-Secret': secret },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch admin');
    }
    const data = await response.json();
    if (data.adminExists) {
      setAdminActive(true);
    }
    if (data.isAdmin) {
      setIsAdmin(true);
    }
  }
}

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

const TakeAdminButton = ({ apiUrl, clientId, isAdmin, secret }) => {
  return <Button
    fontSize={"2rem"}
    padding={"1rem"}
    height={"unset"}
    onClick={async () => {
      const response = await fetch(apiUrl + "/admin/create", {
        headers: {
          'Content-Type': 'application/json',
          'X-Queue-Secret': secret
        },
        method: 'POST',
        body: JSON.stringify({
          id: clientId,
        })
      });
      if (!response.ok) {
        setError(response.status)
      }
    }}
    disabled={isAdmin}
  >
    Take Admin Role
  </Button>
}

const Karaoke = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLink, setNewLink] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [showManualTitleModal, setShowManualTitleModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminActive, setAdminActive] = useState(false);
  const [clientId, setClientId] = useState(localStorage.getItem("clientId"));
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
    }, (newId) => {
      if (newId === null) {
        setIsAdmin(false);
        setAdminActive(false);
      } else if (newId === clientId) {
        setIsAdmin(true);
        setAdminActive(true);
      } else {
        setIsAdmin(false);
        setAdminActive(true);
      }
    }, (currentIndex, newIndex) => {
      let queueCopy = queue.slice();
      const temp = queueCopy[currentIndex];
      queueCopy.splice(currentIndex, 1);
      queueCopy.splice(newIndex, 0, temp);
      setQueue(queueCopy);
    }
  );

  useEffect(() => {
    if (!clientId) {
      const newId = uuidv4();
      setClientId(newId);
      localStorage.setItem("clientId", newId);
    }
  }, []);

  useEffect(() => {
    fetchQueue(secret)
      .then(data => setQueue(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    fetchAdmin(secret, clientId, setAdminActive, setIsAdmin);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Error: {error}</p>;
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const currentIndex = queue.findIndex((song) => {
        return song.id === active.id
      });
      const newIndex = queue.findIndex((song) => {
        return song.id === over.id
      });
      const response = await fetch(apiUrl + "/songs", {
        headers: {
          'Content-Type': 'application/json',
          'X-Queue-Secret': secret
        },
        method: 'PATCH',
        body: JSON.stringify({
          currentIndex,
          newIndex
        })
      });
      if (!response.ok) {
        setError("Failed to reorder songs")
      }
    }
  }

  return <div style={{ display: "flex", justifyContent: isAdmin ? "space-betwen" : "center", padding: "2rem", gap: "2rem" }}>
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
    {isAdmin && <div style={{ width: "80%" }}>
      {isAdmin && <YouTubePlayer queue={queue} secret={secret} adminActive={adminActive} isAdmin={isAdmin} />}
      <AnimatePresence mode="wait">
        <motion.div style={{ justifyContent: "center", display: 'flex', marginTop: "1rem", gap: "1.5rem" }}>
          {false && <Button
            fontSize={"2rem"}
            padding={"1rem"}
            height={"unset"}
            onClick={async () => {
              const response = await fetch(apiUrl + "/admin", {
                headers: { 'X-Queue-Secret': secret },
                method: 'DELETE',
              });
              if (!response.ok) {
                setError(response.status)
              }
            }}
          >
            Clear Admin
          </Button>}
        </motion.div>
      </AnimatePresence>
    </div>}
    <div style={{ width: isAdmin ? "20%" : "75%", display: "flex", flexDirection: "column", gap: ".5rem" }}>
      <h2 style={{ fontSize: "2rem" }}>Queue</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={queue.map((song) => song.id)}
          strategy={verticalListSortingStrategy}
        >
          {queue.map(song => {
            return <SortableItem
              key={song.id}
              id={song.id}
              title={song.title}
            />
          })}
        </SortableContext>
      </DndContext>
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
      {!isAdmin && <div style={{ marginTop: "1rem" }}>
        <TakeAdminButton
          apiUrl={apiUrl}
          clientId={clientId}
          isAdmin={isAdmin}
          secret={secret}
        />
      </div>}
    </div>
  </div>
};

export default Karaoke;