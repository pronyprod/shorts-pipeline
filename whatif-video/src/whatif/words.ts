// Numbers as spoken words, so narration lines built from computed values say exactly
// what the maths says ("Domino 28" -> "twenty eight").
const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

export const numberWords = (n: number): string => {
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new Error(`numberWords: unsupported ${n}`);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` ${numberWords(rest)}` : ""}`;
};

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
