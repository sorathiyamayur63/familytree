'use client';
// ============================================================
// TreePageClient — Professional Canvas Workspace
// ============================================================
import React, { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTreeStore } from '@/store/treeStore';
import { computeAutoLayout, detectCycles } from '@/lib/layout';
import type { FamilyNode, ExportData } from '@/types';

// Dynamic imports
const FamilyCanvas = dynamic(() => import('@/components/canvas/FamilyCanvas'), { ssr: false });
const TopNav = dynamic(() => import('@/components/ui/TopNav'), { ssr: false });
const LeftToolRail = dynamic(() => import('@/components/ui/LeftToolRail'), { ssr: false });
const LayersPanel = dynamic(() => import('@/components/ui/LayersPanel'), { ssr: false });
const FloatingViewportDock = dynamic(() => import('@/components/ui/FloatingViewportDock'), { ssr: false });
const InspectorPanel = dynamic(() => import('@/components/ui/InspectorPanel'), { ssr: false });
const SearchPanel = dynamic(() => import('@/components/ui/SearchPanel'), { ssr: false });
const Timeline = dynamic(() => import('@/components/ui/Timeline'), { ssr: false });
const PhotoCropper = dynamic(() => import('@/components/ui/PhotoCropper'), { ssr: false });

interface Props {
  treeId: string;
}

export default function TreePageClient({ treeId }: Props) {
  const {
    trees,
    setTrees,
    activeTreeId,
    setActiveTreeId,
    nodes,
    setNodes,
    upsertNode,
    setCycleNodes,
    setIsLoading,
    isLoading,
    isDarkMode,
    showPhotoEditor,
    togglePhotoEditor,
    selectedNodeId,
    fetchAllTrees,
    switchActiveTree,
  } = useTreeStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const effectiveTreeId = activeTreeId || treeId;
  const activeTree = trees.find(t => t._id === effectiveTreeId);

  // ─── Load All Trees & Active Tree Nodes ────────────────────
  useEffect(() => {
    let targetTreeId = treeId;
    if (typeof window !== 'undefined') {
      const storedActiveId = localStorage.getItem('ft_active_tree_id');
      if (storedActiveId && window.location.pathname === '/') {
        targetTreeId = storedActiveId;
      }
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch and merge all trees
        await fetchAllTrees();

        // 2. Switch and load active tree nodes
        await switchActiveTree(targetTreeId);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [treeId, fetchAllTrees, switchActiveTree, setIsLoading]);

  // ─── Add New Member ───────────────────────────────────────
  const handleAddNode = useCallback(async () => {
    const { viewport, activeTreeId, nodes } = useTreeStore.getState();
    const currentTreeId = activeTreeId || treeId;
    const worldX = -viewport.x / viewport.scale;
    const worldY = -viewport.y / viewport.scale;

    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treeId: currentTreeId,
          nameGujarati: 'નવ સભ્ય',
          nameEnglish: 'New Member',
          gender: 'other',
          branchType: 'main',
          parentIds: [],
          childIds: [],
          spouseIds: [],
          inLawNodeIds: [],
          position: { x: worldX, y: worldY },
        }),
      });
      const data = await res.json();
      if (data.success) {
        upsertNode({ ...data.data, _id: data.data._id.toString() });
      }
    } catch (err) {
      console.error('Failed to add node:', err);
    }
  }, [treeId, upsertNode]);

  // ─── Auto Arrange Layout ──────────────────────────────────
  const handleAutoLayout = useCallback(async () => {
    const currentNodes = useTreeStore.getState().nodes;
    const positions = computeAutoLayout(currentNodes);
    const updates = currentNodes.map(node => {
      const pos = positions.get(node._id);
      return pos ? { ...node, position: pos } : node;
    });

    useTreeStore.getState().setNodes(updates);

    await Promise.allSettled(
      updates.map(n =>
        fetch(`/api/nodes/${n._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: n.position }),
        })
      )
    );
  }, []);

  // ─── Export JSON ──────────────────────────────────────────
  const handleExport = useCallback(() => {
    const store = useTreeStore.getState();
    const tree = store.trees.find(t => t._id === treeId);
    if (!tree) return;

    const exportData: ExportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tree,
      nodes: store.nodes,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tree.name.replace(/\s+/g, '-')}-vanshavali.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [treeId]);

  // ─── Import JSON ──────────────────────────────────────────
  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data: ExportData = JSON.parse(text);
        if (!data.nodes || !Array.isArray(data.nodes)) {
          alert('Invalid file format. Please upload a valid JSON family tree backup.');
          return;
        }

        const res = await fetch('/api/nodes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ treeId, nodes: data.nodes }),
        });
        const result = await res.json();
        if (result.success) {
          useTreeStore.getState().setNodes(
            result.data.map((n: FamilyNode & { _id: { toString: () => string } }) => ({
              ...n,
              _id: n._id.toString(),
            }))
          );
          alert(`Successfully imported ${result.data.length} members!`);
        }
      } catch {
        alert('Error reading JSON file');
      }
    };
    input.click();
  }, [treeId]);

  // ─── Photo Crop Complete ──────────────────────────────────
  const handlePhotoComplete = (base64: string) => {
    if (!selectedNodeId) return;
    const node = nodes.find(n => n._id === selectedNodeId);
    if (!node) return;

    const updated = { ...node, photo: base64 };
    upsertNode(updated);
    togglePhotoEditor();

    fetch(`/api/nodes/${selectedNodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: base64 }),
    }).catch(console.error);
  };

  // Keyboard shortcut Ctrl+F for search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none ${
        isDarkMode ? 'dark bg-[#0A0E17]' : 'bg-[#F8F9FB]'
      }`}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-[#0B0F17]/70 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
              Loading Canvas Workspace…
            </span>
          </div>
        </div>
      )}

      {/* Main High-Performance Canvas */}
      <div className="absolute inset-0">
        <FamilyCanvas />
      </div>

      {/* Top Application Navigation */}
      <TopNav
        treeName={activeTree?.name ?? (effectiveTreeId === 'patel-vanshavali-default' ? 'પટેલ પરિવાર વંશાવળી (Patel Vanshavali)' : 'Family Tree')}
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Left Tool Rail */}
      <LeftToolRail
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onSearchOpen={() => setIsSearchOpen(true)}
      />

      {/* Layers & Hierarchy Tree Outline Panel */}
      <LayersPanel />

      {/* Right Inspector Panel */}
      <InspectorPanel />

      {/* Bottom Floating Viewport Dock */}
      <FloatingViewportDock />

      {/* Intelligent Search Command Palette */}
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Generational Birth Year Timeline */}
      <Timeline />

      {/* Photo Cropper Dialog */}
      {showPhotoEditor && (
        <PhotoCropper
          onComplete={handlePhotoComplete}
          onClose={togglePhotoEditor}
        />
      )}
    </div>
  );
}
