// ============================================================
// Viewport Frustum Culling — Zero-lag node filtering
// ============================================================
// Only nodes/edges within the visible canvas area are rendered.
// This keeps canvas operations to O(visible) instead of O(total).

import type { FamilyNode, FamilyEdge, Viewport, AABB } from '@/types';

// Node bounding box size constants (world space)
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 100;
export const NODE_RADIUS = 55; // for circle shape
export const CULL_PADDING = 100; // extra px beyond viewport for smooth pan

/**
 * Convert viewport state to a world-space bounding box.
 * All world coordinates that map to visible screen area.
 */
export function viewportToWorldAABB(vp: Viewport): AABB {
  const halfW = vp.width / 2;
  const halfH = vp.height / 2;
  const pad = CULL_PADDING / vp.scale;

  return {
    minX: (-vp.x - halfW) / vp.scale - pad,
    minY: (-vp.y - halfH) / vp.scale - pad,
    maxX: (-vp.x + halfW) / vp.scale + pad,
    maxY: (-vp.y + halfH) / vp.scale + pad,
  };
}

/**
 * Check if a node (centered at x,y) intersects the AABB.
 */
export function isNodeVisible(
  node: FamilyNode,
  aabb: AABB,
  hw: number = NODE_WIDTH / 2,
  hh: number = NODE_HEIGHT / 2
): boolean {
  const { x, y } = node.position;
  return (
    x + hw > aabb.minX &&
    x - hw < aabb.maxX &&
    y + hh > aabb.minY &&
    y - hh < aabb.maxY
  );
}

/**
 * Filter nodes to only those visible in the current viewport.
 */
export function cullNodes(nodes: FamilyNode[], viewport: Viewport): FamilyNode[] {
  const aabb = viewportToWorldAABB(viewport);
  return nodes.filter(n => !n.hidden && isNodeVisible(n, aabb));
}

/**
 * Filter edges: keep edges where at least one endpoint is visible.
 * Build a set of visible node IDs first for O(1) lookup.
 */
export function cullEdges(
  edges: FamilyEdge[],
  visibleNodes: FamilyNode[]
): FamilyEdge[] {
  const visibleIds = new Set(visibleNodes.map(n => n._id));
  return edges.filter(e => visibleIds.has(e.sourceId) || visibleIds.has(e.targetId));
}

/**
 * Determine zoom level category from scale.
 */
export function getZoomLevel(scale: number): 'macro' | 'medium' | 'detail' {
  if (scale < 0.4) return 'macro';
  if (scale < 0.85) return 'medium';
  return 'detail';
}

/**
 * Snap a position to the nearest grid point.
 */
export function snapToGrid(x: number, y: number, gridSize: number): [number, number] {
  return [
    Math.round(x / gridSize) * gridSize,
    Math.round(y / gridSize) * gridSize,
  ];
}

/**
 * Convert world coordinates to screen coordinates.
 */
export function worldToScreen(
  wx: number,
  wy: number,
  viewport: Viewport
): [number, number] {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return [
    cx + (wx * viewport.scale) + viewport.x,
    cy + (wy * viewport.scale) + viewport.y,
  ];
}

/**
 * Convert screen coordinates to world coordinates.
 */
export function screenToWorld(
  sx: number,
  sy: number,
  viewport: Viewport
): [number, number] {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return [
    (sx - cx - viewport.x) / viewport.scale,
    (sy - cy - viewport.y) / viewport.scale,
  ];
}
