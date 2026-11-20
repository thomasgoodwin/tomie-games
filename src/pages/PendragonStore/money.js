export const STAGS_PER_DRAGON = 240;

export const formatMoney = (stags) => {
  if (stags === 0) {
    return "Free";
  }
  const sign = stags < 0 ? "-" : "";
  const abs = Math.abs(stags);
  const g = Math.floor(abs / STAGS_PER_DRAGON);
  const s = abs % STAGS_PER_DRAGON;
  if (g === 0) {
    return `${sign}${s}s`;
  }
  if (s === 0) {
    return `${sign}${g.toLocaleString()}g`;
  }
  return `${sign}${g.toLocaleString()}g ${s}s`;
};

export const formatPurse = (stags) => {
  return stags === 0 ? "0g" : formatMoney(stags);
};
