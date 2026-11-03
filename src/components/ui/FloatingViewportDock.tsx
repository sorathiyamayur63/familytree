'use client';
// ============================================================
// FloatingViewportDock.tsx — Figma / Drafts Bottom Canvas HUD
// Matches reference image floating pill dock with Pan/Select tools
// ============================================================
import React, { useState } from 'react';
import { useTreeStore } from '@/store/treeStore';
import type { GridType } from '@/types';

export default function FloatingViewportDock() {
  const {
    viewport,
    setViewport,
    canvasConfig,
    setGridType,
    toggleSnapToGrid,
    toggleGhostSuggestions,
    showMinimap,
    toggleMinimap,
    isEditMode,
    toggleEditMode,
    toggleTimeline,
    showTimeline,
  } = useTreeStore();

  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const zoomPct = Math.round(viewport.scale * 100);

  const setZoom = (scale: number) => {
    setViewport({ scale });
    setShowZoomMenu(false);
  };

  const zoomIn = () => setViewport({ scale: Math.min(2.8, viewport.scale * 1.15) });
  const zoomOut = () => setViewport({ scale: Math.max(0.1, viewport.scale * 0.85) });
  const resetView = () => setViewport({ x: 0, y: 0, scale: 0.9 });

  const gridCycle: GridType[] = ['dots', 'lines', 'cross', 'none'];
  const nextGrid = () => {
    const currIdx = gridCycle.indexOf(canvasConfig.gridType);
    const next = gridCycle[(currIdx + 1) % gridCycle.length];
    setGridType(next);
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-25 flex items-center gap-1 p-1 bg-white/95 dark:bg-[#111928]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-slate-900/10 select-none text-xs">
      {/* Zoom % Selector with Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowZoomMenu(!showZoomMenu)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-slate-400 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span className="font-mono min-w-[34px]">{zoomPct}%</span>
          <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showZoomMenu && (
          <div className="absolute bottom-11 left-0 w-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1 space-y-0.5 z-50">
            {[50, 75, 90, 100, 125, 150, 200].map(pct => (
              <button
                key={pct}
                onClick={() => setZoom(pct / 100)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                  zoomPct === pct
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Hand Pan Tool (Reference UI) */}
      <button
        onClick={() => isEditMode && toggleEditMode()}
        className={`p-1.5 rounded-xl transition-all ${
          !isEditMode
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Hand / Pan Tool (H)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      </button>

      {/* Select / Move Tool (Reference UI) */}
      <button
        onClick={() => !isEditMode && toggleEditMode()}
        className={`p-1.5 rounded-xl transition-all ${
          isEditMode
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Pointer / Edit Tool (V)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 3 7 18 3-7 7-3L3 3z" />
          <path d="m13 13 6 6" />
        </svg>
      </button>

      {/* Fit to View / Center Canvas */}
      <button
        onClick={resetView}
        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Fit to Screen (Shift + 1)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Grid Pattern Toggle */}
      <button
        onClick={nextGrid}
        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={`Grid style: ${canvasConfig.gridType}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="1.5" />
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="18" cy="6" r="1.5" />
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
          <circle cx="6" cy="18" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
          <circle cx="18" cy="18" r="1.5" />
        </svg>
      </button>

      {/* Ghost Suggestions Toggle (in edit mode) */}
      {isEditMode && (
        <button
          onClick={toggleGhostSuggestions}
          className={`px-2 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            canvasConfig.showGhostSuggestions
              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Ghost Relatives (Add Father, Mother, Spouse, Child)"
        >
          ✦ Suggestions
        </button>
      )}

      {/* Minimap Toggle */}
      <button
        onClick={toggleMinimap}
        className={`p-1.5 rounded-xl text-xs transition-colors ${
          showMinimap
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Minimap Radar"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      </button>
    </div>
  );
}
