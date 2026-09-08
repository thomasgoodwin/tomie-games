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
];
const TAGALOG_PATTERN = new RegExp(`\\b(${TAGALOG_WORDS.join('|')})\\b`, 'i');

export const LANGUAGES = ['English', 'Tagalog', ...SCRIPT_LANGUAGES.map((s) => s.language)];

export const detectLanguage = (title, artist) => {
  const text = `${title ?? ''} ${artist ?? ''}`;
  for (const { language, pattern } of SCRIPT_LANGUAGES) {
    if (pattern.test(text)) {
      return language;
    }
  }
  if (TAGALOG_PATTERN.test(text)) {
    return 'Tagalog';
  }
  return 'English';
};
