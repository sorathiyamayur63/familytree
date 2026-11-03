'use client';
// ============================================================
// Toolbar — Top bar with mode toggle, tools, keyboard hints
// ============================================================
import React from 'react';
import { useTreeStore } from '@/store/treeStore';

interface ToolbarProps {
  treeName: string;
  onAddNode: () => void;
  onAutoLayout: () => void;
  onExport: () => void;
  onImport: () => void;
  onResetView: () => void;
}

export default function Toolbar({
  treeName, onAddNode, onAutoLayout, onExport, onImport, onResetView,
}: ToolbarProps) {
  const {
    isEditMode, toggleEditMode,
    showNameInGujarati, toggleGujaratiMode,
    toggleSearch, toggleStylePanel, toggleStatsPanel,
    toggleTimeline, showMinimap, toggleMinimap,
    isDarkMode, toggleDarkMode,
    undo, redo,
    undoStack, redoStack,
    toggleNodeEditor, selectedNodeId,
    viewport,
  } = useTreeStore();

  const zoomPct = Math.round(viewport.scale * 100);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-3 py-2 bg-[var(--card)] border-b border-[var(--border)] shadow-sm select-none">
      {/* Tree name */}
      <span className="font-semibold text-[var(--foreground)] text-sm truncate max-w-[160px]">
        🌳 {treeName}
      </span>

      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      {/* Edit mode toggle */}
      <button
        onClick={toggleEditMode}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isEditMode
            ? 'bg-indigo-500 text-white shadow-md'
            : 'bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent)]'
        }`}
        title="Toggle Edit/View mode (E)"
      >
        {isEditMode ? '✏️ Edit Mode' : '🔒 View Mode'}
      </button>

      {/* Language toggle */}
      <button
        onClick={toggleGujaratiMode}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Toggle Gujarati/English names"
      >
        {showNameInGujarati ? 'ગુ→EN' : 'EN→ગુ'}
      </button>

      <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

      {/* Search */}
      <button
        onClick={toggleSearch}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Search (Ctrl+F)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Add node (edit mode only) */}
      {isEditMode && (
        <button
          onClick={onAddNode}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
          title="Add Person"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Selected node editor */}
      {isEditMode && selectedNodeId && (
        <button
          onClick={toggleNodeEditor}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
          title="Edit selected person"
        >
          👤 Edit Person
        </button>
      )}

      {/* Auto layout */}
      {isEditMode && (
        <button
          onClick={onAutoLayout}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
          title="Auto Layout"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>
      )}

      <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

      {/* Undo / Redo */}
      <button
        onClick={undo} disabled={undoStack.length === 0}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      <button
        onClick={redo} disabled={redoStack.length === 0}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all disabled:opacity-30"
        title="Redo (Ctrl+Y)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </button>

      <div className="flex-1" />

      {/* Zoom display */}
      <span className="text-xs text-[var(--muted-foreground)] font-mono min-w-[48px] text-center">
        {zoomPct}%
      </span>
      <button
        onClick={onResetView}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Reset View (Home)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

      {/* Style panel */}
      <button
        onClick={toggleStylePanel}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Canvas Styles"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      {/* Stats */}
      <button
        onClick={toggleStatsPanel}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Statistics"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Timeline */}
      <button
        onClick={toggleTimeline}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Generational Timeline"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Minimap toggle */}
      <button
        onClick={toggleMinimap}
        className={`p-1.5 rounded-lg transition-all ${
          showMinimap
            ? 'text-indigo-500 bg-indigo-50'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
        }`}
        title="Toggle Minimap"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Export JSON"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>

      {/* Import */}
      <label
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all cursor-pointer"
        title="Import JSON"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <input type="file" accept=".json" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => onImport();
            reader.readAsText(file);
          }
        }} />
      </label>

      {/* Dark mode */}
      <button
        onClick={toggleDarkMode}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
        title="Toggle Dark Mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
