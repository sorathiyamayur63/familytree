'use client';
// ============================================================
// StatsPanel.tsx — Family Tree Analytics & Gujarati Kinship Analyzer
// ============================================================
import React, { useMemo, useState } from 'react';
import { useTreeStore } from '@/store/treeStore';
import { calculateGujaratiKinship } from '@/lib/kinship';
import type { TreeStats } from '@/types';

export default function StatsPanel() {
  const { nodes, showStatsPanel, toggleStatsPanel, showNameInGujarati } = useTreeStore();

  const [calcFromId, setCalcFromId] = useState<string | null>(null);
  const [calcToId, setCalcToId] = useState<string | null>(null);

  const stats = useMemo<TreeStats>(() => {
    const visible = nodes.filter(n => !n.hidden);
    const withDeath = visible.filter(n => n.deathDate && n.birthDate);

    const lifespans = withDeath
      .map(n => {
        const by = parseInt(n.birthDate!.split('-')[0]);
        const dy = parseInt(n.deathDate!.split('-')[0]);
        return isNaN(by) || isNaN(dy) ? null : dy - by;
      })
      .filter((l): l is number => l !== null);

    let maxGen = 1;
    for (const n of visible) {
      if ((n.generation ?? 1) > maxGen) maxGen = n.generation ?? 1;
    }

    return {
      totalNodes: visible.length,
      maleCount: visible.filter(n => n.gender === 'male').length,
      femaleCount: visible.filter(n => n.gender === 'female').length,
      otherCount: visible.filter(n => n.gender === 'other').length,
      inLawCount: visible.filter(n => n.branchType === 'in-law').length,
      generationDepth: maxGen,
      avgLifespan: lifespans.length ? Math.round(lifespans.reduce((a, b) => a + b, 0) / lifespans.length) : null,
      oldestPerson: null,
      youngestPerson: null,
    };
  }, [nodes]);

  const kinship = useMemo(() => {
    if (!calcFromId || !calcToId) return null;
    return calculateGujaratiKinship(calcFromId, calcToId, nodes);
  }, [calcFromId, calcToId, nodes]);

  if (!showStatsPanel) return null;

  return (
    <div className="absolute left-16 bottom-20 z-30 w-80 bg-white/95 dark:bg-[#111928]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            વંશાવળી આંકડા (Tree Stats)
          </h3>
        </div>
        <button
          onClick={toggleStatsPanel}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5">
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{stats.totalNodes}</div>
            <div className="text-[10px] text-slate-500">કુલ વ્યક્તિઓ (Total)</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5">
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.generationDepth}</div>
            <div className="text-[10px] text-slate-500">પેઢીઓની ઊંડાઈ (Generations)</div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-2.5">
            <div className="text-base font-bold text-blue-700 dark:text-blue-300">♂ {stats.maleCount}</div>
            <div className="text-[10px] text-slate-500">પુરુષ સભ્યો (Male)</div>
          </div>

          <div className="bg-pink-50/50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40 rounded-xl p-2.5">
            <div className="text-base font-bold text-pink-700 dark:text-pink-300">♀ {stats.femaleCount}</div>
            <div className="text-[10px] text-slate-500">સ્ત્રી સભ્યો (Female)</div>
          </div>
        </div>

        {/* In-Law Count */}
        <div className="flex items-center justify-between p-2.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40">
          <span className="text-[11px] font-semibold text-purple-900 dark:text-purple-300">
            ⚯ સાસરી પક્ષના સભ્યો (In-Laws):
          </span>
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
            {stats.inLawCount}
          </span>
        </div>

        {/* Relationship Calculator */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            સંબંધ કેલ્ક્યુલેટર (Kinship Finder)
          </span>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 w-9">કોણ:</span>
              <select
                value={calcFromId ?? ''}
                onChange={e => setCalcFromId(e.target.value || null)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="">વ્યક્તિ પસંદ કરો…</option>
                {nodes.filter(n => !n.hidden).map(n => (
                  <option key={n._id} value={n._id}>
                    {showNameInGujarati ? n.nameGujarati : n.nameEnglish}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 w-9">સાથે:</span>
              <select
                value={calcToId ?? ''}
                onChange={e => setCalcToId(e.target.value || null)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="">બીજી વ્યક્તિ પસંદ કરો…</option>
                {nodes.filter(n => !n.hidden).map(n => (
                  <option key={n._id} value={n._id}>
                    {showNameInGujarati ? n.nameGujarati : n.nameEnglish}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {kinship && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 space-y-1">
              <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                {kinship.termGujarati}
              </div>
              <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                {kinship.termPhonetic} ({kinship.termEnglish})
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {kinship.descriptionGujarati}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
