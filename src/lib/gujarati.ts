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
 * Used for phonetic search matching.
 */
export function gujaratiToPhonetic(text: string): string {
  let result = text;
  for (const [pattern, replacement] of GUJARATI_TO_LATIN) {
    result = result.replace(pattern, replacement);
  }
  return result.toLowerCase().trim();
}

/**
 * Compute Levenshtein distance between two strings.
 * Used for fuzzy matching.
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
 * Check if query matches a name with fuzzy/phonetic tolerance.
 * Returns a score 0–1 (higher = better match). 0 = no match.
 */
export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  // Exact substring match — best score
  if (t.includes(q)) return 1.0;

  // Phonetic check if query or target has Gujarati chars
  const qPhonetic = gujaratiToPhonetic(q);
  const tPhonetic = gujaratiToPhonetic(t);
  if (tPhonetic.includes(qPhonetic) || qPhonetic.includes(tPhonetic)) return 0.9;

  // Fuzzy: check each word in target
  const words = t.split(/\s+/);
  for (const word of words) {
    const dist = levenshtein(q, word);
    const threshold = Math.max(1, Math.floor(word.length * 0.3));
    if (dist <= threshold) return 1 - dist / (word.length + 1);
  }

  // Fuzzy on phonetic
  const pWords = tPhonetic.split(/\s+/);
  for (const word of pWords) {
    const dist = levenshtein(qPhonetic, word);
    const threshold = Math.max(1, Math.floor(word.length * 0.4));
    if (dist <= threshold) return 0.7 - dist / (word.length + 1);
  }

  return 0;
}

/**
 * Search nodes by query across Gujarati name, English name, and metadata.
 */
import type { FamilyNode, SearchResult } from '@/types';

export function searchNodes(nodes: FamilyNode[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const node of nodes) {
    if (node.hidden) continue;

    const scores: number[] = [];

    // Gujarati name
    const guScore = fuzzyMatch(query, node.nameGujarati);
    if (guScore > 0) scores.push(guScore);

    // English name
    const enScore = fuzzyMatch(query, node.nameEnglish);
    if (enScore > 0) scores.push(enScore);

    // Metadata fields
    if (node.metadata) {
      for (const val of Object.values(node.metadata)) {
        const mScore = fuzzyMatch(query, val);
        if (mScore > 0) scores.push(mScore * 0.7);
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

// Gujarati relationship labels
export const RELATIONSHIP_LABELS_GU: Record<string, string> = {
  self: 'પોતે',
  father: 'પિતા',
  mother: 'માતા',
  son: 'પુત્ર',
  daughter: 'પુત્રી',
  spouse: 'જીવનસાથી',
  brother: 'ભાઈ',
  sister: 'બહેન',
  grandfather: 'દાદા',
  grandmother: 'દાદી',
  grandson: 'પૌત્ર',
  granddaughter: 'પૌત્રી',
  uncle: 'કાકા',
  aunt: 'કાકી',
  cousin: 'પિત્રાઈ',
  nephew: 'ભત્રીજો',
  niece: 'ભત્રીજી',
  'great-grandfather': 'પ્રપિતામહ',
  'great-grandmother': 'પ્રમાતામહ',
  '2nd cousin': 'બીજા પિત્રાઈ',
  '1st cousin once removed': 'પ્રથમ પિત્રાઈ એક ડિગ્રી',
};
