import arryn from "./sigils/arryn.png";
import baratheon from "./sigils/baratheon.png";
import greyjoy from "./sigils/greyjoy.png";
import lannister from "./sigils/lannister.png";
import martell from "./sigils/martell.png";
import stark from "./sigils/stark.png";
import targaryen from "./sigils/targaryen.png";
import tully from "./sigils/tully.png";
import tyrell from "./sigils/tyrell.png";

export const DEFAULT_THEME = "black-red";

// kept in alphabetical order by house
export const THEMES = [
  {
    id: "light-blue", name: "Light blue", house: "House Arryn", sigil: arryn,
    colors: {
      bg: "#CFE3F7", hdr: "#E3EFFB", surf: "#EAF3FC", inset: "#DCEAF8", line: "#A9C6E6", line2: "#BDD5EE", raised: "#C9DCF0",
      text: "#0F2440", body: "#23395A", muted: "#4A5F7C",
      acc: "#1F6FC5", "acc-text": "#175BA6", "acc-hi": "#0F3F75", "on-acc": "#FFFFFF", "acc-soft": "#B9D6F3", "acc-line": "#8DB6E3",
      danger: "#B3261E", "danger-soft": "#F9E3E1", "danger-line": "#E8B0A9", free: "#2E7D4F",
    },
  },
  {
    id: "yellow", name: "Yellow", house: "House Baratheon", sigil: baratheon,
    colors: {
      bg: "#FBF5DC", hdr: "#FFF9E3", surf: "#FFFDF2", inset: "#FBF5DC", line: "#E6D9A4", line2: "#EFE6BF", raised: "#EFE6BF",
      text: "#2B2410", body: "#4A4128", muted: "#6B613D",
      acc: "#F2C230", "acc-text": "#7F6200", "acc-hi": "#6B5200", "on-acc": "#2B2410", "acc-soft": "#FBE9A6", "acc-line": "#E8CB62",
      danger: "#B3261E", "danger-soft": "#FBE3DF", "danger-line": "#EBB2AA", free: "#2E7D4F",
    },
  },
  {
    id: "black", name: "Black", house: "House Greyjoy", sigil: greyjoy,
    colors: {
      bg: "#0A0A0A", hdr: "#111111", surf: "#161616", inset: "#0A0A0A", line: "#2E2E2E", line2: "#222222", raised: "#242424",
      text: "#F2F2F2", body: "#C8C8C8", muted: "#9A9A9A",
      acc: "#F2F2F2", "acc-text": "#F2F2F2", "acc-hi": "#FFFFFF", "on-acc": "#0A0A0A", "acc-soft": "#2A2A2A", "acc-line": "#4A4A4A",
      danger: "#FF7A6B", "danger-soft": "#2A1614", "danger-line": "#5A2A26", free: "#9BD3A0",
    },
  },
  {
    id: "red", name: "Red", house: "House Lannister", sigil: lannister,
    colors: {
      bg: "#1A0E10", hdr: "#221215", surf: "#2A161A", inset: "#1A0E10", line: "#4A2A30", line2: "#3A2026", raised: "#3A2026",
      text: "#F6E9EA", body: "#DCC4C7", muted: "#B8999D",
      acc: "#E5484D", "acc-text": "#F07579", "acc-hi": "#F5A3A6", "on-acc": "#1A0E10", "acc-soft": "#3D1A1F", "acc-line": "#6B2A31",
      danger: "#FFB454", "danger-soft": "#33261A", "danger-line": "#6A4F28", free: "#9BD3A0",
    },
  },
  {
    id: "orange", name: "Orange", house: "House Martell", sigil: martell,
    colors: {
      bg: "#1A120B", hdr: "#21170E", surf: "#291C11", inset: "#1A120B", line: "#4A3420", line2: "#3A2919", raised: "#3A2919",
      text: "#F8EDE2", body: "#DECAB5", muted: "#B89D84",
      acc: "#F28C28", "acc-text": "#F5A85A", "acc-hi": "#F7C08A", "on-acc": "#1A120B", "acc-soft": "#3D2814", "acc-line": "#6E4520",
      danger: "#FF7A7A", "danger-soft": "#321A1A", "danger-line": "#663030", free: "#9BD3A0",
    },
  },
  {
    id: "white", name: "White", house: "House Stark", sigil: stark,
    colors: {
      bg: "#F4F5F6", hdr: "#FFFFFF", surf: "#FFFFFF", inset: "#F7F8F9", line: "#D5D9DE", line2: "#E6E9EC", raised: "#E6E9EC",
      text: "#1C2025", body: "#3A4048", muted: "#5E6670",
      acc: "#4A5560", "acc-text": "#4A5560", "acc-hi": "#2E353C", "on-acc": "#FFFFFF", "acc-soft": "#E8ECEF", "acc-line": "#B9C1C9",
      danger: "#B3261E", "danger-soft": "#FBE9E7", "danger-line": "#F0B8B0", free: "#2E7D4F",
    },
  },
  {
    id: "black-red", name: "Black and red", house: "House Targaryen", sigil: targaryen,
    colors: {
      bg: "#0A0A0A", hdr: "#000000", surf: "#141414", inset: "#0A0A0A", line: "#2E2E2E", line2: "#222222", raised: "#242424",
      text: "#F2F2F2", body: "#CCCCCC", muted: "#9C9C9C",
      acc: "#E0202E", "acc-text": "#FF5A64", "acc-hi": "#FF8A90", "on-acc": "#FFFFFF", "acc-soft": "#2A0D10", "acc-line": "#6A1A20",
      danger: "#FFB454", "danger-soft": "#2E2414", "danger-line": "#6A5020", free: "#9BD3A0",
    },
  },
  {
    id: "blue", name: "Blue", house: "House Tully", sigil: tully,
    colors: {
      bg: "#0F1626", hdr: "#131C30", surf: "#18233A", inset: "#0F1626", line: "#2A3956", line2: "#223049", raised: "#243049",
      text: "#E8EEF8", body: "#C3CDDD", muted: "#93A1B8",
      acc: "#5B9BF0", "acc-text": "#7FB1F4", "acc-hi": "#A9CBF8", "on-acc": "#0B1220", "acc-soft": "#1B2E4F", "acc-line": "#2E4D80",
      danger: "#F08A7A", "danger-soft": "#2E1D22", "danger-line": "#5C3036", free: "#8FD19E",
    },
  },
  {
    id: "green", name: "Green", house: "House Tyrell", sigil: tyrell,
    colors: {
      bg: "#0E1712", hdr: "#121D17", surf: "#17251D", inset: "#0E1712", line: "#2A4234", line2: "#20342A", raised: "#22382B",
      text: "#EAF3EC", body: "#C5D6CA", muted: "#94AE9C",
      acc: "#4CC38A", "acc-text": "#6FD3A2", "acc-hi": "#9BE3BF", "on-acc": "#08130D", "acc-soft": "#183A2A", "acc-line": "#2B6648",
      danger: "#F08A7A", "danger-soft": "#2E1D1C", "danger-line": "#5C3030", free: "#9BE3BF",
    },
  },
];

export const themeById = (id) => {
  return THEMES.find((theme) => theme.id === id) ?? THEMES.find((theme) => theme.id === DEFAULT_THEME);
};

// dialogs render in a portal outside the page, so they need the variables passed to them too
export const themeVars = (theme) => {
  return Object.fromEntries(Object.entries(theme.colors).map(([key, value]) => [`--ps-${key}`, value]));
};
