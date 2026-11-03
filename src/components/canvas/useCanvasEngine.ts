'use client';
// ============================================================
// useCanvasEngine — 60 FPS RAF loop, High-DPI Scaling,
// Passive=False Wheel Zoom, Hit-Testing, Drag-Connect & Screen Overlays
// ============================================================
import { useRef, useCallback, useEffect } from 'react';
import type { FamilyNode, FamilyEdge, Viewport, CanvasConfig, GhostNode } from '@/types';
import { screenToWorld, snapToGrid } from '@/lib/culling';
import { hitTestNodeParts, hitTestGhost, CARD_WIDTH, CARD_HEIGHT } from './NodeRenderer';

export interface CanvasEngineOptions {
  nodes: FamilyNode[];
  edges: FamilyEdge[];
  ghostNodes: GhostNode[];
  viewport: Viewport;
  config: CanvasConfig;
  selectedNodeId: string | null;
  selectedNodeIds?: string[];
  hoveredNodeId: string | null;
  referenceNodeId: string | null;
  cycleNodes: string[];
  showNameInGujarati: boolean;
  flippedLanguageNodeIds: Set<string>;
  onViewportChange: (vp: Partial<Viewport>) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onNodeDragEnd: (id: string, x: number, y: number) => void;
  onMultipleNodesDrag?: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onMultipleNodesDragEnd?: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onBoxSelect?: (selectedIds: string[]) => void;
  onNodeClick: (id: string | null, multi?: boolean) => void;
  onNameClick: (id: string) => void;
  onPhotoClick: (photoUrl?: string) => void;
  onNodeHover: (id: string | null, part?: 'card' | 'inlaw' | 'collapse' | 'photo' | 'name' | 'port' | null) => void;
  onInLawToggleClick: (id: string) => void;
  onCollapseToggleClick: (id: string) => void;
  onGhostClick: (ghost: GhostNode) => void;
  onConnectNodes: (sourceId: string, targetId: string) => void;
  onCanvasDraw: (ctx: CanvasRenderingContext2D, vp: Viewport) => void;
  onScreenDraw?: (ctx: CanvasRenderingContext2D, screenW: number, screenH: number) => void;
}

const MIN_SCALE = 0.08;
const MAX_SCALE = 2.8;
const ZOOM_SPEED = 0.0016;

