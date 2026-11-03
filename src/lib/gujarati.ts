// ============================================================
// Gujarati ↔ English Phonetic Transliteration & Search Helpers
// ============================================================

// Phoneme mapping: Gujarati character → approximate Latin phoneme(s)
const GUJARATI_TO_LATIN: [RegExp, string][] = [
  // Vowels
  [/અ/g, 'a'], [/આ/g, 'aa'], [/ઇ/g, 'i'], [/ઈ/g, 'ee'],
  [/ઉ/g, 'u'], [/ઊ/g, 'oo'], [/એ/g, 'e'], [/ઐ/g, 'ai'],
  [/ઓ/g, 'o'], [/ઔ/g, 'au'], [/ઋ/g, 'ri'], [/અં/g, 'an'],
  // Matras (vowel diacritics)
  [/ા/g, 'aa'], [/િ/g, 'i'], [/ી/g, 'ee'], [/ુ/g, 'u'],
  [/ૂ/g, 'oo'], [/ે/g, 'e'], [/ૈ/g, 'ai'], [/ો/g, 'o'],
  [/ૌ/g, 'au'], [/ૃ/g, 'ri'], [/ં/g, 'n'], [/ઃ/g, 'h'],
  [/્/g, ''], // halant (virama)
  // Consonants
  [/ક/g, 'k'], [/ખ/g, 'kh'], [/ગ/g, 'g'], [/ઘ/g, 'gh'], [/ચ/g, 'ch'],
  [/છ/g, 'chh'], [/જ/g, 'j'], [/ઝ/g, 'jh'], [/ટ/g, 't'], [/ઠ/g, 'th'],
  [/ડ/g, 'd'], [/ઢ/g, 'dh'], [/ણ/g, 'n'], [/ત/g, 't'], [/થ/g, 'th'],
  [/દ/g, 'd'], [/ધ/g, 'dh'], [/ન/g, 'n'], [/પ/g, 'p'], [/ફ/g, 'f'],
  [/બ/g, 'b'], [/ભ/g, 'bh'], [/મ/g, 'm'], [/ય/g, 'y'], [/ર/g, 'r'],
  [/લ/g, 'l'], [/વ/g, 'v'], [/શ/g, 'sh'], [/ષ/g, 'sh'], [/સ/g, 's'],
  [/હ/g, 'h'], [/ળ/g, 'l'], [/ક્ષ/g, 'ksh'], [/જ્ઞ/g, 'gn'],
  [/ઞ/g, 'n'], [/ઙ/g, 'ng'], [/ઁ/g, 'n'],
];

/**
 * Convert Gujarati text to a Latin phonetic approximation.
 */
export function gujaratiToPhonetic(text: string): string {
  if (!text) return '';
  let result = text;
  for (const [pattern, replacement] of GUJARATI_TO_LATIN) {
    result = result.replace(pattern, replacement);
  }
  return result.toLowerCase().trim();
}

/**
 * Common English phonetic patterns to Gujarati
 */
const LATIN_TO_GUJARATI_RULES: [RegExp, string][] = [
  // Compound suffixes
  [/bhai\b/gi, 'ભાઈ'],
  [/ben\b/gi, 'બહેન'],
  [/lal\b/gi, 'લાલ'],
  [/das\b/gi, 'દાસ'],
  [/ram\b/gi, 'રામ'],
  [/kumar\b/gi, 'કુમાર'],
  [/kant\b/gi, 'કાંત'],
  [/chandra\b/gi, 'ચંદ્ર'],
  [/prasad\b/gi, 'પ્રસાદ'],

  // Multi-character consonants
  [/ksh/gi, 'ક્ષ'],
  [/gyn|gn/gi, 'જ્ઞ'],
  [/chh/gi, 'છ'],
  [/kh/gi, 'ખ'],
  [/gh/gi, 'ઘ'],
  [/ch/gi, 'ચ'],
  [/jh/gi, 'ઝ'],
  [/th/gi, 'થ'],
  [/dh/gi, 'ધ'],
  [/bh/gi, 'ભ'],
  [/sh/gi, 'શ'],
  [/ph/gi, 'ફ'],

  // Vowels
  [/aa/gi, 'ા'],
  [/ee/gi, 'ી'],
  [/oo/gi, 'ૂ'],
  [/ai/gi, 'ૈ'],
  [/au/gi, 'ૌ'],

  // Single consonants
  [/k/gi, 'ક'], [/g/gi, 'ગ'], [/j/gi, 'જ'], [/t/gi, 'ત'], [/d/gi, 'દ'],
  [/n/gi, 'ન'], [/p/gi, 'પ'], [/f/gi, 'ફ'], [/b/gi, 'બ'], [/m/gi, 'મ'],
  [/y/gi, 'ય'], [/r/gi, 'ર'], [/l/gi, 'લ'], [/v|w/gi, 'વ'], [/s/gi, 'સ'],
  [/h/gi, 'હ'],

  // Matras
  [/a/gi, ''], [/i/gi, 'િ'], [/u/gi, 'ુ'], [/e/gi, 'ે'], [/o/gi, 'ો'],
];

/**
 * Phonetically suggest a Gujarati name from an English input
 */
