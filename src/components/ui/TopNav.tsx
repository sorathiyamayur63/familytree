'use client';
// ============================================================
// TopNav.tsx — Figma / Drafts Workspace Header
// Clean professional workspace header with Import, Export (PNG, SVG, JSON),
// Auto Layout, Undo/Redo, Language toggle, and Tree switcher
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { useTreeStore } from '@/store/treeStore';
import { exportTreeAsPNG, exportTreeAsSVG } from '@/lib/exportUtils';
import TreeManagerModal from './TreeManagerModal';
import type { FamilyEdge } from '@/types';

interface TopNavProps {
  treeName: string;
  onAddNode: () => void;
  onAutoLayout: () => void;
  onExport: () => void;
  onImport: () => void;
}

export default function TopNav({
  treeName,
  onAddNode,
  onAutoLayout,
  onExport,
  onImport,
}: TopNavProps) {
  const {
    nodes,
    canvasConfig,
    isEditMode,
    toggleEditMode,
    showNameInGujarati,
    toggleGujaratiMode,
    isDarkMode,
    toggleDarkMode,
    undo,
    redo,
    undoStack,
    redoStack,
    leftSidebarTab,
    setLeftSidebarTab,
    showInspector,
    setShowInspector,
    trees,
    activeTreeId,
    saveStatus,
    fetchAllTrees,
    createNewTree,
    switchActiveTree,
  } = useTreeStore();

  const [showTreeMenu, setShowTreeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [isCreatingTree, setIsCreatingTree] = useState(false);
  const [isTreeManagerOpen, setIsTreeManagerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Retrieve all trees on mount
  useEffect(() => {
    fetchAllTrees();
  }, [fetchAllTrees]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTreeMenu(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleCreateNewTree = async () => {
    if (!newTreeName.trim()) return;
    setIsCreatingTree(true);
    try {
      const created = await createNewTree(newTreeName.trim(), 'Family Tree Workspace');
      if (created && typeof window !== 'undefined') {
        window.history.pushState(null, '', `/tree/${created._id}`);
      }
    } finally {
      setIsCreatingTree(false);
      setNewTreeName('');
      setShowTreeMenu(false);
    }
  };

  // Build edges on demand for PNG/SVG export
  const buildCurrentEdges = (): FamilyEdge[] => {
    const result: FamilyEdge[] = [];
    const seen = new Set<string>();
    for (const node of nodes) {
      for (const childId of node.childIds) {
        const key = `${node._id}->${childId}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ id: key, sourceId: node._id, targetId: childId, type: 'parent-child' });
        }
      }
      for (const spouseId of node.spouseIds) {
        const key = [node._id, spouseId].sort().join('~');
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ id: key, sourceId: node._id, targetId: spouseId, type: 'spouse' });
        }
      }
    }
    return result;
  };

  const handleExportPNG = async () => {
    setShowExportMenu(false);
    const edges = buildCurrentEdges();
    await exportTreeAsPNG({
      nodes,
      edges,
      treeName: treeName || 'family-tree',
      config: canvasConfig,
      isDark: isDarkMode,
      showGujarati: showNameInGujarati,
    });
  };

  const handleExportSVG = () => {
    setShowExportMenu(false);
    const edges = buildCurrentEdges();
    exportTreeAsSVG({
      nodes,
      edges,
      treeName: treeName || 'family-tree',
      config: canvasConfig,
      isDark: isDarkMode,
      showGujarati: showNameInGujarati,
    });
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 h-12 px-3.5 flex items-center justify-between bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] select-none">
      {/* ─── Left: Brand, Breadcrumb & Project Selector ─── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Figma Style Monogram */}
        <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-xs font-semibold text-xs tracking-tighter">
          FT
        </div>

        {/* Breadcrumb with Tree Switcher Dropdown */}
        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium hidden md:inline">Drafts</span>
            <span className="text-slate-300 dark:text-slate-600 hidden md:inline">/</span>
            <button
              onClick={() => {
                setShowTreeMenu(!showTreeMenu);
                if (!showTreeMenu) fetchAllTrees();
              }}
              className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="truncate max-w-[150px] sm:max-w-[220px]">{treeName || 'Patel Vanshavali'}</span>
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>


       {/* Auto-Save Status Badge */}
      <div className="hidden md:flex items-center absolute left-full ml-2 sm:ml-6 md:ml-[11.25rem] top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none">
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                
              </span>
            )}
          </div>
       

          {/* Tree Switcher Dropdown Menu */}
          {showTreeMenu && (
            <div className="absolute top-9 left-0 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 text-xs">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
                <span>Family Trees</span>
                <button
                  onClick={() => {
                    setShowTreeMenu(false);
                    setIsTreeManagerOpen(true);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline capitalize font-normal text-[11px]"
                >
                  Manage All ↗
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto my-1">
                {trees.map(t => (
                  <button
                    key={t._id}
                    onClick={async () => {
                      setShowTreeMenu(false);
                      await switchActiveTree(t._id);
                      if (typeof window !== 'undefined') {
                        window.history.pushState(null, '', `/tree/${t._id}`);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      t._id === activeTreeId
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate mr-2">{t.name}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{t.nodeCount || 0} members</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 mb-1">Create New Tree</div>
                <div className="flex gap-1.5 px-1">
                  <input
                    type="text"
                    value={newTreeName}
                    onChange={e => setNewTreeName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateNewTree()}
                    placeholder="e.g. Shah Family Tree"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 outline-none text-xs"
                  />
                  <button
                    onClick={handleCreateNewTree}
                    disabled={isCreatingTree || !newTreeName.trim()}
                    className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        

        {/* + Create Member Button */}
        <button
          onClick={onAddNode}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
          title="Add Person Node"
        >
          <span className="text-base leading-none font-bold">+</span>
          <span>Create</span>
        </button>

        {/* Toggle Layers Panel Button */}
        <button
          onClick={() => setLeftSidebarTab(leftSidebarTab === 'layers' ? null : 'layers')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            leftSidebarTab === 'layers'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Layers"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="hidden lg:inline">Layers</span>
        </button>
      </div>

      {/* ─── Center: Mode Pill & Language Switcher ─── */}
      <div className="flex items-center gap-2">
        {/* View vs Edit Segmented Control */}
        <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center text-xs">
          <button
            onClick={() => isEditMode && toggleEditMode()}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
              !isEditMode
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="hidden sm:inline">View</span>
          </button>

          <button
            onClick={() => !isEditMode && toggleEditMode()}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
              isEditMode
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        {/* Global Primary Display Language Switcher */}
        <button
          onClick={toggleGujaratiMode}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Toggle Default Language: Gujarati / English"
        >
          <span className={showNameInGujarati ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'}>
            ગુજરાતી
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className={!showNameInGujarati ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'}>
            English
          </span>
        </button>
      </div>

      {/* ─── Right: Undo, Auto Layout, Import, Export Dropdown, Theme ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo */}
        <div className="hidden md:flex items-center">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 14 5-5-5-5" />
              <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
            </svg>
          </button>
        </div>

        {/* Auto Layout */}
        <button
          onClick={onAutoLayout}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
          title="Auto Arrange Hierarchy (Reingold-Tilford)"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* Import JSON Button */}
        <button
          onClick={onImport}
          className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors"
          title="Import JSON Family Tree Backup"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="hidden sm:inline">Import</span>
        </button>

        {/* Export Dropdown (PNG, SVG, JSON) */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all"
            title="Download / Export Tree"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export</span>
            <svg className="w-3 h-3 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-9 w-52 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1 z-50 text-xs space-y-0.5">
              <button
                onClick={handleExportPNG}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col"
              >
                <span className="font-semibold">Export as PNG (High-Res)</span>
                <span className="text-[10px] text-slate-400">Download entire canvas at 2x print quality</span>
              </button>
              <button
                onClick={handleExportSVG}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col"
              >
                <span className="font-semibold">Export as SVG (Vector)</span>
                <span className="text-[10px] text-slate-400">Crisp vector graphics scalable to any size</span>
              </button>
              <button
                onClick={() => { setShowExportMenu(false); onExport(); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col"
              >
                <span className="font-semibold">Export JSON Backup</span>
                <span className="text-[10px] text-slate-400">Raw JSON data for migration & backup</span>
              </button>
            </div>
          )}
        </div>

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? (
            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Inspector Panel Toggle Button */}
        <button
          onClick={() => setShowInspector(!showInspector)}
          className={`p-1.5 rounded-lg transition-colors border ${
            showInspector
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
          title="Toggle Properties & Kinship Inspector"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>
      </div>

      {/* Family Tree Switcher & Manager Modal */}
      <TreeManagerModal
        isOpen={isTreeManagerOpen}
        onClose={() => setIsTreeManagerOpen(false)}
      />
    </header>
  );
}
