'use client';
// ============================================================
// TreeSelector.tsx — Premier SaaS Dashboard & Demo Seeder
// ============================================================
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { FamilyTree } from '@/types';

export default function TreeSelector() {
  const router = useRouter();
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTrees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/trees');
      const data = await res.json();
      if (data.success) setTrees(data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  const createTree = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
        router.push(`/tree/${data.data._id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  // ─── 1-Click Seed Authentic Gujarati Demo Tree ──────────────
  const seedDemoTree = async () => {
    setIsSeeding(true);
    try {
      // 1. Create Tree
      const treeRes = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'પટેલ પરિવાર વંશાવળી (Patel Vanshavali)',
          description: 'સૂરત - બારડોલી વંશાવળી સહિત સાસરી પક્ષ તથા મોસાળ શાખાઓ',
        }),
      });
      const treeData = await treeRes.json();
      if (!treeData.success) throw new Error('Tree create failed');
      const treeId = treeData.data._id;

      // 2. Prepare Multi-generational Sample Data with In-Laws
      const demoNodes = [
        // Gen 1: Grandparents (વડીલો)
        {
          _id: 'dada1',
          nameGujarati: 'ભૂલાભાઈ પટેલ',
          nameEnglish: 'Bhulabhai Patel',
          gender: 'male',
          generation: 1,
          branchType: 'main',
          birthDate: '1895-04-10',
          deathDate: '1972-11-20',
          position: { x: 0, y: -240 },
          parentIds: [],
          childIds: ['motabapa1', 'pita1', 'kaka1', 'fai1'],
          spouseIds: ['dadi1'],
        },
        {
          _id: 'dadi1',
          nameGujarati: 'જમનાબેન પટેલ',
          nameEnglish: 'Jamnaben Patel',
          gender: 'female',
          generation: 1,
          branchType: 'main',
          birthDate: '1900-08-15',
          deathDate: '1980-02-14',
          position: { x: 220, y: -240 },
          parentIds: [],
          childIds: ['motabapa1', 'pita1', 'kaka1', 'fai1'],
          spouseIds: ['dada1'],
        },

        // Gen 2: Motabapa & Motiba
        {
          _id: 'motabapa1',
          nameGujarati: 'ચીમનલાલ પટેલ (મોટાબાપા)',
          nameEnglish: 'Chimanlal Patel (Motabapa)',
          gender: 'male',
          generation: 2,
          branchType: 'main',
          birthDate: '1922-01-05',
          position: { x: -380, y: -70 },
          parentIds: ['dada1', 'dadi1'],
          childIds: [],
          spouseIds: ['motiba1'],
        },
        {
          _id: 'motiba1',
          nameGujarati: 'હંસાબેન પટેલ (મોટીબા)',
          nameEnglish: 'Hansaben Patel (Motiba)',
          gender: 'female',
          generation: 2,
          branchType: 'main',
          birthDate: '1926-06-12',
          position: { x: -180, y: -70 },
          parentIds: [],
          childIds: [],
          spouseIds: ['motabapa1'],
        },

        // Gen 2: Father (રમેશભાઈ) & Mother (સુમિત્રાબેન)
        {
          _id: 'pita1',
          nameGujarati: 'રમેશભાઈ પટેલ (પિતા)',
          nameEnglish: 'Rameshbhai Patel (Father)',
          gender: 'male',
          generation: 2,
          branchType: 'main',
          birthDate: '1928-09-19',
          position: { x: 40, y: -70 },
          parentIds: ['dada1', 'dadi1'],
          childIds: ['sunil1', 'geeta1'],
          spouseIds: ['mata1'],
        },
        {
          _id: 'mata1',
          nameGujarati: 'સુમિત્રાબેન પટેલ (માતા)',
          nameEnglish: 'Sumitraben Patel (Mother)',
          gender: 'female',
          generation: 2,
          branchType: 'main',
          birthDate: '1932-12-01',
          position: { x: 260, y: -70 },
          parentIds: [],
          childIds: ['sunil1', 'geeta1'],
          spouseIds: ['pita1'],
          // In-Laws linked to Mata (Sasara, Sasu, Jeth, Der, Nanand, Patala Sasu)
          inLawNodeIds: ['sasara1', 'sasu1', 'jeth1', 'patala_sasu1', 'der1', 'nanand1'],
          inLawsHidden: true, // Default hidden as per user request!
        },

        // Gen 2: Kaka & Kaki
        {
          _id: 'kaka1',
          nameGujarati: 'મનુભાઈ પટેલ (કાકા)',
          nameEnglish: 'Manubhai Patel (Kaka)',
          gender: 'male',
          generation: 2,
          branchType: 'main',
          birthDate: '1935-03-22',
          position: { x: 480, y: -70 },
          parentIds: ['dada1', 'dadi1'],
          childIds: [],
          spouseIds: ['kaki1'],
        },
        {
          _id: 'kaki1',
          nameGujarati: 'ઉષાબેન પટેલ (કાકી)',
          nameEnglish: 'Ushaben Patel (Kaki)',
          gender: 'female',
          generation: 2,
          branchType: 'main',
          birthDate: '1938-07-09',
          position: { x: 680, y: -70 },
          parentIds: [],
          childIds: [],
          spouseIds: ['kaka1'],
        },

        // Gen 2: Fai & Fuva
        {
          _id: 'fai1',
          nameGujarati: 'કોકિલાબેન (ફઈ / ફોઈ)',
          nameEnglish: 'Kokilaben (Fai)',
          gender: 'female',
          generation: 2,
          branchType: 'main',
          birthDate: '1940-10-18',
          position: { x: 900, y: -70 },
          parentIds: ['dada1', 'dadi1'],
          childIds: [],
          spouseIds: ['fuva1'],
        },
        {
          _id: 'fuva1',
          nameGujarati: 'પ્રમોદરાય (ફુવા)',
          nameEnglish: 'Pramodrai (Fuva)',
          gender: 'male',
          generation: 2,
          branchType: 'main',
          birthDate: '1937-05-14',
          position: { x: 1100, y: -70 },
          parentIds: [],
          childIds: [],
          spouseIds: ['fai1'],
        },

        // Gen 3: Children (સુનીલ & ગીતા)
        {
          _id: 'sunil1',
          nameGujarati: 'સુનીલ પટેલ (પુત્ર)',
          nameEnglish: 'Sunil Patel (Son)',
          gender: 'male',
          generation: 3,
          branchType: 'main',
          birthDate: '1958-02-11',
          position: { x: -60, y: 120 },
          parentIds: ['pita1', 'mata1'],
          childIds: ['rahul1'],
          spouseIds: [],
        },
        {
          _id: 'geeta1',
          nameGujarati: 'ગીતાબેન (પુત્રી)',
          nameEnglish: 'Geetaben (Daughter)',
          gender: 'female',
          generation: 3,
          branchType: 'main',
          birthDate: '1962-07-25',
          position: { x: 220, y: 120 },
          parentIds: ['pita1', 'mata1'],
          childIds: [],
          spouseIds: ['jamai1'],
          inLawNodeIds: ['sasara1', 'sasu1', 'der1'],
          inLawsHidden: true, // Default hidden!
        },
        {
          _id: 'jamai1',
          nameGujarati: 'અશોકકુમાર (જમાઈરાજ)',
          nameEnglish: 'Ashokkumar (Son-in-law)',
          gender: 'male',
          generation: 3,
          branchType: 'in-law',
          birthDate: '1959-11-04',
          position: { x: 440, y: 120 },
          parentIds: [],
          childIds: [],
          spouseIds: ['geeta1'],
        },

        // Gen 4: Grandson (પૌત્ર રાહુલ)
        {
          _id: 'rahul1',
          nameGujarati: 'રાહુલ પટેલ (પૌત્ર)',
          nameEnglish: 'Rahul Patel (Grandson)',
          gender: 'male',
          generation: 4,
          branchType: 'main',
          birthDate: '1988-06-19',
          position: { x: -60, y: 280 },
          parentIds: ['sunil1'],
          childIds: [],
          spouseIds: [],
        },

        // ─── In-Laws Branch (સાસરી પક્ષ) — Linked to Mother / Daughter ──
        // (Positioned above or alongside, default hidden)
        {
          _id: 'sasara1',
          nameGujarati: 'મણીલાલ સસરાજી (સસરા)',
          nameEnglish: 'Manilal Sasara (Father-in-law)',
          gender: 'male',
          generation: 1,
          branchType: 'in-law',
          kinshipTitle: 'સસરા',
          position: { x: 180, y: -260 },
          parentIds: [],
          childIds: ['mata1', 'jeth1', 'der1', 'nanand1'],
          spouseIds: ['sasu1'],
          hidden: true, // Hidden by default!
        },
        {
          _id: 'sasu1',
          nameGujarati: 'દક્ષાબેન સાસુજી (સાસુ)',
          nameEnglish: 'Daxaben Sasu (Mother-in-law)',
          gender: 'female',
          generation: 1,
          branchType: 'in-law',
          kinshipTitle: 'સાસુ',
          position: { x: 380, y: -260 },
          parentIds: [],
          childIds: ['mata1', 'jeth1', 'der1', 'nanand1'],
          spouseIds: ['sasara1'],
          hidden: true, // Hidden by default!
        },
        {
          _id: 'jeth1',
          nameGujarati: 'કિશોરભાઈ (જેઠજી)',
          nameEnglish: 'Kishorbhai (Jeth - Elder Bro-in-law)',
          gender: 'male',
          generation: 2,
          branchType: 'in-law',
          kinshipTitle: 'જેઠ',
          position: { x: 480, y: -190 },
          parentIds: ['sasara1', 'sasu1'],
          childIds: [],
          spouseIds: ['patala_sasu1'],
          hidden: true, // Hidden by default!
        },
        {
          _id: 'patala_sasu1',
          nameGujarati: 'શિલ્પાબેન (પાટલા સાસુ / જેઠાણી)',
          nameEnglish: 'Shilpaben (Patala Sasu)',
          gender: 'female',
          generation: 2,
          branchType: 'in-law',
          kinshipTitle: 'પાટલા સાસુ',
          position: { x: 680, y: -190 },
          parentIds: [],
          childIds: [],
          spouseIds: ['jeth1'],
          hidden: true, // Hidden by default!
        },
        {
          _id: 'der1',
          nameGujarati: 'ભાવેશભાઈ (દિયર / દેર)',
          nameEnglish: 'Bhaveshbhai (Der - Younger Bro-in-law)',
          gender: 'male',
          generation: 2,
          branchType: 'in-law',
          kinshipTitle: 'દિયર / દેર',
          position: { x: 480, y: 10 },
          parentIds: ['sasara1', 'sasu1'],
          childIds: [],
          spouseIds: [],
          hidden: true, // Hidden by default!
        },
        {
          _id: 'nanand1',
          nameGujarati: 'ચેતનાબેન (નણંદ)',
          nameEnglish: 'Chetnaben (Nanand - Sister-in-law)',
          gender: 'female',
          generation: 2,
          branchType: 'in-law',
          kinshipTitle: 'નણંદ',
          position: { x: 680, y: 10 },
          parentIds: ['sasara1', 'sasu1'],
          childIds: [],
          spouseIds: [],
          hidden: true, // Hidden by default!
        },
      ];

      // 3. Bulk Insert
      const nodesRes = await fetch('/api/nodes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeId, nodes: demoNodes }),
      });
      const nodesData = await nodesRes.json();
      if (!nodesData.success) throw new Error('Nodes seed failed');

      router.push(`/tree/${treeId}`);
    } catch (err) {
      console.error(err);
      alert('સીડિંગ દરમિયાન ખામી સર્જાઈ');
    } finally {
      setIsSeeding(false);
    }
  };

  const deleteTree = async (id: string, name: string) => {
    if (!confirm(`શું તમે ખાતરીપૂર્વક "${name}" વંશાવળી કાઢી નાખવા માંગો છો?`)) return;
    await fetch(`/api/trees/${id}`, { method: 'DELETE' });
    setTrees(t => t.filter(x => x._id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E1522]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
            કુટુંબ <span className="font-normal text-slate-400">· Kutumb Canvas</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={seedDemoTree}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all shadow-xs disabled:opacity-50"
          >
            <span>{isSeeding ? 'સીડ થઈ રહ્યું છે…' : '✨ ડેમો વંશાવળી લોડ કરો'}</span>
          </button>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>નવી વંશાવળી</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Hero & Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-xs font-semibold mb-4">
            <span>✦ પૂર્ણ ગુજરાતી સંબંધ પરિભાષા (કાકા, મામા, માસી, ફઈ, સાસુ, સસરા, પાટલા સાસુ)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            કૌટુંબિક વંશાવળી કેનવાસ
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            આધુનિક 60 FPS કેનવાસ એન્જિન, ડિફોલ્ટ છુપાયેલી સાસરી પક્ષ શાખાઓ, ધ્વન્યાત્મક ગુજરાતી શોધ અને ઝીરો-કોસ્ટ આર્કિટેક્ચર સાથે તમારી પેઢીઓ સાચવો.
          </p>
        </div>

        {/* Tree List Grid */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              વંશાવળી લોડ થઈ રહી છે…
            </div>
          ) : trees.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                હજુ સુધી કોઈ વંશાવળી નથી
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm mx-auto">
                નવી વંશાવળી શરૂ કરો અથવા તૈયાર ગુજરાતી સંબંધીઓ વાળી ડેમો વંશાવળી જુઓ.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={seedDemoTree}
                  disabled={isSeeding}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all"
                >
                  ✨ ડેમો વંશાવળી લોડ કરો
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  + નવી વંશાવળી બનાવો
                </button>
              </div>
            </div>
          ) : (
            trees.map(tree => (
              <div
                key={tree._id}
                className="group p-5 bg-white dark:bg-[#111928] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>

                  <div className="truncate">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {tree.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {tree.description || 'કોઈ વર્ણન નથી'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                      <span>{tree.nodeCount || 0} સભ્યો</span>
                      <span>·</span>
                      <span>અપડેટ: {new Date(tree.updatedAt ?? Date.now()).toLocaleDateString('gu-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteTree(tree._id, tree.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>

                  <button
                    onClick={() => router.push(`/tree/${tree._id}`)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-1"
                  >
                    <span>કેનવાસ ખોલો</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 px-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>કુટુંબ વંશાવળી પ્લેટફોર્મ — 100% Zero-Cost Next.js & Canvas Architecture</span>
        <span>HTML5 Canvas 60 FPS Engine</span>
      </footer>

      {/* Create Tree Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#111928] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              નવી કૌટુંબિક વંશાવળી શરૂ કરો
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              તમારા કુટુંબ કે કુળની વંશાવળીનું નામ અને વિગત આપો.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  વંશાવળીનું નામ (Tree Name) *
                </label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createTree()}
                  placeholder="ઉદા. પટેલ પરિવાર વંશાવળી"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  વર્ણન (ગામ, વતન, ગોત્ર વિગેરે)
                </label>
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="ઉદા. મૂળ વતન: બારડોલી, સૂરત"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                રદ કરો (Cancel)
              </button>
              <button
                onClick={createTree}
                disabled={!newName.trim() || creating}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {creating ? 'બનાવી રહ્યું છે…' : 'વંશાવળી બનાવો →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
