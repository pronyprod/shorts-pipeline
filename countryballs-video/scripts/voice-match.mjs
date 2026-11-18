// How closely a whisper transcript matches a script line.
// Case and punctuation are ignored. Proper nouns (country names) may differ a little.
// A line passes when at least 90% of its words match.
// Number words and digits are the same word ("eight" = "8", "twenty one" = "21"; owner, 18 Nov 2026).
export const PASS_SCORE = 0.9;

const clean = (s) => s.toLowerCase().replace(/['’]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const UNITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const ORDINALS = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
// Turns number words into digits ("twenty one" -> "21", "eighth" -> "8th") so both spellings compare equal
const numbers = (words) => {
  const out = words.map((w) => {
    if (w in TENS) return String(TENS[w]);
    if (UNITS.includes(w)) return String(UNITS.indexOf(w));
    if (w in ORDINALS) return `${ORDINALS[w]}th`;
    return w.replace(/^(\d+)(st|nd|rd|th)$/, "$1th");
  });
  // "twenty one" -> "21"
  for (let i = out.length - 2; i >= 0; i--) {
    if (/^[2-9]0$/.test(out[i]) && /^[1-9]$/.test(out[i + 1])) out.splice(i, 2, String(Number(out[i]) + Number(out[i + 1])));
  }
  return out;
};
const split = (s) => numbers(clean(s).split(" ").filter(Boolean));

// Words that sound the same, so whisper can't tell them apart
const HOMOPHONES = [
  ["sun", "son"],
  ["one", "won"],
  ["two", "to", "too"],
  ["four", "for"],
  ["eight", "ate"],
  ["there", "their"],
  ["sea", "see"],
  ["flower", "flour"],
  ["knight", "night"],
  ["by", "buy", "bye"],
  ["lied", "lie"],
];
const HOMOPHONE_SETS = HOMOPHONES.map((set) => set.map((w) => numbers([w])[0])); // "eight" is stored as "8"
const homophones = (a, b) => HOMOPHONE_SETS.some((set) => set.includes(a) && set.includes(b));

const distance = (a, b) => {
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
};

// Small difference: at most one letter in three, and always at least one
const closeEnough = (word, heard) =>
  distance(word, heard) <= Math.max(1, Math.floor(word.length / 3));

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryWords = new Set();
for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b);
    const name = regionNames.of(code);
    if (name && name !== code) split(name).forEach((w) => countryWords.add(w));
  }
}
// Parts of country names that are also everyday words
for (const w of ["and", "the", "of", "new", "south", "north", "west", "east", "islands", "island", "republic", "saint", "st", "us", "man", "world", "unknown", "region", "cape", "costa"]) {
  countryWords.delete(w);
}

// Capitalised words are proper nouns, except "I" forms and an ordinary sentence start
const scriptWords = (line) => {
  const words = line.trim().split(/\s+/).flatMap((raw, i) => {
    const capital = /^\p{Lu}/u.test(raw.replace(/^[^\p{L}]+/u, ""));
    return clean(raw).split(" ").filter(Boolean).map((text) => ({
      text,
      proper: countryWords.has(text) || (capital && i > 0 && !/^i(m|ve|ll|d)?$/.test(text)),
    }));
  });
  // Numbers are converted over the whole line, so "twenty one" spread over two words becomes one "21"
  const texts = numbers(words.map((w) => w.text));
  if (texts.length === words.length) return words.map((w, i) => ({ ...w, text: texts[i] }));
  return texts.map((text) => ({ text, proper: false }));
};

export const matchScore = (script, heard) => {
  const want = scriptWords(script);
  const got = split(heard);
  // Whisper can split a name ("green land"): join the two parts back up
  for (const w of want) {
    if (!w.proper) continue;
    for (let j = 0; j + 1 < got.length; j++) {
      const onePartIsTheName = closeEnough(w.text, got[j]) || closeEnough(w.text, got[j + 1]);
      if (!onePartIsTheName && closeEnough(w.text, got[j] + got[j + 1])) {
        got.splice(j, 2, got[j] + got[j + 1]);
        break;
      }
    }
  }
  const same = (w, h) =>
    w.text === h || homophones(w.text, h) || (w.proper && closeEnough(w.text, h));
  let row = new Array(got.length + 1).fill(0);
  for (const w of want) {
    const next = [0];
    for (let j = 1; j <= got.length; j++) {
      next[j] = same(w, got[j - 1]) ? row[j - 1] + 1 : Math.max(row[j], next[j - 1]);
    }
    row = next;
  }
  const total = Math.max(want.length, got.length);
  return total === 0 ? 0 : row[got.length] / total;
};
