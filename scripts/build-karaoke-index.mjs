#!/usr/bin/env node
// Rebuilds backend/karaoke-index.json (the karaoke queue directory) from a
// fixed list of karaoke YouTube channels, then syncs it straight into
// backend/mydatabase.db (via backend/sync-directory.js) so the change takes
// effect immediately rather than waiting for the backend's next restart.
// karaoke-index.json lives inside backend/ rather than scripts/ so it
// deploys alongside the backend code.
//
// Incremental by default: a channel's "Videos" tab lists newest-first, so
// each channel is streamed only until it hits a run of video IDs that are
// already in the existing karaoke-index.json, then the fetch for that
// channel is stopped early. Everything already on record is carried over
// unchanged (including its last-seen view count) and only genuinely new
// videos get fetched and parsed. Pass --full to ignore the existing file and
// rescrape every channel from scratch (e.g. after improving the parser, or
// to refresh view counts on older videos).
//
// Requires yt-dlp on PATH: pip install --user yt-dlp
//
// Usage: npm run build-karaoke-index [-- --full]

import { spawn } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "..", "backend", "karaoke-index.json");
const FULL_RESCRAPE = process.argv.includes("--full");
// How many consecutive already-known video IDs to see before concluding a
// channel has no more new uploads. >1 tolerates a single deleted/reordered
// video without stopping too early.
const KNOWN_STREAK_TO_STOP = 3;

// Removes karaoke-production noise (version tags, pitch shifts, watermarks)
// wherever it appears, rather than only at the end of the string, since large
// channels accumulate many historical title conventions. Matched by keyword
// inside a bracketed group (or as a standalone phrase) so a parenthetical
// that's actually part of the song title, e.g. "St Elmo's Fire (Man In
// Motion)", is left alone.
const NOISE_PATTERNS = [
  /\([^()]*karaoke[^()]*\)/gi,
  /\[[^[\]]*karaoke[^[\]]*\]/gi,
  /\(\s*without backing vocals\s*\)/gi,
  /\(\s*backing vocals?[^)]*\)/gi,
  /\([^()]*semitones?[^()]*\)/gi,
  /\(\s*instrumental[^)]*\)/gi,
  /\[[^[\]]*instrumental[^[\]]*\]/gi,
  /\[[^[\]]*uvr[^[\]]*\]/gi,
  /\(\s*cc\s*\)/gi,
  /with lyrics on screen\s*karaoke\b/gi,
  /\bwith lyrics on screen\b/gi,
  /\blyrics on screen\b/gi,
  /\bwith lyrics\b/gi,
  /\bkaraoke version from zoom\s+karaoke\b/gi,
  /\bkaraoke version\b/gi,
  /\bhd\s*1080p\b/gi,
  /\bhamburger karaoke\b/gi,
  /\bhd karaoke\b/gi,
  /\s*-\s*zoom karaoke\s*$/gi,
  /\s*-\s*karaoke\s*$/gi,
  /\s*-?\s*from zoom(\s+kar\w*)?\s*$/gi,
  /🎤/g,
];

const cleanText = (input) => {
  let s = input;
  for (const pattern of NOISE_PATTERNS) {
    s = s.replace(pattern, " ");
  }
  s = s.replace(/\(\s*\)/g, " ").replace(/\[\s*\]/g, " ");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[-–—\s]+|[-–—\s]+$/g, "").trim();
  return s;
};

// "Artist - Title (Karaoke ...)", e.g. Zoom Karaoke, Party Tyme, NickyDee.
const parseArtistDashTitle = (rawTitle) => {
  const parts = rawTitle.split(/\s+-\s+/);
  if (parts.length < 2) {
    return null;
  }
  const artist = cleanText(parts[0]);
  const title = cleanText(parts.slice(1).join(" - "));
  if (!artist || !title) {
    return null;
  }
  return { title, artist };
};

// "TITLE - Artist (HD Karaoke)", e.g. Atomic Karaoke.
const parseTitleDashArtist = (rawTitle) => {
  const parts = rawTitle.split(/\s+-\s+/);
  if (parts.length < 2) {
    return null;
  }
  const title = cleanText(parts.slice(0, -1).join(" - "));
  const artist = cleanText(parts[parts.length - 1]);
  if (!title || !artist) {
    return null;
  }
  return { title, artist };
};

// "Artist • Title (CC Karaoke / Instrumental) [UVR]", e.g. CC Karaoke.
const parseArtistBulletTitle = (rawTitle) => {
  const parts = rawTitle.split("•");
  if (parts.length < 2) {
    return null;
  }
  const artist = cleanText(parts[0]);
  const title = cleanText(parts.slice(1).join("•"));
  if (!artist || !title) {
    return null;
  }
  return { title, artist };
};

// "Title (Vocal/Lyric tag) (Artist or source game) [- ]Hamburger Karaoke".
const parseHamburger = (rawTitle) => {
  const withoutSuffix = rawTitle
    .replace(/\s*-\s*hamburger karaoke\s*$/i, "")
    .replace(/\s*hamburger karaoke\s*$/i, "")
    .trim();
  const groups = [...withoutSuffix.matchAll(/\(([^()]*)\)/g)].map((m) => m[1].trim());
  const firstParenIndex = withoutSuffix.indexOf("(");
  const title = cleanText(firstParenIndex === -1 ? withoutSuffix : withoutSuffix.slice(0, firstParenIndex));
  if (!title) {
    return null;
  }
  const artist = groups.length ? cleanText(groups[groups.length - 1]) || null : null;
  return { title, artist };
};

