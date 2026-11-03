'use client';
// ============================================================
// Canvas Drawing Functions — High-End Figma/Miro Grade Renderer
// ============================================================

import type { FamilyNode, FamilyEdge, Viewport, CanvasConfig, GhostNode } from '@/types';
import { cullEdges, getZoomLevel } from '@/lib/culling';
import { findNearestFreePosition } from '@/lib/layoutUtils';

export const CARD_WIDTH = 184;
export const CARD_HEIGHT = 92;
export const IN_LAW_BTN_RADIUS = 12;
export const COLLAPSE_BTN_RADIUS = 9;

// ─── Helper: Draw Rounded Rectangle ───────────────────────────

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Color & Palette Engine (Modern SaaS Canvas) ──────────────

const PALETTE = {
  light: {
    bg: '#F8F9FB',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    borderHover: '#CBD5E1',
    selectedBorder: '#3B82F6',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    grid: 'rgba(15, 23, 42, 0.18)',
    maleAccent: '#3B82F6',
    maleBg: '#EFF6FF',
    femaleAccent: '#EC4899',
    femaleBg: '#FDF2F8',
    inLawAccent: '#8B5CF6',
    inLawBg: '#F5F3FF',
    edgeParent: '#94A3B8',
    edgeSpouse: '#F472B6',
    edgeInLaw: '#A78BFA',
  },
  dark: {
    bg: '#0B0F17',
    cardBg: '#151D2C',
    border: '#243044',
    borderHover: '#334155',
    selectedBorder: '#60A5FA',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    grid: 'rgba(255, 255, 255, 0.16)',
    maleAccent: '#60A5FA',
    maleBg: '#13233D',
    femaleAccent: '#F472B6',
    femaleBg: '#34152A',
    inLawAccent: '#A78BFA',
    inLawBg: '#23183A',
    edgeParent: '#475569',
    edgeSpouse: '#DB2777',
    edgeInLaw: '#8B5CF6',
  },
};

