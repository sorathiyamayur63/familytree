// ============================================================
// Layout Utilities — Smart Collision-Free Space Finder
// ============================================================
import type { FamilyNode } from '@/types';

export const CARD_WIDTH = 184;
export const CARD_HEIGHT = 92;
export const GAP_X = 40;
export const GAP_Y = 44;

/**
 * Finds the nearest available world-space coordinate that does not collide
 * with any existing visible node bounding box.
 */
export function findNearestFreePosition(
  desiredX: number,
  desiredY: number,
  existingNodes: FamilyNode[]
): { x: number; y: number } {
  const isOccupied = (tx: number, ty: number) => {
    return existingNodes.some(n => {
      if (n.hidden) return false;
      return (
        Math.abs(n.position.x - tx) < CARD_WIDTH + GAP_X &&
        Math.abs(n.position.y - ty) < CARD_HEIGHT + GAP_Y
      );
    });
  };

  if (!isOccupied(desiredX, desiredY)) {
    return { x: desiredX, y: desiredY };
  }

  const stepX = CARD_WIDTH + GAP_X;
  const stepY = CARD_HEIGHT + GAP_Y;

  // Search in expanding spiral rings
  for (let radius = 1; radius <= 10; radius++) {
    const candidates = [
      { x: desiredX + radius * stepX, y: desiredY },
      { x: desiredX - radius * stepX, y: desiredY },
      { x: desiredX, y: desiredY + radius * stepY },
      { x: desiredX, y: desiredY - radius * stepY },
      { x: desiredX + radius * stepX, y: desiredY + radius * stepY },
      { x: desiredX - radius * stepX, y: desiredY + radius * stepY },
      { x: desiredX + radius * stepX, y: desiredY - radius * stepY },
      { x: desiredX - radius * stepX, y: desiredY - radius * stepY },
    ];

    for (const cand of candidates) {
      if (!isOccupied(cand.x, cand.y)) {
        return cand;
      }
    }
  }

  // Fallback
  return { x: desiredX + stepX * 2, y: desiredY };
}
