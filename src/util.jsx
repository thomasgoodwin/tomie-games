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