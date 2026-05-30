import { useEffect, useMemo, useRef, useState } from "react";
import YouTubePlayer from "../../components/Custom/YoutubePlayer";
import { getYouTubeTitle, isLocalhost, isValidUrl } from "@/util";
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";


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
    fontSize={"1.25rem"}
    padding={"0.75rem 1.5rem"}
    height={"unset"}
    background={"#06B6D4"}
    color={"white"}
    _hover={{ background: "#0891B2" }}
    borderRadius={"8px"}
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
  const [demoMode, setDemoMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
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

  const deleteSongLocal = (id) => {
    setQueue((prev) => prev.filter((song) => song.id !== id));
  };

  const addSongToDB = async (newLink) => {
    const title = await getYouTubeTitle(newLink);
    if (title === undefined) {
      setShowManualTitleModal(true);
    } else {
      if (demoMode) {
        setQueue((prev) => [...prev, { id: uuidv4(), url: newLink, title }]);
      } else {
        sendAddRequest(apiUrl, secret, newLink, title);
      }
      setNewLink("");
    }
  }

  useQueueSocket(
    demoMode ? null : secret,
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
      .catch(() => {
        setDemoMode(true);
        setIsAdmin(true);
        setAdminActive(true);
      })
      .finally(() => setLoading(false));
    fetchAdmin(secret, clientId, setAdminActive, setIsAdmin).catch(() => { });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const urlValid = useMemo(() => {
    return isValidUrl(newLink);
  }, [newLink])

  const isMobile = navigator.userAgentData?.mobile ?? /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  useEffect(() => {
    if (isMobile) {
      document.getElementById("root").style.padding = "0";
    }
    return () => {
      document.getElementById("root").style.padding = "";
    };
  }, [isMobile]);

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error && !demoMode) {
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
      if (demoMode) {
        setQueue((prev) => arrayMove(prev, currentIndex, newIndex));
      } else {
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
  }
  return <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "stretch" : "center", padding: isMobile ? "0" : "0 2rem 2rem 2rem", gap: "1.5rem" }}>
    {demoMode && <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: ".75rem" }}>
      <div style={{
        background: "linear-gradient(135deg, #06B6D4, #0EA5E9)",
        color: "#fff",
        padding: ".6rem 1.5rem",
        borderRadius: isMobile ? "0" : "8px",
        fontWeight: "600",
        width: "100%",
        textAlign: "center",
        fontSize: "1rem",
        letterSpacing: ".5px",
      }}>
        Demo Mode — changes are local only
      </div>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: ".75rem", width: "100%", padding: isMobile ? "0 1rem" : "0", boxSizing: "border-box" }}>
        <label style={{ color: "#fff", fontWeight: "600", fontSize: "1rem" }}>Password:</label>
        <div style={{ display: "flex", gap: ".75rem", flex: 1 }}>
        <Input
          size="md"
          value={passwordInput}
          placeholder="Enter password..."
          variant="subtle"
          backgroundColor={"rgba(255,255,255,0.95)"}
          height={isMobile ? "50px" : "40px"}
          color="black"
          borderRadius="8px"
          flex="1"
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && passwordInput.trim()) {
              window.location.href = `/karaoke/${passwordInput.trim()}`;
            }
          }}
        />
        <Button
          size="md"
          height={isMobile ? "50px" : "40px"}
          paddingX={isMobile ? "1.25rem" : "1rem"}
          background={"#06B6D4"}
          color={"white"}
          _hover={{ background: "#0891B2" }}
          borderRadius="8px"
          disabled={!passwordInput.trim()}
          onClick={() => { window.location.href = `/karaoke/${passwordInput.trim()}`; }}
        >
          Confirm
        </Button>
        </div>
      </div>
    </div>}
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: isAdmin ? "space-between" : "center", width: "100%", gap: "2rem" }}>
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
                    if (demoMode) {
                      setQueue((prev) => [...prev, { id: uuidv4(), url: newLink, title: manualTitle }]);
                    } else {
                      await sendAddRequest(apiUrl, secret, newLink, manualTitle);
                    }
                    setManualTitle("");
                    setNewLink("");
                  }}
                >
                  Confirm
                </Button>
              </Dialog.Footer>

            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      {isAdmin && <div style={{ width: isMobile ? "100%" : "80%" }}>
        {isAdmin && <YouTubePlayer queue={queue} secret={secret} adminActive={adminActive} isAdmin={isAdmin} demoMode={demoMode} onNextSong={() => deleteSongLocal(queue[0]?.id)} />}
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
      <div style={{ width: isMobile ? "100%" : isAdmin ? "20%" : "75%", display: "flex", flexDirection: "column", gap: ".5rem", padding: isMobile ? "0 1rem" : "0", boxSizing: "border-box" }}>
        <h2 style={{
          fontSize: "2rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #06B6D4, #0EA5E9)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: ".25rem",
        }}>Queue</h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
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
                apiUrl={apiUrl}
                secret={secret}
                demoMode={demoMode}
                onDelete={deleteSongLocal}
              />
            })}
          </SortableContext>
        </DndContext>
        <div style={{ display: "flex" }}>
          <Input
            size="md"
            value={newLink}
            placeholder="Paste a YouTube link..."
            variant="subtle"
            backgroundColor={"rgba(255,255,255,0.95)"}
            borderTopRightRadius={"0px"}
            borderBottomRightRadius={"0px"}
            borderTopLeftRadius={"8px"}
            borderBottomLeftRadius={"8px"}
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
            fontSize={"1.5rem"}
            lineHeight={"1"}
            height="50px"
            width="50px"
            minWidth="50px"
            padding={"0"}
            background={"#06B6D4"}
            color={"white"}
            _hover={{ background: "#0891B2" }}
            disabled={!urlValid}
            onClick={() => {
              addSongToDB(newLink);
            }}
          >
            +
          </Button>
        </div>
        {!isAdmin && !isMobile && <div style={{ marginTop: "1rem" }}>
          <TakeAdminButton
            apiUrl={apiUrl}
            clientId={clientId}
            isAdmin={isAdmin}
            secret={secret}
          />
        </div>}
      </div>
    </div>
  </div>
};

export default Karaoke;