export function englishToGujaratiPhonetic(englishText: string): string {
  if (!englishText.trim()) return '';
  let str = englishText.trim();

  // Known direct dictionary names for instant 100% accuracy
  const dict: Record<string, string> = {
    ramesh: 'રમેશ',
    rameshbhai: 'રમેશભાઈ',
    suresh: 'સુરેશ',
    sureshbhai: 'સુરેશભાઈ',
    mahesh: 'મહેશ',
    maheshbhai: 'મહેશભાઈ',
    kishore: 'કિશોર',
    kishorbhai: 'કિશોરભાઈ',
    dinesh: 'દિનેશ',
    dineshbhai: 'દિનેશભાઈ',
    mukesh: 'મુકેશ',
    mukeshbhai: 'મુકેશભાઈ',
    bhavesh: 'ભાવેશ',
    bhaveshbhai: 'ભાવેશભાઈ',
    kamlesh: 'કમલેશ',
    kamleshbhai: 'કમલેશભાઈ',
    jayesh: 'જયેશ',
    jayeshbhai: 'જયેશભાઈ',
    hitesh: 'હિતેશ',
    hiteshbhai: 'હિતેશભાઈ',
    manoj: 'મનોજ',
    manojbhai: 'મનોજભાઈ',
    paresh: 'પરેશ',
    pareshbhai: 'પરેશભાઈ',
    pankaj: 'પંકજ',
    pankajbhai: 'પંકજભાઈ',
    bharat: 'ભરત',
    bharatbhai: 'ભરતભાઈ',
    alpesh: 'અલ્પેશ',
    alpeshbhai: 'અલ્પેશભાઈ',
    daxaben: 'દક્ષાબેન',
    jamnaben: 'જમનાબેન',
    sumitraben: 'સુમિત્રાબેન',
    ushaben: 'ઉષાબેન',
    geetaben: 'ગીતાબેન',
    shilpaben: 'શિલ્પાબેન',
    rekhaben: 'રેખાબેન',
    meenaben: 'મીનાબેન',
    kokilaben: 'કોકિલાબેન',
    hansaben: 'હંસાબેન',
    manjuben: 'મંજુબેન',
    bhavanaben: 'ભાવનાબેન',
    chetna: 'ચેતના',
    chetnaben: 'ચેતનાબેન',
    neha: 'નેહા',
    pooja: 'પૂજા',
    priya: 'પ્રિયા',
    rahul: 'રાહુલ',
    amit: 'અમિત',
    rohit: 'રોહિત',
    sunil: 'સુનીલ',
    anil: 'અનિલ',
    prakash: 'પ્રકાશ',
    sanjay: 'સંજય',
    vijay: 'વિજય',
    ajay: 'અજય',
    dharmesh: 'ધર્મેશ',
    ashok: 'અશોક',
    ashokbhai: 'અશોકભાઈ',
    vinod: 'વિનોદ',
    vinodbhai: 'વિનોદભાઈ',
    pramod: 'પ્રમોદ',
    manilal: 'મણીલાલ',
    chimanlal: 'ચીમનલાલ',
    chaganlal: 'છગનલાલ',
    maganlal: 'મગનલાલ',
    govindbhai: 'ગોવિંદભાઈ',
    harilal: 'હરીલાલ',
    jivraj: 'જીવરાજ',
    jivrajbhai: 'જીવરાજભાઈ',
    prabhudas: 'પ્રભુદાસ',
    gordhanbhai: 'ગોરધનભાઈ',
    tribhovanbhai: 'ત્રિભોવનભાઈ',
  };

  const lookupKey = str.toLowerCase().replace(/[^a-z]/g, '');
  if (dict[lookupKey]) return dict[lookupKey];

  // Fallback to phonetic rule transformation
  let output = str;
  for (const [pattern, repl] of LATIN_TO_GUJARATI_RULES) {
    output = output.replace(pattern, repl);
  }
  return output;
}

/**
 * Compute Levenshtein distance between two strings
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy search with Gujarati & English phonetic tolerance
 */
export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (!q || !t) return 0;

  if (t === q) return 1.0;
  if (t.includes(q)) return 0.95;

  const qPhonetic = gujaratiToPhonetic(q);
  const tPhonetic = gujaratiToPhonetic(t);

  if (tPhonetic === qPhonetic) return 0.92;
  if (tPhonetic.includes(qPhonetic) || qPhonetic.includes(tPhonetic)) return 0.85;

  const words = t.split(/\s+/);
  for (const word of words) {
    const dist = levenshtein(q, word);
    const threshold = Math.max(1, Math.floor(word.length * 0.35));
    if (dist <= threshold) return 1 - dist / (word.length + 1);
  }

  const pWords = tPhonetic.split(/\s+/);
  for (const word of pWords) {
    const dist = levenshtein(qPhonetic, word);
    const threshold = Math.max(1, Math.floor(word.length * 0.4));
    if (dist <= threshold) return 0.75 - dist / (word.length + 1);
  }

  return 0;
}

import type { FamilyNode, SearchResult } from '@/types';

export function searchNodes(nodes: FamilyNode[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const node of nodes) {
    if (node.hidden) continue;

    const scores: number[] = [];
    const guScore = fuzzyMatch(query, node.nameGujarati);
    if (guScore > 0) scores.push(guScore);

    const enScore = fuzzyMatch(query, node.nameEnglish);
    if (enScore > 0) scores.push(enScore);

    if (node.metadata) {
      for (const val of Object.values(node.metadata)) {
        const mScore = fuzzyMatch(query, String(val));
        if (mScore > 0) scores.push(mScore * 0.65);
      }
    }

    if (scores.length > 0) {
      results.push({
        nodeId: node._id,
        score: Math.max(...scores),
        matchField: guScore >= enScore ? 'nameGujarati' : 'nameEnglish',
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
