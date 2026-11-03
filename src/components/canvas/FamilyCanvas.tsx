'use client';
// ============================================================
// FamilyCanvas.tsx — High-Performance Canvas Component
// High-DPI support, Screen-space Minimap, Photo Lightbox,
// Copy/Paste shortcuts, and Interactive Drag-to-Connect
// ============================================================
import { useCallback, useMemo, useEffect, useState } from 'react';
import { useTreeStore } from '@/store/treeStore';
import { useCanvasEngine } from './useCanvasEngine';
import {
  drawGrid,
  drawEdges,
  drawNode,
  drawGhostNode,
  drawMinimap,
  getGhostNodesForSelection,
} from './NodeRenderer';
import { cullEdges } from '@/lib/culling';
import type { FamilyEdge, Viewport, GhostNode } from '@/types';

export default function FamilyCanvas() {
  const {
    nodes,
    viewport,
    canvasConfig,
    selectedNodeId,
    selectedNodeIds,
    setSelectedNodeId,
    setSelectedNodeIds,
    clearSelection,
    hoveredNodeId,
    referenceNodeId,
    cycleNodes,
    showNameInGujarati,
    flippedLanguageNodeIds,
    toggleNodeLanguage,
    lightboxPhotoUrl,
    setLightboxPhotoUrl,
    copySelectedNodes,
    cutSelectedNodes,
    pasteClipboardNodes,
    deleteSelectedNodes,
    updateMultipleNodePositions,
    saveMultipleNodePositions,
    connectNodes,
    showMinimap,
    isDarkMode,
    isEditMode,
    setViewport,
    updateNodePosition,
    setHoveredNodeId,
    collapseSubtree,
    expandSubtree,
    toggleInLawsBranch,
    promoteGhostNode,
    pushUndo,
  } = useTreeStore();

  const [hoveredPart, setHoveredPart] = useState<'card' | 'inlaw' | 'collapse' | 'photo' | 'name' | 'port' | null>(null);

  // ─── Build edges (Parent-child, Spouse, In-Law connections) ─
  const edges = useMemo<FamilyEdge[]>(() => {
    const result: FamilyEdge[] = [];
    const seen = new Set<string>();

    for (const node of nodes) {
      // Parent-Child edges
      for (const childId of node.childIds) {
        const key = `${node._id}->${childId}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ id: key, sourceId: node._id, targetId: childId, type: 'parent-child' });
        }
      }

      // Spouse edges
      for (const spouseId of node.spouseIds) {
        const key = [node._id, spouseId].sort().join('~');
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ id: key, sourceId: node._id, targetId: spouseId, type: 'spouse' });
        }
      }

      // In-Law branch edges (only if not hidden)
      if (node.inLawNodeIds && (!node.inLawsHidden)) {
        for (const inLawId of node.inLawNodeIds) {
          const key = `inlaw:${node._id}->${inLawId}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push({ id: key, sourceId: node._id, targetId: inLawId, type: 'in-law' });
          }
        }
      }
    }

    return result;
  }, [nodes]);

  // ─── Compute Ghost Nodes for Selected Person ──────────────
  const ghostNodes = useMemo<GhostNode[]>(() => {
    if (!isEditMode || !selectedNodeId || !canvasConfig.showGhostSuggestions) {
      return [];
    }
    const selected = nodes.find(n => n._id === selectedNodeId);
    if (!selected || selected.hidden) return [];
    return getGhostNodesForSelection(selected, nodes);
  }, [isEditMode, selectedNodeId, canvasConfig.showGhostSuggestions, nodes]);

  // Drag position cache for undo
  const dragStartPos = useMemo(() => ({ x: 0, y: 0 }), []);

  const handleNodeDrag = useCallback((id: string, x: number, y: number) => {
    updateNodePosition(id, x, y);
  }, [updateNodePosition]);

  const handleNodeDragEnd = useCallback((id: string, x: number, y: number) => {
    const node = nodes.find(n => n._id === id);
    if (!node) return;
    pushUndo({
      type: 'MOVE_NODE',
      before: { _id: id, position: { x: dragStartPos.x, y: dragStartPos.y } },
      after: { _id: id, position: { x, y } },
      timestamp: Date.now(),
    });

    fetch(`/api/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: { x, y } }),
    }).catch(console.error);
  }, [nodes, pushUndo, dragStartPos]);

  const handleNodeClick = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, [setSelectedNodeId]);

  const handleNameClick = useCallback((id: string) => {
    toggleNodeLanguage(id);
  }, [toggleNodeLanguage]);

  const handlePhotoClick = useCallback((photoUrl?: string) => {
    if (photoUrl) {
      setLightboxPhotoUrl(photoUrl);
    }
  }, [setLightboxPhotoUrl]);

  const handleNodeHover = useCallback(
    (id: string | null, part?: 'card' | 'inlaw' | 'collapse' | 'photo' | 'name' | 'port' | null) => {
      setHoveredNodeId(id);
      setHoveredPart(part ?? null);
    },
    [setHoveredNodeId]
  );

  const handleInLawToggle = useCallback((id: string) => {
    toggleInLawsBranch(id);
  }, [toggleInLawsBranch]);

  const handleCollapseToggle = useCallback((id: string) => {
    const node = nodes.find(n => n._id === id);
    if (!node) return;
    if (node.collapsed) {
      expandSubtree(id);
    } else {
      collapseSubtree(id);
    }
  }, [nodes, expandSubtree, collapseSubtree]);

  const handleGhostClick = useCallback(async (ghost: GhostNode) => {
    await promoteGhostNode(ghost);
  }, [promoteGhostNode]);

  const handleConnectNodes = useCallback(async (sourceId: string, targetId: string) => {
    await connectNodes(sourceId, targetId);
  }, [connectNodes]);

  // ─── Main Canvas Draw Function (Pure World Canvas in RAF) ─
  const onCanvasDraw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport) => {
    const visibleNodes = nodes.filter(n => !n.hidden);
    const nodeMap = new Map(nodes.map(n => [n._id, n]));
    const cycleSet = new Set(cycleNodes);
    const zoomLevel = vp.scale < 0.4 ? 'macro' : vp.scale < 0.85 ? 'medium' : 'detail';

    // 1. Dot Grid
    drawGrid(ctx, vp, canvasConfig, isDarkMode);

    // 2. Connector Edges
    const visibleEdges = cullEdges(edges, visibleNodes);
    drawEdges(ctx, visibleEdges, nodeMap, canvasConfig, isDarkMode);

    // 3. Node Cards
    for (const node of visibleNodes) {
      const isSelected = selectedNodeIds.includes(node._id) || node._id === selectedNodeId;
      const isHovered = node._id === hoveredNodeId;
      const isReference = node._id === referenceNodeId;
      const isCycle = cycleSet.has(node._id);
      const isFlipped = flippedLanguageNodeIds.has(node._id);

      drawNode(ctx, node, {
        isSelected,
        isHovered,
        isReference,
        isCycle,
        zoomLevel,
        showGujarati: showNameInGujarati,
        isDark: isDarkMode,
        scale: vp.scale,
        hoveredBtnPart: isHovered ? hoveredPart : null,
        isFlipped,
        isEditMode,
      });
    }

    // 4. Ghost Suggestion Nodes (in Edit Mode)
    if (isEditMode && canvasConfig.showGhostSuggestions) {
      for (const ghost of ghostNodes) {
        drawGhostNode(ctx, ghost, false, vp.scale, isDarkMode);
      }
    }
  }, [
    nodes, edges, ghostNodes, canvasConfig, selectedNodeId, selectedNodeIds,
    hoveredNodeId, referenceNodeId, cycleNodes, showNameInGujarati,
    flippedLanguageNodeIds, isDarkMode, isEditMode, hoveredPart,
  ]);

  // ─── Screen Overlays: Minimap fixed in bottom-right corner ─
  const onScreenDraw = useCallback((ctx: CanvasRenderingContext2D, screenW: number, screenH: number) => {
    if (showMinimap) {
      drawMinimap(ctx, screenW, screenH, nodes, viewport, isDarkMode);
    }
  }, [showMinimap, nodes, viewport, isDarkMode]);

  const engine = useCanvasEngine({
    nodes,
    edges,
    ghostNodes,
    viewport,
    config: { ...canvasConfig, isEditMode },
    selectedNodeId,
    selectedNodeIds,
    hoveredNodeId,
    referenceNodeId,
    cycleNodes,
    showNameInGujarati,
    flippedLanguageNodeIds,
    onViewportChange: setViewport,
    onNodeDrag: handleNodeDrag,
    onNodeDragEnd: handleNodeDragEnd,
    onMultipleNodesDrag: updateMultipleNodePositions,
    onMultipleNodesDragEnd: saveMultipleNodePositions,
    onBoxSelect: setSelectedNodeIds,
    onNodeClick: (id, multi) => setSelectedNodeId(id, multi),
    onNameClick: handleNameClick,
    onPhotoClick: handlePhotoClick,
    onNodeHover: handleNodeHover,
    onInLawToggleClick: handleInLawToggle,
    onCollapseToggleClick: handleCollapseToggle,
    onGhostClick: handleGhostClick,
    onConnectNodes: handleConnectNodes,
    onCanvasDraw,
    onScreenDraw,
  });

  // ─── Keyboard Shortcuts: Undo, Redo, Zoom, Multi-Cut/Copy/Paste, Delete ─
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Home' || (e.key === '0' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setViewport({ x: 0, y: 0, scale: 0.9 });
      }
      if (e.key === '+' || e.key === '=') {
        setViewport({ scale: Math.min(2.8, viewport.scale * 1.15) });
      }
      if (e.key === '-') {
        setViewport({ scale: Math.max(0.1, viewport.scale * 0.85) });
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0 || selectedNodeId) {
          e.preventDefault();
          deleteSelectedNodes();
        }
      }
      // Cut: Ctrl+X / Cmd+X
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutSelectedNodes();
      }
      // Copy: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelectedNodes();
      }
      // Paste: Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteClipboardNodes();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    viewport.scale, setViewport, clearSelection, selectedNodeIds,
    selectedNodeId, deleteSelectedNodes, cutSelectedNodes, copySelectedNodes, pasteClipboardNodes,
  ]);

  const cursorStyle = isEditMode
    ? (hoveredNodeId ? (hoveredPart === 'port' ? 'crosshair' : hoveredPart === 'card' ? 'grab' : 'pointer') : 'default')
    : 'default';

  return (
    <>
      <canvas
        ref={engine.canvasRef}
        className="absolute inset-0 w-full h-full touch-none select-none"
        style={{ cursor: cursorStyle, display: 'block' }}
        onPointerDown={engine.onPointerDown}
        onPointerMove={engine.onPointerMove}
        onPointerUp={engine.onPointerUp}
        onTouchStart={engine.onTouchStart}
        onTouchMove={engine.onTouchMove}
      />

      {/* ─── Floating Multi-Selection Dock (when 2+ nodes selected) ─── */}
      {selectedNodeIds.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 flex items-center gap-2.5 bg-slate-900/90 text-white dark:bg-white/95 dark:text-slate-900 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-medium border border-white/10 dark:border-black/10 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="flex items-center gap-1.5 font-semibold text-blue-400 dark:text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {selectedNodeIds.length} members selected
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-[11px] text-slate-300 dark:text-slate-600">Drag to move all</span>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => cutSelectedNodes()}
            className="hover:text-blue-300 dark:hover:text-blue-500 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
            title="Cut selected members"
          >
            <span>Cut</span>
            <kbd className="text-[10px] font-mono px-1 rounded bg-white/10 dark:bg-black/10">Ctrl+X</kbd>
          </button>
          <button
            onClick={() => copySelectedNodes()}
            className="hover:text-blue-300 dark:hover:text-blue-500 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
            title="Copy selected members"
          >
            <span>Copy</span>
            <kbd className="text-[10px] font-mono px-1 rounded bg-white/10 dark:bg-black/10">Ctrl+C</kbd>
          </button>
          <button
            onClick={() => deleteSelectedNodes()}
            className="hover:text-red-300 dark:hover:text-red-500 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 text-red-400 dark:text-red-600"
            title="Delete selected members"
          >
            <span>Delete</span>
            <kbd className="text-[10px] font-mono px-1 rounded bg-white/10 dark:bg-black/10">Del</kbd>
          </button>
          <button
            onClick={() => clearSelection()}
            className="text-[10px] text-slate-400 hover:text-white dark:hover:text-black ml-1"
            title="Clear Selection"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── High-Res Full Picture Lightbox Modal ──────────── */}
      {lightboxPhotoUrl && (
        <div
          onClick={() => setLightboxPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-lg max-h-[85vh] p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center"
          >
            <button
              onClick={() => setLightboxPhotoUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg hover:bg-slate-700 transition-colors"
              title="Close Image"
            >
              ✕
            </button>
            <img
              src={lightboxPhotoUrl}
              alt="Full Person Profile"
              className="max-h-[75vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
