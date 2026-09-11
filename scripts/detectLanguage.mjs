// Best-effort automatic language tagging for karaoke titles/artists.
// Statistical language identifiers need more text than a song title gives
// them: testing the `franc` package on real entries from karaoke-index.json
// (e.g. "She Works Hard For The Money Donna Summer") returned wrong guesses
// like Hausa, Hmong, and Romanian for plain English titles. Unicode script is
// the only signal short titles carry reliably, so this checks script first
// and otherwise assumes English, since every scraped channel is an
// English-language karaoke network and the vast majority of entries are
// English songs even when an artist name carries an accent (Beyoncé, Bublé).

const SCRIPT_LANGUAGES = [
  { language: 'Korean', pattern: /[가-힯ᄀ-ᇿ]/ },
  { language: 'Japanese', pattern: /[぀-ヿㇰ-ㇿ]/ },
  { language: 'Chinese', pattern: /[一-鿿]/ },
  { language: 'Russian', pattern: /[Ѐ-ӿ]/ },
  { language: 'Arabic', pattern: /[؀-ۿ]/ },
  { language: 'Hebrew', pattern: /[֐-׿]/ },
  { language: 'Thai', pattern: /[฀-๿]/ },
  { language: 'Greek', pattern: /[Ͱ-Ͽ]/ },
  { language: 'Hindi', pattern: /[ऀ-ॿ]/ },
  { language: 'Georgian', pattern: /[Ⴀ-ჿ]/ },
];

// Tagalog is written in plain Latin script, so it's invisible to the script
// check above, but it has a set of function/pronoun words (ikaw, ako, hindi,
// mahal, puso, bakit...) that are distinctive enough to essentially never
// appear in English lyrics or artist names. Checked against every title and
// artist in karaoke-index.json: these caught ~110 real Tagalog/OPM songs
// (Ikaw, Hindi Tayo Pwede, Pusong Ligaw, ...) with one false positive
// ("Yung Gravy", a rapper's stage name), which is why "yung" isn't in this
// list despite being common Tagalog for "the/that".
const TAGALOG_WORDS = [
  'ikaw', 'ako', 'siya', 'tayo', 'kami', 'kayo', 'sila',
  'mahal', 'puso', 'ngayon', 'bakit', 'paano', 'saan', 'sino',
  'hindi', 'wala', 'walang', 'pwede', 'kailan', 'kasi',
  'ganito', 'ganyan', 'ganoon', 'pagibig', 'pag-ibig', 'sana', 'muli',
  'tunay', 'gusto', 'talaga', 'habang', 'kahit', 'buhay', 'langit',
  'tanging', 'nandito', 'nasaan', 'nangyari', 'mangyari',
  'magmahal', 'nagmamahal', 'minamahal', 'iniibig', 'ibigin',
  'pangarap', 'damdamin', 'luha', 'iiyak', 'umiyak', 'alaala',
  'paglisan', 'tadhana', 'kapalaran', 'yakap', 'halik', 'pangako',
  'tapat', 'ligaya', 'kalimutan', 'sasabihin', 'babalik', 'magbalik',
  'maging', 'lumisan', 'sayang', 'multo', 'kita', 'minsan', 'iibigin', 'ibig',
  'kumusta', 'salamat', 'sinta', 'kailangan', 'ngiti', 'lahat', 'sagot',
  'tama', 'bukas', 'kaya', 'dito', 'lagi', 'laging', 'pusong',
];
const TAGALOG_PATTERN = new RegExp(`\\b(${TAGALOG_WORDS.join('|')})\\b`, 'i');

// Artists whose whole catalog is Tagalog/OPM, for when a song's title alone
// doesn't trip TAGALOG_WORDS (e.g. Rey Valera's "TAYONG DALAWA", "KUMUSTA KA",
// and "NAAALALA KA" don't contain any word from that list).
const TAGALOG_ARTISTS = ['rey valera'];

// Per-song overrides for cases no heuristic here can resolve: video-game and
// VTuber tracks where the title/artist give no linguistic signal at all (the
// "artist" is often the source game, e.g. "Bakamitai - Yakuza 0"). Verified
// by hand via web research (composer/vocalist credits, official lyrics
// sites) rather than guessed. Keyed by exact lowercased title+artist, so a
// re-scrape that carries the same title/artist through keeps the override.
const MANUAL_LANGUAGE_OVERRIDES = new Map([
  // Classic Japanese enka song (Masahiko Nishimura), used as Kiryu's karaoke
  // song in Yakuza 0.
  ['bakamitai|yakuza 0', 'Japanese'],
  // [Alexandros]'s theme for Judgment (the "Lost Judgment" artist tag here is
  // actually the game franchise, not the correct title/game pairing) -
  // Japanese lyrics with a few English phrases mixed in.
  ['arpeggio|lost judgment', 'Japanese'],
  // jon-YAKITORY feat. Ado, the Japanese theme song for Lost Judgment.
  ['rasen|lost judgment', 'Japanese'],
  // DA PUMP's original "if..." is a Japanese ballad (with a little English
  // mixed in); this is a cover by Hololive JP's Korone/Okayu.
  ['if... - korone inugami/okayu nekomata cover|da pump', 'Japanese'],
  // 風になれ (Kaze ni Nare), a well-known Japanese song.
  ['kaze ni nare|null', 'Japanese'],
  // In-game Japanese karaoke theme from the Yakuza/Judgment series. Trailing
  // dash is stripped by the scraper's cleanText, so the stored title ends
  // "-Shinpan" with no closing dash.
  ['judgement -shinpan|null', 'Japanese'],
]);

export const LANGUAGES = ['English', 'Tagalog', ...SCRIPT_LANGUAGES.map((s) => s.language)];

export const detectLanguage = (title, artist) => {
  const overrideKey = `${(title ?? '').trim().toLowerCase()}|${(artist ?? 'null').trim().toLowerCase()}`;
  if (MANUAL_LANGUAGE_OVERRIDES.has(overrideKey)) {
    return MANUAL_LANGUAGE_OVERRIDES.get(overrideKey);
  }
  const text = `${title ?? ''} ${artist ?? ''}`;
  for (const { language, pattern } of SCRIPT_LANGUAGES) {
    if (pattern.test(text)) {
      return language;
    }
  }
  if (artist && TAGALOG_ARTISTS.includes(artist.trim().toLowerCase())) {
    return 'Tagalog';
  }
  if (TAGALOG_PATTERN.test(text)) {
    return 'Tagalog';
  }
  return 'English';
};
