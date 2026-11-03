'use client';
// ============================================================
// LayersPanel.tsx — Figma / Drafts Left Outline & Generations
// Matches reference image floating hierarchy card design
// ============================================================
import React, { useState, useMemo } from 'react';
import { useTreeStore } from '@/store/treeStore';
import type { FamilyNode } from '@/types';

export default function LayersPanel() {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    setViewport,
    viewport,
    showNameInGujarati,
    leftSidebarTab,
    setLeftSidebarTab,
    upsertNode,
    toggleInLawsBranch,
  } = useTreeStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    gen1: true,
    gen2: true,
    gen3: true,
    gen4: true,
    inlaws: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const focusNode = (node: FamilyNode) => {
    setSelectedNodeId(node._id);
    setViewport({
      x: -node.position.x * viewport.scale,
      y: -node.position.y * viewport.scale,
    });
  };

  const toggleNodeVisibility = (node: FamilyNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...node, hidden: !node.hidden };
    upsertNode(updated);
    fetch(`/api/nodes/${node._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: updated.hidden }),
    }).catch(console.error);
  };

  // Group nodes into Main Generations & In-Laws
  const { mainGens, inLawNodes } = useMemo(() => {
    const mainMap = new Map<number, FamilyNode[]>();
    const inLaws: FamilyNode[] = [];

    for (const node of nodes) {
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchesGu = node.nameGujarati.toLowerCase().includes(q);
        const matchesEn = node.nameEnglish.toLowerCase().includes(q);
        if (!matchesGu && !matchesEn) continue;
      }

      if (node.branchType === 'in-law') {
        inLaws.push(node);
      } else {
        const g = node.generation ?? 1;
        if (!mainMap.has(g)) mainMap.set(g, []);
        mainMap.get(g)!.push(node);
      }
    }

    const sortedMain = Array.from(mainMap.entries()).sort((a, b) => a[0] - b[0]);
    return { mainGens: sortedMain, inLawNodes: inLaws };
  }, [nodes, searchFilter]);

  if (leftSidebarTab !== 'layers') return null;

  return (
    <aside className="absolute left-16 top-16 z-25 w-72 max-h-[calc(100vh-6rem)] flex flex-col bg-white/95 dark:bg-[#111928]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden select-none animate-in fade-in slide-in-from-left-2 duration-150">
      {/* ─── Header: Drafts Style (Layers | Page 1 ▾ | +) ─── */}
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Layers Folder Icon */}
          <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="font-bold text-slate-900 dark:text-slate-100">Layers</span>
          <div className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pl-1 text-[11px]">
            <span>Tree View 1</span>
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <button
          onClick={() => setLeftSidebarTab(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
          title="Close Layers"
        >
          ✕
        </button>
      </div>

      {/* Filter / Search input */}
      <div className="p-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="relative">
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Search layers..."
            className="w-full bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Hierarchy Tree List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
        {/* Main Generations */}
        {mainGens.map(([genNum, genNodes]) => {
          const sectionKey = `gen${genNum}`;
          const isOpen = expandedSections[sectionKey] ?? true;
          const genLabels: Record<number, string> = {
            1: 'Generation 1 • Elders (વડીલો)',
            2: 'Generation 2 • Parents (પિતા/કાકા)',
            3: 'Generation 3 • Children (સંતાન)',
            4: 'Generation 4 • Grandchildren (પૌત્ર)',
          };

          return (
            <div key={genNum} className="space-y-0.5">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold text-[11px] transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-slate-400">{isOpen ? '▾' : '▸'}</span>
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                  <span className="truncate">{genLabels[genNum] || `Generation ${genNum}`}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">{genNodes.length}</span>
              </button>

              {/* Members inside generation */}
              {isOpen && (
                <div className="pl-4 space-y-0.5">
                  {genNodes.map(node => {
                    const isSelected = selectedNodeId === node._id;
                    const displayName = showNameInGujarati
                      ? node.nameGujarati
                      : (node.nameEnglish || node.nameGujarati);

                    return (
                      <div
                        key={node._id}
                        onClick={() => focusNode(node)}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {/* Dot / Avatar Indicator */}
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              node.gender === 'female' ? 'bg-pink-400' : 'bg-blue-400'
                            }`}
                          />
                          <span className="truncate text-xs">{displayName}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          {/* Visibility Eye Icon */}
                          <button
                            onClick={e => toggleNodeVisibility(node, e)}
                            className="p-1 hover:opacity-100 rounded"
                            title={node.hidden ? 'Show on Canvas' : 'Hide from Canvas'}
                          >
                            {node.hidden ? (
                              <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* In-Law Subtrees Group */}
        {inLawNodes.length > 0 && (
          <div className="space-y-0.5 pt-1">
            <button
              onClick={() => toggleSection('inlaws')}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-semibold text-[11px] transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[10px]">{expandedSections.inlaws ? '▾' : '▸'}</span>
                <span className="text-xs">⚯</span>
                <span className="truncate">In-Laws Branch (સાસરી પક્ષ)</span>
              </div>
              <span className="text-[10px] text-purple-500 font-normal">{inLawNodes.length}</span>
            </button>

            {expandedSections.inlaws && (
              <div className="pl-4 space-y-0.5">
                {inLawNodes.map(node => {
                  const isSelected = selectedNodeId === node._id;
                  const displayName = showNameInGujarati
                    ? node.nameGujarati
                    : (node.nameEnglish || node.nameGujarati);

                  return (
                    <div
                      key={node._id}
                      onClick={() => focusNode(node)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                        <span className="truncate text-xs">{displayName}</span>
                        {node.kinshipTitle && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {node.kinshipTitle}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={e => toggleNodeVisibility(node, e)}
                        className="p-1 hover:opacity-100 rounded opacity-80"
                        title={node.hidden ? 'Show on Canvas' : 'Hide from Canvas'}
                      >
                        {node.hidden ? (
                          <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
