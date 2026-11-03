'use client';
// ============================================================
// LeftToolRail.tsx — Figma / Miro Style Vertical Tool Rail
// ============================================================
import React from 'react';
import { useTreeStore } from '@/store/treeStore';

interface LeftToolRailProps {
  onAddNode: () => void;
  onAutoLayout: () => void;
  onSearchOpen: () => void;
}

export default function LeftToolRail({
  onAddNode,
  onAutoLayout,
  onSearchOpen,
}: LeftToolRailProps) {
  const {
    isEditMode,
    toggleEditMode,
    leftSidebarTab,
    setLeftSidebarTab,
    toggleTimeline,
    showTimeline,
    showMinimap,
    toggleMinimap,
  } = useTreeStore();

  return (
    <aside className="absolute left-4 top-20 z-20 hidden sm:flex flex-col items-center gap-1.5 p-1.5 bg-white/95 dark:bg-[#111928]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-lg shadow-slate-900/5 select-none">
      {/* Select / Move Tool (View vs Edit toggle) */}
      <button
        onClick={toggleEditMode}
        className={`p-2 rounded-xl transition-all ${
          isEditMode
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={isEditMode ? 'Active: Edit & Drag Mode' : 'Active: Pan & View Mode'}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m3 3 7 18 3-7 7-3L3 3z" />
          <path d="m13 13 6 6" />
        </svg>
      </button>

      {/* Layers / Tree Outline Panel Toggle */}
      <button
        onClick={() => setLeftSidebarTab(leftSidebarTab === 'layers' ? null : 'layers')}
        className={`p-2 rounded-xl transition-all ${
          leftSidebarTab === 'layers'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Toggle Generations & Layers Outline"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </button>

      {/* Intelligent Search Tool */}
      <button
        onClick={onSearchOpen}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Phonetic Gujarati & English Search (Ctrl+F)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <div className="w-4 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

      {/* Add Person (Quick Trigger) */}
      {isEditMode && (
        <button
          onClick={onAddNode}
          className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/80 transition-colors"
          title="Add Person Node"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Reingold-Tilford Auto Layout */}
      <button
        onClick={onAutoLayout}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Auto Arrange Layout"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>

      {/* Timeline Toggle */}
      <button
        onClick={toggleTimeline}
        className={`p-2 rounded-xl transition-all ${
          showTimeline
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Generational Birth Year Timeline"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </aside>
  );
}
