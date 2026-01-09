export const wordToHex = {
  "red": "#FF3131",
  "blue": "#002fa7",
  "yellow": "#FFF01F",
  "white": "#FFFFFF",
};

export const isLocalhost = () => {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

export const getYouTubeTitle = async (videoUrl) => {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
  );

  if (!res.ok) {
    return undefined;
  }

  const data = await res.json();
  return data.title;
};

export const isValidUrl = (input) => {
  if (typeof input !== "string") {
    return false;
  }

  let url;
  try {
    url = new URL(input.trim());
  } catch {
    return false;
  }

  const hostname = url.hostname.replace(/^www\./, "");

  if (!new Set(["youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"]).has(hostname)) {
    return false;
  }

  let videoId = null;

  if (hostname === "youtu.be") {
    videoId = url.pathname.slice(1);
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else {
    const match = url.pathname.match(/^\/(embed|shorts|v)\/([^/?#&]+)/);
    if (match) { videoId = match[2]; }
  }

  return /^[a-zA-Z0-9_-]{11}$/.test(videoId || "");
};