// ============================================================
// Comprehensive Gujarati Kinship Engine
// ============================================================
// Models exact traditional Gujarati kinship nomenclature:
// દાદા, દાદી, નાના, નાની, કાકા, કાકી, મોટાબાપા, મોટીબા, ફઈ, ફુવા,
// મામા, મામી, માસી, માસા, જેઠ, જેઠાણી, દિયર, દેરાણી, નણંદ, નણદોઈ,
// સાળો, સાળી, સાડુભાઈ, સાસુ, સસરા, પાટલા સાસુ, વેવાઈ, વેવાણ,
// ભત્રીજો, ભત્રીજી, ભાણેજ, ભાણી, પિત્રાઈ, માસિયાઈ, મામાઈ, ફઈયાઈ.

import type { FamilyNode, KinshipResult, Gender } from '@/types';

interface EdgeStep {
  fromId: string;
  toId: string;
  relation: 'father' | 'mother' | 'son' | 'daughter' | 'brother' | 'sister' | 'husband' | 'wife';
}

/**
 * Find shortest path through kinship graph using BFS
 */
export function findKinshipPath(
  fromId: string,
  toId: string,
  nodeMap: Map<string, FamilyNode>
): EdgeStep[] | null {
  if (fromId === toId) return [];

  const visited = new Set<string>([fromId]);
  const queue: { currentId: string; path: EdgeStep[] }[] = [{ currentId: fromId, path: [] }];

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;
    if (currentId === toId) return path;

    const curr = nodeMap.get(currentId);
    if (!curr) continue;

    // 1. Parents
    for (const pid of curr.parentIds) {
      if (!visited.has(pid)) {
        visited.add(pid);
        const p = nodeMap.get(pid);
        const relation = p?.gender === 'female' ? 'mother' : 'father';
        queue.push({
          currentId: pid,
          path: [...path, { fromId: currentId, toId: pid, relation }],
        });
      }
    }

    // 2. Children
    for (const cid of curr.childIds) {
      if (!visited.has(cid)) {
        visited.add(cid);
        const c = nodeMap.get(cid);
        const relation = c?.gender === 'female' ? 'daughter' : 'son';
        queue.push({
          currentId: cid,
          path: [...path, { fromId: currentId, toId: cid, relation }],
        });
      }
    }

    // 3. Spouses
    for (const sid of curr.spouseIds) {
      if (!visited.has(sid)) {
        visited.add(sid);
        const s = nodeMap.get(sid);
        const relation = s?.gender === 'female' ? 'wife' : 'husband';
        queue.push({
          currentId: sid,
          path: [...path, { fromId: currentId, toId: sid, relation }],
        });
      }
    }

    // 4. Siblings (derived via common parents)
    const siblings = new Set<string>();
    for (const pid of curr.parentIds) {
      const p = nodeMap.get(pid);
      if (p) {
        for (const cid of p.childIds) {
          if (cid !== currentId) siblings.add(cid);
        }
      }
    }
    for (const sibId of siblings) {
      if (!visited.has(sibId)) {
        visited.add(sibId);
        const sib = nodeMap.get(sibId);
        const relation = sib?.gender === 'female' ? 'sister' : 'brother';
        queue.push({
          currentId: sibId,
          path: [...path, { fromId: currentId, toId: sibId, relation }],
        });
      }
    }
  }

  return null;
}

/**
 * Determine exact Gujarati kinship term from relation steps
 */