// Some Party Tyme compilation uploads use "Party Tyme Karaoke - Song (Made
// Popular By Artist) [Karaoke Version]" instead of "Artist - Song (...)": the
// real artist is inside the parenthetical, not before the first dash. Tried
// before the channel's own parser, on any channel, since it's unambiguous.
const parseMadePopularBy = (rawTitle) => {
  const match = rawTitle.match(/\(made popular by ([^)]+)\)/i);
  if (!match) {
    return null;
  }
  const artist = cleanText(match[1]);
  let title = rawTitle.slice(0, match.index);
  const dashIndex = title.indexOf(" - ");
  if (dashIndex !== -1) {
    title = title.slice(dashIndex + 3);
  }
  title = cleanText(title);
  if (!title || !artist) {
    return null;
  }
  return { title, artist };
};

const CHANNELS = [
  { url: "https://www.youtube.com/@ZoomKaraokeOfficial/videos", channel: "Zoom Karaoke", parse: parseArtistDashTitle },
  { url: "https://www.youtube.com/@AtomicKaraoke/videos", channel: "Atomic Karaoke", parse: parseTitleDashArtist },
  { url: "https://www.youtube.com/@CCKaraoke/videos", channel: "CC Karaoke", parse: parseArtistBulletTitle },
  { url: "https://www.youtube.com/@hburgerkaraoke/videos", channel: "Hamburger Karaoke", parse: parseHamburger },
  { url: "https://www.youtube.com/@partytymekaraokechannel6967/videos", channel: "Party Tyme Karaoke", parse: parseArtistDashTitle },
  { url: "https://www.youtube.com/@NickyDeeKaraoke/videos", channel: "NickyDee Karaoke", parse: parseArtistDashTitle },
];

const UNAVAILABLE_TITLE = /^\[(private|deleted|unavailable)[^\]]*\]$/i;

const extractVideoId = (link) => {
  try {
    return new URL(link).searchParams.get("v");
  } catch {
    return null;
  }
};

// Streams a channel's video list newest-first. If knownIds is given, the
// yt-dlp process is killed (rather than left to page through the channel's
// entire history) once KNOWN_STREAK_TO_STOP consecutive entries are already
// in knownIds, since everything past that point was already scraped.
const fetchChannelEntries = (channelUrl, knownIds) => new Promise((resolve, reject) => {
  const child = spawn("yt-dlp", ["--flat-playlist", "--lazy-playlist", "-j", channelUrl]);
  let buffer = "";
  const entries = [];
  let knownStreak = 0;
  let stoppedEarly = false;
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const entry = JSON.parse(line);
      entries.push(entry);
      if (knownIds) {
        knownStreak = knownIds.has(entry.id) ? knownStreak + 1 : 0;
        if (knownStreak >= KNOWN_STREAK_TO_STOP) {
          stoppedEarly = true;
          child.kill();
          return;
        }
      }
    }
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("error", (err) => {
    if (err.code === "ENOENT") {
      reject(new Error("yt-dlp not found on PATH. Install it with: pip install --user yt-dlp"));
    } else {
      reject(err);
    }
  });
  child.on("close", (code) => {
    if (code !== 0 && !stoppedEarly) {
      reject(new Error(`yt-dlp exited with code ${code} for ${channelUrl}\n${stderr}`));
      return;
    }
    if (buffer.trim()) {
      entries.push(JSON.parse(buffer));
    }
    resolve(entries);
  });
});

const loadPreviousById = async () => {
  if (FULL_RESCRAPE || !existsSync(OUTPUT_PATH)) {
    return new Map();
  }
  const previousSongs = JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
  const byId = new Map();
  for (const song of previousSongs) {
    const id = extractVideoId(song.link);
    if (id) {
      byId.set(id, song);
    }
  }
  return byId;
};

const buildIndex = async () => {
  const previousById = await loadPreviousById();
  const knownIds = previousById.size ? new Set(previousById.keys()) : null;
  if (knownIds) {
    console.log(`Loaded ${knownIds.size} known songs from ${OUTPUT_PATH}; incremental mode.`);
  } else {
    console.log(FULL_RESCRAPE ? "Full rescrape requested." : "No existing index found; scraping from scratch.");
  }

  const newSongs = [];
  for (const { url, channel, parse } of CHANNELS) {
    console.log(`Fetching ${url} ...`);
    const entries = await fetchChannelEntries(url, knownIds);
    let matched = 0;
    for (const entry of entries) {
      if (previousById.has(entry.id)) {
        continue;
      }
      const rawTitle = entry.title;
      if (!rawTitle || UNAVAILABLE_TITLE.test(rawTitle)) {
        continue;
      }
      const parsed = parseMadePopularBy(rawTitle) ?? parse(rawTitle);
      // A real recording artist's name essentially never contains the word
      // "karaoke"; when it does, the split almost always caught a channel
      // promo/tutorial video's branding instead of an actual artist.
      if (!parsed || (parsed.artist && /karaoke/i.test(parsed.artist))) {
        continue;
      }
      newSongs.push({ title: parsed.title, artist: parsed.artist, link: entry.url, views: entry.view_count ?? null, channel });
      matched += 1;
    }
    console.log(`  ${matched} new songs (${entries.length} videos checked)`);
  }

  const songs = [...previousById.values(), ...newSongs];
  await writeFile(OUTPUT_PATH, JSON.stringify(songs, null, 2) + "\n");
  console.log(`Wrote ${songs.length} songs to ${OUTPUT_PATH} (${newSongs.length} new)`);

  const backendDir = path.join(__dirname, "..", "backend");
  await new Promise((resolve, reject) => {
    const child = spawn("node", ["sync-directory.js"], { cwd: backendDir, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`sync-directory.js exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
};

buildIndex().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
