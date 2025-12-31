import { Button } from "@chakra-ui/react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useRef } from "react";

const END_OF_SONG_CODE = 0;

const getYouTubeVideoID = (url) => {
  try {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.body.appendChild(script);
  });
}

const YouTubePlayer = ({ queue, setQueue }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [started, setStarted] = useState(false);

  const onPlayerStateChange = (e) => {
    if (e.data === END_OF_SONG_CODE) {
      nextSong();
    }
  }

  useEffect(() => {
    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed) {
        return;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          mute: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    });
    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const startKaraoke = () => {
    if (!playerRef.current || queue.length === 0) {
      return;
    }
    playerRef.current.unMute();
    playerRef.current.setVolume(100);
    playerRef.current.loadVideoById(getYouTubeVideoID(queue[0].url));
    setStarted(true);
  };

  const nextSong = () => {
    if (!playerRef.current) {
      return;
    }
    const nextIndex = 1;
    playerRef.current.loadVideoById(getYouTubeVideoID(queue[nextIndex].url));
    let queueCopy = queue.slice();
    queueCopy.splice(0, 1);
    setQueue(queueCopy);
  };

  return <div style={{ width: "100%", position: "relative" }}>
    <div
      ref={containerRef}
      style={{ width: "100%", aspectRatio: "16 / 9" }}
    />
    <AnimatePresence mode="wait">
      {!started && <motion.div style={{ justifyContent: "center", display: 'flex', marginTop: "1rem" }}>
        <Button
          fontSize={"2rem"}
          padding={"1rem"}
          height={"unset"}
          onClick={startKaraoke}
        >
          Start Karaoke
        </Button>
      </motion.div>}
    </AnimatePresence>
    <AnimatePresence mode="wait">
      {started && <motion.div style={{ justifyContent: "right", display: 'flex', marginTop: "1rem" }}>
        <Button
          fontSize={"2rem"}
          padding={"1rem"}
          height={"unset"}
          onClick={nextSong}
          disabled={queue.length < 2}
        >
          Next Song
        </Button>
      </motion.div>}
    </AnimatePresence>
  </div >
}

export default YouTubePlayer;