// ─── Grid Drawing ─────────────────────────────────────────────

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: CanvasConfig,
  isDark: boolean
): void {
  const { gridType, gridSize } = config;
  if (gridType === 'none') return;

  const pal = isDark ? PALETTE.dark : PALETTE.light;
  const W = vp.width;
  const H = vp.height;

  const gs = gridSize;
  const visMinX = (-vp.x - W / 2) / vp.scale - gs;
  const visMinY = (-vp.y - H / 2) / vp.scale - gs;
  const visMaxX = (-vp.x + W / 2) / vp.scale + gs;
  const visMaxY = (-vp.y + H / 2) / vp.scale + gs;

  const startX = Math.floor(visMinX / gs) * gs;
  const startY = Math.floor(visMinY / gs) * gs;

  ctx.save();
  ctx.fillStyle = pal.grid;
  ctx.strokeStyle = pal.grid;

  if (gridType === 'dots') {
    const dotR = Math.max(0.6, 0.85 / vp.scale);
    for (let x = startX; x < visMaxX; x += gs) {
      for (let y = startY; y < visMaxY; y += gs) {
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridType === 'lines') {
    ctx.lineWidth = 1 / vp.scale;
    for (let x = startX; x < visMaxX; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, visMinY); ctx.lineTo(x, visMaxY); ctx.stroke();
    }
    for (let y = startY; y < visMaxY; y += gs) {
      ctx.beginPath(); ctx.moveTo(visMinX, y); ctx.lineTo(visMaxX, y); ctx.stroke();
    }
  } else if (gridType === 'cross') {
    const s = 3 / vp.scale;
    ctx.lineWidth = 1 / vp.scale;
    for (let x = startX; x < visMaxX; x += gs) {
      for (let y = startY; y < visMaxY; y += gs) {
        ctx.beginPath();
        ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

// ─── Edge Drawing with Sleek Curves ───────────────────────────

export function drawEdges(
  ctx: CanvasRenderingContext2D,
  edges: FamilyEdge[],
  nodeMap: Map<string, FamilyNode>,
  config: CanvasConfig,
  isDark: boolean
): void {
  const pal = isDark ? PALETTE.dark : PALETTE.light;
  const HW = CARD_WIDTH / 2;
  const HH = CARD_HEIGHT / 2;

  for (const edge of edges) {
    const src = nodeMap.get(edge.sourceId);
    const tgt = nodeMap.get(edge.targetId);
    if (!src || !tgt || src.hidden || tgt.hidden) continue;

    const sx = src.position.x;
    const sy = src.position.y;
    const ex = tgt.position.x;
    const ey = tgt.position.y;

    const isSpouse = edge.type === 'spouse';
    const isInLaw = edge.type === 'in-law' || tgt.branchType === 'in-law';

    ctx.save();

    if (isSpouse) {
      ctx.strokeStyle = pal.edgeSpouse;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);

      // Horizontal connection between spouses
      ctx.beginPath();
      const startX = sx < ex ? sx + HW : sx - HW;
      const endX = sx < ex ? ex - HW : ex + HW;
      ctx.moveTo(startX, sy);
      ctx.lineTo(endX, ey);
      ctx.stroke();

      // Small central ring icon
      const midX = (startX + endX) / 2;
      const midY = (sy + ey) / 2;
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#1E293B' : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(midX, midY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.edgeSpouse;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (isInLaw) {
      // In-law branch connector (violet dashed)
      ctx.strokeStyle = pal.edgeInLaw;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);

      ctx.beginPath();
      const cp1y = sy - HH - Math.abs(ey - sy) * 0.4;
      const cp2y = ey + HH + Math.abs(ey - sy) * 0.4;
      ctx.moveTo(sx, sy - HH);
      ctx.bezierCurveTo(sx, cp1y, ex, cp2y, ex, ey + HH);
      ctx.stroke();
    } else {
      // Standard Parent-Child Hierarchy Connector (Figma Blue Curved Bezier)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([]);

      const style = edge.style ?? config.edgeStyle;
      ctx.beginPath();

      if (style === 'step') {
        const midY = (sy + HH + ey - HH) / 2;
        ctx.moveTo(sx, sy + HH);
        ctx.lineTo(sx, midY);
        ctx.lineTo(ex, midY);
        ctx.lineTo(ex, ey - HH);
      } else if (style === 'straight') {
        ctx.moveTo(sx, sy + HH);
        ctx.lineTo(ex, ey - HH);
      } else {
        // Smooth Cubic Bezier matching reference design
        const dist = Math.abs(ey - (sy + HH));
        const cp1y = sy + HH + dist * 0.45;
        const cp2y = ey - HH - dist * 0.45;
        ctx.moveTo(sx, sy + HH);
        ctx.bezierCurveTo(sx, cp1y, ex, cp2y, ex, ey - HH);
      }
      ctx.stroke();

      // Sharp directional arrowhead pointing down into target card (matches reference image)
      const arrowSize = 5;
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.moveTo(ex, ey - HH);
      ctx.lineTo(ex - arrowSize, ey - HH - arrowSize * 1.6);
      ctx.lineTo(ex + arrowSize, ey - HH - arrowSize * 1.6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// ─── Image Cache ──────────────────────────────────────────────

const imageCache = new Map<string, HTMLImageElement | null>();
const imageListeners = new Set<() => void>();

export function onImageCacheUpdate(listener: () => void) {
  imageListeners.add(listener);
  return () => {
    imageListeners.delete(listener);
  };
}

function getCachedImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  if (imageCache.has(src)) return imageCache.get(src) ?? null;
  const img = new Image();
  img.onload = () => {
    imageCache.set(src, img);
    imageListeners.forEach(fn => {
      try { fn(); } catch {}
    });
  };
  img.onerror = () => imageCache.set(src, null);
  img.src = src;
  imageCache.set(src, null);
  return null;
}

// ─── Professional Node Card Drawing ───────────────────────────

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: FamilyNode,
  opts: {
    isSelected: boolean;
    isHovered: boolean;
    isReference: boolean;
    isCycle: boolean;
    zoomLevel: 'macro' | 'medium' | 'detail';
    showGujarati: boolean;
    isDark: boolean;
    scale: number;
    hoveredBtnPart?: 'card' | 'inlaw' | 'collapse' | 'photo' | 'name' | 'port' | null;
    isFlipped?: boolean;
    isEditMode?: boolean;
  }
): void {
  const { x, y } = node.position;
  const {
    isSelected, isHovered, isReference, isCycle,
    zoomLevel, showGujarati, isDark, scale, hoveredBtnPart, isFlipped, isEditMode,
  } = opts;

  const pal = isDark ? PALETTE.dark : PALETTE.light;
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  const HW = W / 2;
  const HH = H / 2;

  // Custom node styling
  const shape = node.style?.shape || 'rounded-card';
  let r = 14;
  if (shape === 'minimal-pill') {
    r = HH;
  } else if (shape === 'badge') {
    r = 4;
  } else if (shape === 'circle') {
    r = 24;
  }

  const customBg = node.style?.bgColor;
  const customBorder = node.style?.borderColor;
  const customAccent = node.style?.accentColor;

  const isInLaw = node.branchType === 'in-law';
  const isFemale = node.gender === 'female';
  const hasInLaws = (node.inLawNodeIds && node.inLawNodeIds.length > 0) || false;
  const inLawsCollapsed = node.inLawsHidden ?? true;

  ctx.save();

  // ── Macro Zoom (< 40%): Compact Macro Badge ──────────────
  if (zoomLevel === 'macro') {
    const pillW = 64 / scale;
    const pillH = 22 / scale;
    const pillR = pillH / 2;

    ctx.fillStyle = customBg || (isInLaw
      ? pal.inLawBg
      : isFemale ? pal.femaleBg : pal.maleBg);
    ctx.strokeStyle = isSelected
      ? pal.selectedBorder
      : customAccent || (isInLaw ? pal.inLawAccent : isFemale ? pal.femaleAccent : pal.maleAccent);
    ctx.lineWidth = isSelected ? 2.5 / scale : 1.2 / scale;

    drawRoundedRect(ctx, x - pillW / 2, y - pillH / 2, pillW, pillH, pillR);
    ctx.fill();
    ctx.stroke();

    const effectiveShowGu = isFlipped ? !showGujarati : showGujarati;
    const initial = effectiveShowGu
      ? (node.nameGujarati.slice(0, 3) || '—')
      : (node.nameEnglish.slice(0, 4) || '—');
    ctx.font = `600 ${10 / scale}px sans-serif`;
    ctx.fillStyle = pal.textPrimary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, x, y);
    ctx.restore();
    return;
  }

  // ── Card Elevation Drop Shadow ───────────────────────────
  if (isSelected) {
    ctx.shadowColor = isReference ? '#10B981' : pal.selectedBorder;
    ctx.shadowBlur = 18;
  } else if (isHovered) {
    ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
    ctx.shadowBlur = 12;
  } else {
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.06)';
    ctx.shadowBlur = 8;
  }
  ctx.shadowOffsetY = 3;

  // ── Card Body Background ─────────────────────────────────
  drawRoundedRect(ctx, x - HW, y - HH, W, H, r);
  ctx.fillStyle = customBg || pal.cardBg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // ── Top Gender / Branch Accent Line ───────────────────────
  ctx.save();
  drawRoundedRect(ctx, x - HW, y - HH, W, H, r);
  ctx.clip();

  const accentColor = isCycle
    ? '#EF4444'
    : customAccent || (isInLaw
    ? pal.inLawAccent
    : isFemale
    ? pal.femaleAccent
    : pal.maleAccent);

  ctx.fillStyle = accentColor;
  ctx.fillRect(x - HW, y - HH, W, 3.5);
  ctx.restore();

  // ── Card Border ──────────────────────────────────────────
  drawRoundedRect(ctx, x - HW, y - HH, W, H, r);
  ctx.strokeStyle = isCycle
    ? '#EF4444'
    : isSelected
    ? (isReference ? '#10B981' : pal.selectedBorder)
    : isHovered
    ? pal.borderHover
    : (customBorder || pal.border);
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.stroke();

  // ── Branch / Generation Micro-Tag ────────────────────────
  const tagBg = isInLaw ? pal.inLawBg : isDark ? '#1E293B' : '#F1F5F9';
  const tagText = isInLaw ? pal.inLawAccent : pal.textMuted;
  const tagLabel = isInLaw
    ? 'સાસરી પક્ષ'
    : node.branchType === 'mosal'
    ? 'મોસાળ'
    : `G${node.generation !== undefined ? node.generation : 1}`;

  ctx.fillStyle = tagBg;
  drawRoundedRect(ctx, x - HW + 12, y - HH + 10, 48, 14, 4);
  ctx.fill();

  ctx.font = '600 9px sans-serif';
  ctx.fillStyle = tagText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagLabel, x - HW + 36, y - HH + 17);

  // ── Avatar / Photo (Detail Zoom only, initials otherwise) ─
  const avatarSize = 38;
  const avatarX = x - HW + 12;
  const avatarY = y - 4;
  const mask = node.style?.photoMask ?? 'circle';
  const showFullPhoto = (zoomLevel === 'detail' || zoomLevel === 'medium') && !!node.photo;

  if (showFullPhoto) {
    const img = getCachedImage(node.photo!);
    if (img) {
      ctx.save();
      ctx.beginPath();
      if (mask === 'circle') {
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      } else {
        drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 6);
      }
      ctx.clip();
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Subtle click-to-expand photo indicator
      if (hoveredBtnPart === 'photo') {
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      drawInitialsAvatar();
    }
  } else {
    drawInitialsAvatar();
  }

  function drawInitialsAvatar() {
    ctx.fillStyle = isInLaw
      ? pal.inLawBg
      : isFemale ? pal.femaleBg : pal.maleBg;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isInLaw
      ? pal.inLawAccent
      : isFemale ? pal.femaleAccent : pal.maleAccent;
    ctx.lineWidth = 1;
    ctx.stroke();

    const effectiveShowGu = isFlipped ? !showGujarati : showGujarati;
    const initials = effectiveShowGu
      ? (node.nameGujarati.slice(0, 2) || 'વ્ય')
      : (node.nameEnglish.slice(0, 2).toUpperCase() || 'P');

    ctx.font = '600 12px sans-serif';
    ctx.fillStyle = isInLaw
      ? pal.inLawAccent
      : isFemale ? pal.femaleAccent : pal.maleAccent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, avatarX + avatarSize / 2, avatarY + avatarSize / 2);
  }

  // ── Typography: Default Gujarati Name & Relation Subtitle ─
  const textX = avatarX + avatarSize + 10;
  const maxTextW = HW - (textX - x) - 10;

  const effectiveShowGu = isFlipped ? !showGujarati : showGujarati;
  const primaryName = effectiveShowGu
    ? (node.nameGujarati || node.nameEnglish)
    : (node.nameEnglish || node.nameGujarati);

  ctx.fillStyle = pal.textPrimary;
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(primaryName || 'અનામી', textX, y + 5, maxTextW);

  // Subtitle: Gujarati Relation / Kinship Title
  ctx.fillStyle = pal.textSecondary;
  ctx.font = '400 11px sans-serif';
  const subtitle = node.kinshipTitle || (effectiveShowGu ? node.nameEnglish : node.nameGujarati);
  ctx.fillText(subtitle || 'કુટુંબ સભ્ય', textX, y + 21, maxTextW);

  // Birth/Death Years
  if (zoomLevel === 'detail' && (node.birthDate || node.deathDate)) {
    const by = node.birthDate ? node.birthDate.split('-')[0] : '';
    const dy = node.deathDate ? node.deathDate.split('-')[0] : '';
    const dateLabel = [by, dy].filter(Boolean).join(' – ');
    ctx.fillStyle = pal.textMuted;
    ctx.font = '400 9.5px sans-serif';
    ctx.fillText(dateLabel, textX, y + 33, maxTextW);
  }

  // Deceased indicator cross
  if (node.deathDate) {
    ctx.fillStyle = pal.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('✝', x + HW - 12, y - HH + 22);
  }

  // ── In-Law Round Button (સાસરી પક્ષ Toggle) ───────────────
  // User Requirement: round button to hide/reveal in-law branch
  if (hasInLaws || node.inLawNodeIds) {
    const count = node.inLawNodeIds?.length || 0;
    const btnX = x + HW - 18;
    const btnY = y - HH + 14;
    const isBtnHovered = hoveredBtnPart === 'inlaw';

    ctx.save();
    ctx.beginPath();
    ctx.arc(btnX, btnY, IN_LAW_BTN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = inLawsCollapsed
      ? (isBtnHovered ? '#DDD6FE' : '#EDE9FE')
      : '#8B5CF6';
    ctx.fill();

    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = inLawsCollapsed ? '#6D28D9' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inLawsCollapsed ? `+${count}` : '⚯', btnX, btnY);
    ctx.restore();
  }

  // ── Children Subtree Collapse/Expand Button ──────────────
  if (node.childIds.length > 0) {
    const btnX = x;
    const btnY = y + HH;
    const isBtnHovered = hoveredBtnPart === 'collapse';

    ctx.save();
    ctx.beginPath();
    ctx.arc(btnX, btnY, COLLAPSE_BTN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = node.collapsed
      ? '#3B82F6'
      : isBtnHovered ? '#E2E8F0' : pal.cardBg;
    ctx.fill();

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = node.collapsed ? '#FFFFFF' : '#3B82F6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.collapsed ? '+' : '−', btnX, btnY);
    ctx.restore();
  }

  // ── Drag & Connect Handle Port (Edit Mode) ────────────────
  if (isEditMode) {
    const portX = node.childIds.length > 0 ? x + 24 : x;
    const portY = y + HH;
    const isPortHovered = hoveredBtnPart === 'port';

    ctx.save();
    ctx.beginPath();
    ctx.arc(portX, portY, isPortHovered ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', portX, portY);
    ctx.restore();
  }

  ctx.restore();
}

// ─── Ghost / Suggestion Node Drawing ──────────────────────────

export function drawGhostNode(
  ctx: CanvasRenderingContext2D,
  ghost: GhostNode,
  isHovered: boolean,
  scale: number,
  isDark: boolean
): void {
  const { x, y } = ghost.position;
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  const HW = W / 2;
  const HH = H / 2;
  const r = 14;

  ctx.save();
  ctx.globalAlpha = isHovered ? 0.75 : 0.35;

  // Dashed outline
  drawRoundedRect(ctx, x - HW, y - HH, W, H, r);
  ctx.fillStyle = isDark ? '#1E293B' : '#F8FAFC';
  ctx.fill();

  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = ghost.relationType === 'in-laws'
    ? '#8B5CF6'
    : ghost.gender === 'female' ? '#EC4899' : '#3B82F6';
  ctx.lineWidth = isHovered ? 2 : 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Central Plus and Label
  ctx.font = '600 13px sans-serif';
  ctx.fillStyle = isDark ? '#E2E8F0' : '#334155';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`+ ${ghost.labelGujarati}`, x, y - 6);

  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.fillText(ghost.labelEnglish, x, y + 12);

  ctx.restore();
}

// ─── Generate Ghost Suggestions for Selected Node ─────────────

export function getGhostNodesForSelection(
  selectedNode: FamilyNode,
  existingNodes: FamilyNode[]
): GhostNode[] {
  const { x, y } = selectedNode.position;
  const ghosts: GhostNode[] = [];

  // 1. Top: Add Parents (પિતા / માતા) if not already having 2 parents
  if (selectedNode.parentIds.length < 2) {
    const pos = findNearestFreePosition(x, y - 140, existingNodes);
    ghosts.push({
      id: `ghost-father-${selectedNode._id}`,
      targetNodeId: selectedNode._id,
      relationType: 'father',
      labelGujarati: 'પિતા / માતા ઉમેરો',
      labelEnglish: '+ Add Parent',
      gender: 'male',
      branchType: 'main',
      position: pos,
    });
  }

  // 2. Right: Add Spouse (પતિ / પત્ની)
  if (selectedNode.spouseIds.length === 0) {
    const isWife = selectedNode.gender === 'male';
    const pos = findNearestFreePosition(x + 230, y, existingNodes);
    ghosts.push({
      id: `ghost-spouse-${selectedNode._id}`,
      targetNodeId: selectedNode._id,
      relationType: 'spouse',
      labelGujarati: isWife ? 'પત્ની ઉમેરો' : 'પતિ ઉમેરો',
      labelEnglish: isWife ? '+ Add Wife' : '+ Add Husband',
      gender: isWife ? 'female' : 'male',
      branchType: 'main',
      position: pos,
    });
  }

  // 3. Bottom: Add Child (પુત્ર / પુત્રી)
  const childPos = findNearestFreePosition(x, y + 140, existingNodes);
  ghosts.push({
    id: `ghost-child-${selectedNode._id}`,
    targetNodeId: selectedNode._id,
    relationType: 'child',
    labelGujarati: 'સંતાન ઉમેરો (દીકરો/દીકરી)',
    labelEnglish: '+ Add Child',
    gender: 'male',
    branchType: 'main',
    position: childPos,
  });

  // 4. In-Laws (સાસરી પક્ષ: સસરા, સાસુ, દિયર)
  if (!selectedNode.inLawNodeIds || selectedNode.inLawNodeIds.length === 0) {
    const inLawPos = findNearestFreePosition(x + 230, y - 140, existingNodes);
    ghosts.push({
      id: `ghost-inlaws-${selectedNode._id}`,
      targetNodeId: selectedNode._id,
      relationType: 'in-laws',
      labelGujarati: 'સાસરી પક્ષ (સાસુ-સસરા)',
      labelEnglish: '+ Add In-Laws Branch',
      gender: 'female',
      branchType: 'in-law',
      position: inLawPos,
    });
  }

  return ghosts;
}

// ─── Hit Testing Helpers ──────────────────────────────────────

export function hitTestNodeParts(
  wx: number,
  wy: number,
  node: FamilyNode
): 'card' | 'inlaw' | 'collapse' | 'photo' | 'name' | 'port' | null {
  const { x, y } = node.position;
  const HW = CARD_WIDTH / 2;
  const HH = CARD_HEIGHT / 2;

  // 1. Drag & Connect Port Handle
  const portX = node.childIds.length > 0 ? x + 24 : x;
  const portY = y + HH;
  if (Math.hypot(wx - portX, wy - portY) <= 12) {
    return 'port';
  }

  // 2. In-Law round button hit test
  if (node.inLawNodeIds && node.inLawNodeIds.length > 0) {
    const btnX = x + HW - 18;
    const btnY = y - HH + 14;
    const dist = Math.hypot(wx - btnX, wy - btnY);
    if (dist <= IN_LAW_BTN_RADIUS + 5) return 'inlaw';
  }

  // 3. Collapse children button hit test
  if (node.childIds.length > 0) {
    const btnX = x;
    const btnY = y + HH;
    const dist = Math.hypot(wx - btnX, wy - btnY);
    if (dist <= COLLAPSE_BTN_RADIUS + 5) return 'collapse';
  }

  // 4. Avatar / Photo hit test
  const avatarSize = 38;
  const avatarCenterX = x - HW + 12 + avatarSize / 2;
  const avatarCenterY = y - 4 + avatarSize / 2;
  if (Math.hypot(wx - avatarCenterX, wy - avatarCenterY) <= avatarSize / 2 + 3) {
    return 'photo';
  }

  // 5. Name text area hit test (click to toggle language)
  const textX = x - HW + 12 + avatarSize + 10;
  if (wx >= textX - 4 && wx <= x + HW - 10 && wy >= y - 10 && wy <= y + 14) {
    return 'name';
  }

  // 6. Main card body
  if (wx >= x - HW && wx <= x + HW && wy >= y - HH && wy <= y + HH) {
    return 'card';
  }

  return null;
}

export function hitTestGhost(
  wx: number,
  wy: number,
  ghost: GhostNode
): boolean {
  const { x, y } = ghost.position;
  const HW = CARD_WIDTH / 2;
  const HH = CARD_HEIGHT / 2;
  return wx >= x - HW && wx <= x + HW && wy >= y - HH && wy <= y + HH;
}

// ─── Minimap (Figma-Style Floating Radar) ─────────────────────

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  nodes: FamilyNode[],
  vp: Viewport,
  isDark: boolean
): void {
  const MM_W = 180;
  const MM_H = 110;
  const MM_X = canvasW - MM_W - 20;
  const MM_Y = canvasH - MM_H - 75;
  const PAD = 40;

  if (nodes.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.hidden) continue;
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
    if (n.position.x > maxX) maxX = n.position.x;
    if (n.position.y > maxY) maxY = n.position.y;
  }

  const ww = maxX - minX + PAD * 2 || 1;
  const wh = maxY - minY + PAD * 2 || 1;
  const mmScale = Math.min(MM_W / ww, MM_H / wh);

  ctx.save();

  // Glassy Card Background
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)';
  drawRoundedRect(ctx, MM_X, MM_Y, MM_W, MM_H, 12);
  ctx.fill();

  ctx.strokeStyle = isDark ? '#334155' : '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Clip content inside minimap
  ctx.beginPath();
  drawRoundedRect(ctx, MM_X, MM_Y, MM_W, MM_H, 12);
  ctx.clip();

  // Draw node dots
  for (const n of nodes) {
    if (n.hidden) continue;
    const mx = MM_X + (n.position.x - minX + PAD) * mmScale;
    const my = MM_Y + (n.position.y - minY + PAD) * mmScale;

    ctx.beginPath();
    ctx.arc(mx, my, Math.max(1.8, 3.5 * mmScale), 0, Math.PI * 2);
    ctx.fillStyle = n.branchType === 'in-law'
      ? '#8B5CF6'
      : n.gender === 'female' ? '#EC4899' : '#3B82F6';
    ctx.fill();
  }

  // Camera viewport indicator
  const vpWorldMinX = (-vp.x - vp.width / 2) / vp.scale;
  const vpWorldMinY = (-vp.y - vp.height / 2) / vp.scale;
  const vpWorldW = vp.width / vp.scale;
  const vpWorldH = vp.height / vp.scale;

  const rectX = MM_X + (vpWorldMinX - minX + PAD) * mmScale;
  const rectY = MM_Y + (vpWorldMinY - minY + PAD) * mmScale;
  const rectW = vpWorldW * mmScale;
  const rectH = vpWorldH * mmScale;

  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rectX, rectY, rectW, rectH);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
  ctx.fillRect(rectX, rectY, rectW, rectH);

  ctx.restore();
}