export function useCanvasEngine(opts: CanvasEngineOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const isDirty = useRef(true);

  // Interaction refs
  const isPanning = useRef(false);
  const isDraggingNode = useRef(false);
  const isDraggingMulti = useRef(false);
  const initialMultiPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const anchorPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Marquee / Box Selection
  const isMarquee = useRef(false);
  const marqueeStart = useRef({ x: 0, y: 0 });
  const marqueeCurrent = useRef({ x: 0, y: 0 });

  const isConnecting = useRef(false);
  const connectSourceId = useRef<string | null>(null);
  const connectTargetWorld = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const dragNodeId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const hasMovedSignificant = useRef(false);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  // ─── RAF Rendering Loop with DevicePixelRatio Scaling ───────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isDirty.current) {
      isDirty.current = false;
      const { viewport, onCanvasDraw, onScreenDraw } = optsRef.current;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      const screenW = viewport.width;
      const screenH = viewport.height;

      // Clear full canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // High-DPI scale backing
      ctx.scale(dpr, dpr);

      // ─── 1. World Canvas Space (Pan & Zoom) ─────────────────
      ctx.save();
      ctx.translate(screenW / 2 + viewport.x, screenH / 2 + viewport.y);
      ctx.scale(viewport.scale, viewport.scale);

      onCanvasDraw(ctx, viewport);

      // Draw live drag-to-connect line if active
      if (isConnecting.current && connectSourceId.current) {
        const srcNode = optsRef.current.nodes.find(n => n._id === connectSourceId.current);
        if (srcNode) {
          const sx = srcNode.position.x;
          const sy = srcNode.position.y + CARD_HEIGHT / 2;
          const tx = connectTargetWorld.current.x;
          const ty = connectTargetWorld.current.y;

          ctx.save();
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 4]);

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          const cpY = (sy + ty) / 2;
          ctx.bezierCurveTo(sx, cpY, tx, cpY, tx, ty);
          ctx.stroke();

          // Target pointer circle
          ctx.fillStyle = '#2563EB';
          ctx.beginPath();
          ctx.arc(tx, ty, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

      // ─── 2. Screen Space Overlays (Minimap etc - Fixed in corner) ─
      if (onScreenDraw) {
        onScreenDraw(ctx, screenW, screenH);
      }

      // ─── 3. Marquee Selection Box Overlay ──────────────────
      if (isMarquee.current) {
        const mx = Math.min(marqueeStart.current.x, marqueeCurrent.current.x);
        const my = Math.min(marqueeStart.current.y, marqueeCurrent.current.y);
        const mw = Math.abs(marqueeCurrent.current.x - marqueeStart.current.x);
        const mh = Math.abs(marqueeCurrent.current.y - marqueeStart.current.y);

        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
        ctx.fillRect(mx, my, mw, mh);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(mx, my, mw, mh);
        ctx.restore();
      }

      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  useEffect(() => {
    isDirty.current = true;
  }, [
    opts.nodes, opts.edges, opts.ghostNodes, opts.viewport,
    opts.selectedNodeId, opts.hoveredNodeId, opts.referenceNodeId,
    opts.config, opts.showNameInGujarati, opts.flippedLanguageNodeIds, opts.cycleNodes,
  ]);

  // ─── Resize Observer with High-DPI Backing ────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cssW = entry.contentRect.width;
        const cssH = entry.contentRect.height;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

        optsRef.current.onViewportChange({
          width: cssW,
          height: cssH,
        });
        isDirty.current = true;
      }
    });
    ro.observe(canvas.parentElement ?? canvas);
    return () => ro.disconnect();
  }, []);

  // ─── Hit Test Query ───────────────────────────────────────
  const queryHit = useCallback((sx: number, sy: number) => {
    const { nodes, ghostNodes, viewport, config } = optsRef.current;
    const [wx, wy] = screenToWorld(sx, sy, viewport);

    // 1. Check Ghost nodes first if visible
    if (config.isEditMode && config.showGhostSuggestions) {
      for (const ghost of ghostNodes) {
        if (hitTestGhost(wx, wy, ghost)) {
          return { type: 'ghost' as const, ghost };
        }
      }
    }

    // 2. Check Real nodes (topmost rendered first)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.hidden) continue;
      const part = hitTestNodeParts(wx, wy, node);
      if (part) {
        return { type: 'node' as const, node, part };
      }
    }

    return null;
  }, []);

  // ─── Pointer Events ───────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    lastPointer.current = { x: sx, y: sy };
    pointerDownPos.current = { x: sx, y: sy };
    hasMovedSignificant.current = false;

    const hit = queryHit(sx, sy);
    const { isEditMode } = optsRef.current.config;
    const isMultiKey = e.shiftKey || e.ctrlKey || e.metaKey;

    if (hit && hit.type === 'node') {
      if (hit.part === 'inlaw') {
        optsRef.current.onInLawToggleClick(hit.node._id);
        isDirty.current = true;
        return;
      }
      if (hit.part === 'collapse') {
        optsRef.current.onCollapseToggleClick(hit.node._id);
        isDirty.current = true;
        return;
      }
      if (hit.part === 'photo') {
        optsRef.current.onPhotoClick(hit.node.photo);
        isDirty.current = true;
        return;
      }
      if (hit.part === 'port' && isEditMode) {
        // Start connection dragging
        isConnecting.current = true;
        connectSourceId.current = hit.node._id;
        const [wx, wy] = screenToWorld(sx, sy, optsRef.current.viewport);
        connectTargetWorld.current = { x: wx, y: wy };
        isDirty.current = true;
        return;
      }

      // If holding Shift / Ctrl: toggle multi-selection
      if (isMultiKey) {
        optsRef.current.onNodeClick(hit.node._id, true);
        isDirty.current = true;
        return;
      }

      // Check if clicked node is part of existing multi-selection
      const selectedIds = optsRef.current.selectedNodeIds || [];
      const isPartOfMulti = selectedIds.includes(hit.node._id) && selectedIds.length > 1;

      if (isEditMode) {
        dragNodeId.current = hit.node._id;
        const [wx, wy] = screenToWorld(sx, sy, optsRef.current.viewport);
        dragOffset.current = { x: wx - hit.node.position.x, y: wy - hit.node.position.y };

        if (isPartOfMulti) {
          isDraggingMulti.current = true;
          anchorPos.current = { x: hit.node.position.x, y: hit.node.position.y };
          initialMultiPositions.current = new Map(
            selectedIds
              .map(id => optsRef.current.nodes.find(n => n._id === id))
              .filter(Boolean)
              .map(n => [n!._id, { x: n!.position.x, y: n!.position.y }])
          );
        } else {
          isDraggingMulti.current = false;
          initialMultiPositions.current.clear();
          if (!selectedIds.includes(hit.node._id)) {
            optsRef.current.onNodeClick(hit.node._id, false);
          }
        }
      } else {
        if (!selectedIds.includes(hit.node._id)) {
          optsRef.current.onNodeClick(hit.node._id, false);
        }
      }
    } else if (hit && hit.type === 'ghost') {
      optsRef.current.onGhostClick(hit.ghost);
      isDirty.current = true;
      return;
    } else {
      // Empty canvas clicked: Marquee box selection or Pan
      if (e.shiftKey || isEditMode) {
        isMarquee.current = true;
        marqueeStart.current = { x: sx, y: sy };
        marqueeCurrent.current = { x: sx, y: sy };
      } else {
        isPanning.current = true;
      }
    }
  }, [queryHit]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const moveDist = Math.hypot(sx - pointerDownPos.current.x, sy - pointerDownPos.current.y);
    if (moveDist > 4) {
      hasMovedSignificant.current = true;
    }

    if (isConnecting.current) {
      const [wx, wy] = screenToWorld(sx, sy, optsRef.current.viewport);
      connectTargetWorld.current = { x: wx, y: wy };
      isDirty.current = true;
      return;
    }

    if (isMarquee.current) {
      marqueeCurrent.current = { x: sx, y: sy };
      isDirty.current = true;
      return;
    }

    // ─── Dragging Multiple Selected Nodes ──────────────────
    if (isDraggingMulti.current && dragNodeId.current && hasMovedSignificant.current) {
      const { viewport, config } = optsRef.current;
      const [wx, wy] = screenToWorld(sx, sy, viewport);
      let dx = (wx - dragOffset.current.x) - anchorPos.current.x;
      let dy = (wy - dragOffset.current.y) - anchorPos.current.y;
      if (config.snapToGrid) {
        dx = Math.round(dx / config.gridSize) * config.gridSize;
        dy = Math.round(dy / config.gridSize) * config.gridSize;
      }
      const updates = Array.from(initialMultiPositions.current.entries()).map(([id, pos]) => ({
        id,
        x: pos.x + dx,
        y: pos.y + dy,
      }));
      optsRef.current.onMultipleNodesDrag?.(updates);
      isDirty.current = true;
    } else if (dragNodeId.current && hasMovedSignificant.current) {
      // Single node drag
      isDraggingNode.current = true;
      const { viewport, config } = optsRef.current;
      const [wx, wy] = screenToWorld(sx, sy, viewport);
      let nx = wx - dragOffset.current.x;
      let ny = wy - dragOffset.current.y;
      if (config.snapToGrid) {
        [nx, ny] = snapToGrid(nx, ny, config.gridSize);
      }
      optsRef.current.onNodeDrag(dragNodeId.current, nx, ny);
      isDirty.current = true;
    } else if (isPanning.current) {
      const dx = sx - lastPointer.current.x;
      const dy = sy - lastPointer.current.y;
      const { viewport, onViewportChange } = optsRef.current;
      onViewportChange({ x: viewport.x + dx, y: viewport.y + dy });
      isDirty.current = true;
    } else {
      // Hover hit-test
      const hit = queryHit(sx, sy);
      if (hit && hit.type === 'node') {
        canvas.style.cursor =
          hit.part === 'inlaw' || hit.part === 'collapse' || hit.part === 'photo' || hit.part === 'name' || hit.part === 'port'
            ? 'pointer'
            : 'default';
        optsRef.current.onNodeHover(hit.node._id, hit.part);
      } else if (hit && hit.type === 'ghost') {
        canvas.style.cursor = 'pointer';
        optsRef.current.onNodeHover(null, null);
      } else {
        canvas.style.cursor = 'default';
        optsRef.current.onNodeHover(null, null);
      }
      isDirty.current = true;
    }

    lastPointer.current = { x: sx, y: sy };
  }, [queryHit]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isConnecting.current && connectSourceId.current) {
      const hit = queryHit(sx, sy);
      if (hit && hit.type === 'node' && hit.node._id !== connectSourceId.current) {
        optsRef.current.onConnectNodes(connectSourceId.current, hit.node._id);
      }
      isConnecting.current = false;
      connectSourceId.current = null;
      isDirty.current = true;
      return;
    }

    // ─── Marquee Box Select End ────────────────────────────
    if (isMarquee.current) {
      const sx1 = Math.min(marqueeStart.current.x, marqueeCurrent.current.x);
      const sx2 = Math.max(marqueeStart.current.x, marqueeCurrent.current.x);
      const sy1 = Math.min(marqueeStart.current.y, marqueeCurrent.current.y);
      const sy2 = Math.max(marqueeStart.current.y, marqueeCurrent.current.y);

      if (Math.hypot(sx2 - sx1, sy2 - sy1) > 6) {
        const { nodes, viewport } = optsRef.current;
        const [wMinX, wMinY] = screenToWorld(sx1, sy1, viewport);
        const [wMaxX, wMaxY] = screenToWorld(sx2, sy2, viewport);

        const minX = Math.min(wMinX, wMaxX);
        const maxX = Math.max(wMinX, wMaxX);
        const minY = Math.min(wMinY, wMaxY);
        const maxY = Math.max(wMinY, wMaxY);

        const enclosed = nodes.filter(n => {
          if (n.hidden) return false;
          const nx = n.position.x;
          const ny = n.position.y;
          return nx >= minX - CARD_WIDTH / 2 && nx <= maxX + CARD_WIDTH / 2 &&
                 ny >= minY - CARD_HEIGHT / 2 && ny <= maxY + CARD_HEIGHT / 2;
        });

        if (enclosed.length > 0) {
          optsRef.current.onBoxSelect?.(enclosed.map(n => n._id));
        } else {
          optsRef.current.onNodeClick(null, false);
        }
      } else {
        optsRef.current.onNodeClick(null, false);
      }
      isMarquee.current = false;
      isDirty.current = true;
      return;
    }

    // ─── Multi-Drag End ────────────────────────────────────
    if (isDraggingMulti.current && dragNodeId.current && hasMovedSignificant.current) {
      const { viewport, config } = optsRef.current;
      const [wx, wy] = screenToWorld(sx, sy, viewport);
      let dx = (wx - dragOffset.current.x) - anchorPos.current.x;
      let dy = (wy - dragOffset.current.y) - anchorPos.current.y;
      if (config.snapToGrid) {
        dx = Math.round(dx / config.gridSize) * config.gridSize;
        dy = Math.round(dy / config.gridSize) * config.gridSize;
      }
      const updates = Array.from(initialMultiPositions.current.entries()).map(([id, pos]) => ({
        id,
        x: pos.x + dx,
        y: pos.y + dy,
      }));
      optsRef.current.onMultipleNodesDragEnd?.(updates);
      isDraggingMulti.current = false;
      initialMultiPositions.current.clear();
    } else if (isDraggingNode.current && dragNodeId.current) {
      // Single drag end
      const { viewport, config } = optsRef.current;
      const [wx, wy] = screenToWorld(sx, sy, viewport);
      let nx = wx - dragOffset.current.x;
      let ny = wy - dragOffset.current.y;
      if (config.snapToGrid) {
        [nx, ny] = snapToGrid(nx, ny, config.gridSize);
      }
      optsRef.current.onNodeDragEnd(dragNodeId.current, nx, ny);
    } else if (!hasMovedSignificant.current) {
      // Clean click!
      const hit = queryHit(sx, sy);
      if (hit && hit.type === 'node') {
        if (hit.part === 'name') {
          // Click on name flips between Gujarati and English
          optsRef.current.onNameClick(hit.node._id);
          optsRef.current.onNodeClick(hit.node._id, false);
        } else if (hit.part === 'photo') {
          optsRef.current.onPhotoClick(hit.node.photo);
        } else if (hit.part === 'card') {
          optsRef.current.onNodeClick(hit.node._id, false);
        }
      } else if (!hit) {
        optsRef.current.onNodeClick(null, false);
      }
    }

    isDraggingNode.current = false;
    isDraggingMulti.current = false;
    dragNodeId.current = null;
    isPanning.current = false;
    hasMovedSignificant.current = false;
    isDirty.current = true;
  }, [queryHit]);

  // ─── Native Wheel Listener (passive: false to prevent page zoom) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      // PREVENT BROWSER DEFAULT PAGE ZOOM COMPLETELY
      e.preventDefault();
      e.stopPropagation();

      const { viewport, onViewportChange } = optsRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const canvasCenterX = viewport.width / 2;
      const canvasCenterY = viewport.height / 2;

      const delta = -e.deltaY * ZOOM_SPEED;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, viewport.scale * (1 + delta)));

      const scaleRatio = newScale / viewport.scale;
      const newX = mouseX - canvasCenterX - (mouseX - canvasCenterX - viewport.x) * scaleRatio;
      const newY = mouseY - canvasCenterY - (mouseY - canvasCenterY - viewport.y) * scaleRatio;

      onViewportChange({ x: newX, y: newY, scale: newScale });
      isDirty.current = true;
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // ─── Touch Pinch-to-Zoom ──────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartScale.current = optsRef.current.viewport.scale;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && pinchStartDist.current > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist.current;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchStartScale.current * ratio)
      );
      optsRef.current.onViewportChange({ scale: newScale });
      isDirty.current = true;
    }
  }, []);

  return {
    canvasRef,
    isDirty,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
  };
}