export function calculateGujaratiKinship(
  fromId: string,
  toId: string,
  nodes: FamilyNode[]
): KinshipResult {
  if (fromId === toId) {
    return {
      termGujarati: 'પોતે',
      termPhonetic: 'Pote',
      termEnglish: 'Self',
      descriptionGujarati: 'પોતે (તમારી પોતાની પ્રોફાઈલ)',
      category: 'direct',
      generationDiff: 0,
      path: [fromId],
    };
  }

  const nodeMap = new Map<string, FamilyNode>(nodes.map(n => [n._id, n]));
  const fromNode = nodeMap.get(fromId);
  const toNode = nodeMap.get(toId);

  if (!fromNode || !toNode) {
    return {
      termGujarati: 'અજાણ્યો સંબંધ',
      termPhonetic: 'Ajananyo Sambandh',
      termEnglish: 'Unknown',
      descriptionGujarati: 'વ્યક્તિ મળતી નથી',
      category: 'unrelated',
      generationDiff: 0,
      path: [],
    };
  }

  // Check manual override if specified on node
  if (toNode.kinshipTitle) {
    return {
      termGujarati: toNode.kinshipTitle,
      termPhonetic: toNode.kinshipTitle,
      termEnglish: 'Custom Role',
      descriptionGujarati: `નિર્ધારિત ભૂમિકા: ${toNode.kinshipTitle}`,
      category: 'extended',
      generationDiff: 0,
      path: [fromId, toId],
    };
  }

  // Direct Spouse Check
  if (fromNode.spouseIds.includes(toId) || toNode.spouseIds.includes(fromId)) {
    const isWife = toNode.gender === 'female';
    return {
      termGujarati: isWife ? 'પત્ની' : 'પતિ',
      termPhonetic: isWife ? 'Patni' : 'Pati',
      termEnglish: isWife ? 'Wife' : 'Husband',
      descriptionGujarati: isWife ? 'તમારી ધર્મપત્ની (જીવનસાથી)' : 'તમારા પતિ (જીવનસાથી)',
      category: 'direct',
      generationDiff: 0,
      path: [fromId, toId],
    };
  }

  // Find step-by-step path
  const steps = findKinshipPath(fromId, toId, nodeMap);
  if (!steps || steps.length === 0) {
    return {
      termGujarati: 'કોઈ સીધો સંબંધ નથી',
      termPhonetic: 'Koi Seedho Sambandh Nathi',
      termEnglish: 'Unrelated / Distant',
      descriptionGujarati: 'આ વૃક્ષમાં સીધો કૌટુંબિક સંબંધ મળ્યો નથી',
      category: 'unrelated',
      generationDiff: 0,
      path: [],
    };
  }

  const pathIds = [fromId, ...steps.map(s => s.toId)];
  const relStr = steps.map(s => s.relation).join('->');
  const targetGender = toNode.gender;
  const isFemaleObserver = fromNode.gender === 'female';

  // ─── 1. Parents (1 Step) ──────────────────────────────────
  if (relStr === 'father') {
    return {
      termGujarati: 'પિતા / બાપુજી',
      termPhonetic: 'Pita / Bapuji',
      termEnglish: 'Father',
      descriptionGujarati: 'તમારા પિતાશ્રી',
      category: 'paternal',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'mother') {
    return {
      termGujarati: 'માતા / બા',
      termPhonetic: 'Mata / Ba',
      termEnglish: 'Mother',
      descriptionGujarati: 'તમારી પૂજ્ય માતાશ્રી',
      category: 'maternal',
      generationDiff: 1,
      path: pathIds,
    };
  }

  // ─── 2. Children (1 Step) ─────────────────────────────────
  if (relStr === 'son') {
    return {
      termGujarati: 'પુત્ર / દીકરો',
      termPhonetic: 'Putra / Dikro',
      termEnglish: 'Son',
      descriptionGujarati: 'તમારો પુત્ર',
      category: 'direct',
      generationDiff: -1,
      path: pathIds,
    };
  }
  if (relStr === 'daughter') {
    return {
      termGujarati: 'પુત્રી / દીકરી',
      termPhonetic: 'Putri / Dikri',
      termEnglish: 'Daughter',
      descriptionGujarati: 'તમારી પુત્રી',
      category: 'direct',
      generationDiff: -1,
      path: pathIds,
    };
  }

  // ─── 3. Siblings (1 Step) ─────────────────────────────────
  if (relStr === 'brother') {
    return {
      termGujarati: 'ભાઈ',
      termPhonetic: 'Bhai',
      termEnglish: 'Brother',
      descriptionGujarati: 'તમારા સગા ભાઈ',
      category: 'sibling',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'sister') {
    return {
      termGujarati: 'બહેન',
      termPhonetic: 'Bahen',
      termEnglish: 'Sister',
      descriptionGujarati: 'તમારી સગી બહેન',
      category: 'sibling',
      generationDiff: 0,
      path: pathIds,
    };
  }

  // ─── 4. Paternal Grandparents (2 Steps) ───────────────────
  if (relStr === 'father->father') {
    return {
      termGujarati: 'દાદા',
      termPhonetic: 'Dada',
      termEnglish: 'Paternal Grandfather',
      descriptionGujarati: 'પિતાના પિતા (દાદાજી)',
      category: 'paternal',
      generationDiff: 2,
      path: pathIds,
    };
  }
  if (relStr === 'father->mother') {
    return {
      termGujarati: 'દાદી',
      termPhonetic: 'Dadi',
      termEnglish: 'Paternal Grandmother',
      descriptionGujarati: 'પિતાની માતા (દાદીમા)',
      category: 'paternal',
      generationDiff: 2,
      path: pathIds,
    };
  }

  // ─── 5. Maternal Grandparents (2 Steps) ───────────────────
  if (relStr === 'mother->father') {
    return {
      termGujarati: 'નાના',
      termPhonetic: 'Nana',
      termEnglish: 'Maternal Grandfather',
      descriptionGujarati: 'માતાના પિતા (નાનાજી - મોસાળ)',
      category: 'maternal',
      generationDiff: 2,
      path: pathIds,
    };
  }
  if (relStr === 'mother->mother') {
    return {
      termGujarati: 'નાની',
      termPhonetic: 'Nani',
      termEnglish: 'Maternal Grandmother',
      descriptionGujarati: 'માતાની માતા (નાનીમા - મોસાળ)',
      category: 'maternal',
      generationDiff: 2,
      path: pathIds,
    };
  }

  // ─── 6. Father's Siblings: Kaka, Motabapa, Fai ─────────────
  if (relStr === 'father->brother') {
    // Check birth year / age if available
    const fBirth = fromNode.birthDate ? parseInt(fromNode.birthDate.split('-')[0]) : null;
    const tBirth = toNode.birthDate ? parseInt(toNode.birthDate.split('-')[0]) : null;
    const isElder = tBirth && fBirth ? tBirth < fBirth : false;

    return {
      termGujarati: isElder ? 'મોટાબાપા / વડીલ પિતા' : 'કાકા',
      termPhonetic: isElder ? 'Motabapa' : 'Kaka',
      termEnglish: isElder ? "Father's Elder Brother" : "Paternal Uncle (Father's younger brother)",
      descriptionGujarati: isElder ? 'પિતાના મોટા ભાઈ' : 'પિતાના નાના ભાઈ',
      category: 'paternal',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'father->brother->wife') {
    return {
      termGujarati: 'કાકી / મોટીબા',
      termPhonetic: 'Kaki / Motiba',
      termEnglish: 'Paternal Aunt (Uncle’s Wife)',
      descriptionGujarati: 'કાકા અથવા મોટાબાપાની પત્ની',
      category: 'paternal',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'father->sister') {
    return {
      termGujarati: 'ફઈ / ફોઈ',
      termPhonetic: 'Fai / Foi',
      termEnglish: "Paternal Aunt (Father's sister)",
      descriptionGujarati: 'પિતાશ્રીની બહેન',
      category: 'paternal',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'father->sister->husband') {
    return {
      termGujarati: 'ફુવા',
      termPhonetic: 'Fuva',
      termEnglish: "Father's sister's husband",
      descriptionGujarati: 'ફઈના પતિ',
      category: 'paternal',
      generationDiff: 1,
      path: pathIds,
    };
  }

  // ─── 7. Mother's Siblings: Mama, Masi (Mosal) ───────────────
  if (relStr === 'mother->brother') {
    return {
      termGujarati: 'મામા',
      termPhonetic: 'Mama',
      termEnglish: 'Maternal Uncle (Mother’s brother)',
      descriptionGujarati: 'માતાના ભાઈ (મોસાળ પક્ષ)',
      category: 'maternal',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'mother->brother->wife') {
    return {
      termGujarati: 'મામી',
      termPhonetic: 'Mami',
      termEnglish: "Maternal Uncle's wife",
      descriptionGujarati: 'મામાની પત્ની (મોસાળ પક્ષ)',
      category: 'maternal',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'mother->sister') {
    return {
      termGujarati: 'માસી',
      termPhonetic: 'Masi',
      termEnglish: 'Maternal Aunt (Mother’s sister)',
      descriptionGujarati: 'માતાની બહેન (મોસાળ પક્ષ)',
      category: 'maternal',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'mother->sister->husband') {
    return {
      termGujarati: 'માસા',
      termPhonetic: 'Masa',
      termEnglish: "Maternal Aunt's husband",
      descriptionGujarati: 'માસીના પતિ',
      category: 'maternal',
      generationDiff: 1,
      path: pathIds,
    };
  }

  // ─── 8. In-Laws (સાસરી પક્ષ / વહુ-જમાઈ પક્ષ) ──────────────────
  // A. For Wife looking at Husband's family:
  if (relStr === 'husband->father' || relStr === 'wife->father') {
    return {
      termGujarati: 'સસરા',
      termPhonetic: 'Sasara',
      termEnglish: 'Father-in-law',
      descriptionGujarati: isFemaleObserver ? 'પતિના પિતા (સાસરી પક્ષ)' : 'પત્નીના પિતા (સાસરી પક્ષ)',
      category: 'in-law',
      generationDiff: 1,
      path: pathIds,
    };
  }
  if (relStr === 'husband->mother' || relStr === 'wife->mother') {
    return {
      termGujarati: 'સાસુ',
      termPhonetic: 'Sasu',
      termEnglish: 'Mother-in-law',
      descriptionGujarati: isFemaleObserver ? 'પતિની માતા (સાસરી પક્ષ)' : 'પત્નીની માતા (સાસરી પક્ષ)',
      category: 'in-law',
      generationDiff: 1,
      path: pathIds,
    };
  }

  // B. Patala Sasu (પાટલા સાસુ) - Elder in-law / Husband's elder brother's wife / Grandmother-in-law
  if (
    relStr === 'husband->brother->wife' ||
    relStr === 'husband->father->brother->wife' ||
    relStr === 'husband->father->mother'
  ) {
    return {
      termGujarati: 'પાટલા સાસુ / જેઠાણી',
      termPhonetic: 'Patala Sasu / Jethani',
      termEnglish: 'Elder Mother-in-law / Senior Sister-in-law',
      descriptionGujarati: 'પતિની વડીલ ભાભી (જેઠાણી) અથવા વડીલ સાસુ સમાન માનવાચક સંબંધ',
      category: 'in-law',
      generationDiff: relStr.includes('father') ? 1 : 0,
      path: pathIds,
    };
  }

  // C. Husband's Siblings: Jeth, Diyar/Der, Nanand
  if (relStr === 'husband->brother') {
    const hBirth = fromNode.birthDate ? parseInt(fromNode.birthDate.split('-')[0]) : null;
    const tBirth = toNode.birthDate ? parseInt(toNode.birthDate.split('-')[0]) : null;
    const isElder = tBirth && hBirth ? tBirth < hBirth : false;

    return {
      termGujarati: isElder ? 'જેઠ' : 'દિયર / દેર',
      termPhonetic: isElder ? 'Jeth' : 'Diyar / Der',
      termEnglish: isElder ? "Husband's elder brother" : "Husband's younger brother (Brother-in-law)",
      descriptionGujarati: isElder ? 'પતિના મોટા ભાઈ' : 'પતિના નાના ભાઈ (દિયરજી)',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'husband->sister') {
    return {
      termGujarati: 'નણંદ',
      termPhonetic: 'Nanand',
      termEnglish: "Husband's sister (Sister-in-law)",
      descriptionGujarati: 'પતિની બહેન',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'husband->sister->husband') {
    return {
      termGujarati: 'નણદોઈ',
      termPhonetic: 'Nandoi',
      termEnglish: "Husband's sister's husband",
      descriptionGujarati: 'નણંદના પતિ',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }

  // D. Wife's Siblings: Saalo, Saali, Saadubhai
  if (relStr === 'wife->brother') {
    return {
      termGujarati: 'સાળો',
      termPhonetic: 'Saalo',
      termEnglish: "Wife's brother (Brother-in-law)",
      descriptionGujarati: 'પત્નીના ભાઈ',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'wife->brother->wife') {
    return {
      termGujarati: 'સાળાવેલી',
      termPhonetic: 'Salaveli',
      termEnglish: "Wife's brother's wife",
      descriptionGujarati: 'સાળાની પત્ની',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'wife->sister') {
    return {
      termGujarati: 'સાળી',
      termPhonetic: 'Saali',
      termEnglish: "Wife's sister (Sister-in-law)",
      descriptionGujarati: 'પત્નીની બહેન',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'wife->sister->husband') {
    return {
      termGujarati: 'સાડુભાઈ',
      termPhonetic: 'Saadubhai',
      termEnglish: "Wife's sister's husband (Co-brother-in-law)",
      descriptionGujarati: 'સાળીના પતિ',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }

  // E. In-Law Children: Jamai, Putravadhu (Vahu)
  if (relStr === 'son->wife') {
    return {
      termGujarati: 'પુત્રવધૂ / વહુ',
      termPhonetic: 'Putravadhu / Vahu',
      termEnglish: 'Daughter-in-law (Son’s wife)',
      descriptionGujarati: 'પુત્રની પત્ની (ઘરની લક્ષ્મી)',
      category: 'in-law',
      generationDiff: -1,
      path: pathIds,
    };
  }
  if (relStr === 'daughter->husband') {
    return {
      termGujarati: 'જમાઈ',
      termPhonetic: 'Jamai',
      termEnglish: 'Son-in-law (Daughter’s husband)',
      descriptionGujarati: 'પુત્રીના પતિ (જમાઈરાજ)',
      category: 'in-law',
      generationDiff: -1,
      path: pathIds,
    };
  }

  // F. Vevai / Vevan (Child's In-Laws)
  if (relStr === 'son->wife->father' || relStr === 'daughter->husband->father') {
    return {
      termGujarati: 'વેવાઈ',
      termPhonetic: 'Vevai',
      termEnglish: "Child's father-in-law (Co-parent-in-law)",
      descriptionGujarati: 'પુત્ર કે પુત્રીના સસરા',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'son->wife->mother' || relStr === 'daughter->husband->mother') {
    return {
      termGujarati: 'વેવાણ',
      termPhonetic: 'Vevan',
      termEnglish: "Child's mother-in-law (Co-parent-in-law)",
      descriptionGujarati: 'પુત્ર કે પુત્રીની સાસુ',
      category: 'in-law',
      generationDiff: 0,
      path: pathIds,
    };
  }

  // ─── 9. Nieces and Nephews ────────────────────────────────
  if (relStr === 'brother->son') {
    return {
      termGujarati: 'ભત્રીજો',
      termPhonetic: 'Bhatrijo',
      termEnglish: "Brother's son (Nephew)",
      descriptionGujarati: 'ભાઈનો દીકરો',
      category: 'paternal',
      generationDiff: -1,
      path: pathIds,
    };
  }
  if (relStr === 'brother->daughter') {
    return {
      termGujarati: 'ભત્રીજી',
      termPhonetic: 'Bhatriji',
      termEnglish: "Brother's daughter (Niece)",
      descriptionGujarati: 'ભાઈની દીકરી',
      category: 'paternal',
      generationDiff: -1,
      path: pathIds,
    };
  }
  if (relStr === 'sister->son') {
    return {
      termGujarati: 'ભાણેજ',
      termPhonetic: 'Bhanej',
      termEnglish: "Sister's son (Nephew)",
      descriptionGujarati: 'બહેનનો દીકરો',
      category: 'maternal',
      generationDiff: -1,
      path: pathIds,
    };
  }
  if (relStr === 'sister->daughter') {
    return {
      termGujarati: 'ભાણી',
      termPhonetic: 'Bhani',
      termEnglish: "Sister's daughter (Niece)",
      descriptionGujarati: 'બહેનની દીકરી',
      category: 'maternal',
      generationDiff: -1,
      path: pathIds,
    };
  }

  // ─── 10. Cousins (પિત્રાઈ, માસિયાઈ, મામાઈ, ફઈયાઈ) ──────────
  if (relStr === 'father->brother->son') {
    return {
      termGujarati: 'પિત્રાઈ ભાઈ',
      termPhonetic: 'Pitrai Bhai',
      termEnglish: 'Paternal Cousin Brother',
      descriptionGujarati: 'કાકા અથવા મોટાબાપાનો દીકરો',
      category: 'paternal',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'father->brother->daughter') {
    return {
      termGujarati: 'પિત્રાઈ બહેન',
      termPhonetic: 'Pitrai Bahen',
      termEnglish: 'Paternal Cousin Sister',
      descriptionGujarati: 'કાકા અથવા મોટાબાપાની દીકરી',
      category: 'paternal',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'mother->brother->son') {
    return {
      termGujarati: 'મામાઈ ભાઈ',
      termPhonetic: 'Mamai Bhai',
      termEnglish: 'Maternal Cousin Brother',
      descriptionGujarati: 'મામાનો દીકરો (મોસાળ પક્ષ)',
      category: 'maternal',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'mother->brother->daughter') {
    return {
      termGujarati: 'મામાઈ બહેન',
      termPhonetic: 'Mamai Bahen',
      termEnglish: 'Maternal Cousin Sister',
      descriptionGujarati: 'મામાની દીકરી (મોસાળ પક્ષ)',
      category: 'maternal',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'mother->sister->son') {
    return {
      termGujarati: 'માસિયાઈ ભાઈ',
      termPhonetic: 'Masiyai Bhai',
      termEnglish: 'Maternal Aunt Cousin Brother',
      descriptionGujarati: 'માસીનો દીકરો',
      category: 'maternal',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'mother->sister->daughter') {
    return {
      termGujarati: 'માસિયાઈ બહેન',
      termPhonetic: 'Masiyai Bahen',
      termEnglish: 'Maternal Aunt Cousin Sister',
      descriptionGujarati: 'માસીની દીકરી',
      category: 'maternal',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'father->sister->son') {
    return {
      termGujarati: 'ફઈયાઈ ભાઈ',
      termPhonetic: 'Faiyai Bhai',
      termEnglish: 'Paternal Aunt Cousin Brother',
      descriptionGujarati: 'ફઈનો દીકરો',
      category: 'paternal',
      generationDiff: 0,
      path: pathIds,
    };
  }
  if (relStr === 'father->sister->daughter') {
    return {
      termGujarati: 'ફઈયાઈ બહેન',
      termPhonetic: 'Faiyai Bahen',
      termEnglish: 'Paternal Aunt Cousin Sister',
      descriptionGujarati: 'ફઈની દીકરી',
      category: 'paternal',
      generationDiff: 0,
      path: pathIds,
    };
  }

  // ─── 11. Grandchildren ────────────────────────────────────
  if (relStr === 'son->son') {
    return {
      termGujarati: 'પૌત્ર',
      termPhonetic: 'Pautra',
      termEnglish: "Son's son (Grandson)",
      descriptionGujarati: 'દીકરાનો દીકરો',
      category: 'direct',
      generationDiff: -2,
      path: pathIds,
    };
  }
  if (relStr === 'son->daughter') {
    return {
      termGujarati: 'પૌત્રી',
      termPhonetic: 'Pautri',
      termEnglish: "Son's daughter (Granddaughter)",
      descriptionGujarati: 'દીકરાની દીકરી',
      category: 'direct',
      generationDiff: -2,
      path: pathIds,
    };
  }
  if (relStr === 'daughter->son') {
    return {
      termGujarati: 'દોહિત્ર / ભાણો',
      termPhonetic: 'Dohitra',
      termEnglish: "Daughter's son (Grandson)",
      descriptionGujarati: 'દીકરીનો દીકરો',
      category: 'direct',
      generationDiff: -2,
      path: pathIds,
    };
  }
  if (relStr === 'daughter->daughter') {
    return {
      termGujarati: 'દોહિત્રી / ભાણી',
      termPhonetic: 'Dohitri',
      termEnglish: "Daughter's daughter (Granddaughter)",
      descriptionGujarati: 'દીકરીની દીકરી',
      category: 'direct',
      generationDiff: -2,
      path: pathIds,
    };
  }

  // Generic Generation calculation fallback
  const genUp = steps.filter(s => s.relation === 'father' || s.relation === 'mother').length;
  const genDown = steps.filter(s => s.relation === 'son' || s.relation === 'daughter').length;
  const netGen = genUp - genDown;

  return {
    termGujarati: `${Math.abs(netGen)} પેઢી ${netGen > 0 ? 'મોટા' : netGen < 0 ? 'નાના' : 'સમકક્ષ'} સગા`,
    termPhonetic: `${Math.abs(netGen)} Pedhi Sagao`,
    termEnglish: `${Math.abs(netGen)} Generation(s) ${netGen > 0 ? 'Ascendant' : netGen < 0 ? 'Descendant' : 'Collateral'}`,
    descriptionGujarati: `કૌટુંબિક સંબંધ (${steps.length} પગલાં)`,
    category: 'extended',
    generationDiff: netGen,
    path: pathIds,
  };
}
