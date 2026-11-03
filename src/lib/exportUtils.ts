// ============================================================
// exportUtils.ts — High-Resolution SVG and PNG Tree Exporters
// Exports full tree with bounding box calculation and 2x resolution
// ============================================================

import type { FamilyNode, FamilyEdge, CanvasConfig } from '@/types';
import { CARD_WIDTH, CARD_HEIGHT } from '@/components/canvas/NodeRenderer';

interface ExportTreeOptions {
  nodes: FamilyNode[];
  edges: FamilyEdge[];
  treeName: string;
  config: CanvasConfig;
  isDark: boolean;
  showGujarati: boolean;
}

// ─── 1. Export High-Resolution PNG (Full Tree Canvas) ─────────

export async function exportTreeAsPNG({
  nodes,
  edges,
  treeName,
  config,
  isDark,
  showGujarati,
}: ExportTreeOptions): Promise<void> {
  const visibleNodes = nodes.filter(n => !n.hidden);
  if (visibleNodes.length === 0) {
    alert('No visible nodes to export.');
    return;
  }

  // Calculate full tree bounding box
  const PAD = 100;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of visibleNodes) {
    minX = Math.min(minX, n.position.x - CARD_WIDTH / 2);
    minY = Math.min(minY, n.position.y - CARD_HEIGHT / 2);
    maxX = Math.max(maxX, n.position.x + CARD_WIDTH / 2);
    maxY = Math.max(maxY, n.position.y + CARD_HEIGHT / 2);
  }

  const treeW = maxX - minX + PAD * 2;
  const treeH = maxY - minY + PAD * 2;

  // Use 2x scale for crystal-clear retina print resolution
  const SCALE = 2;
  const offscreen = document.createElement('canvas');
  offscreen.width = treeW * SCALE;
  offscreen.height = treeH * SCALE;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return;

  ctx.scale(SCALE, SCALE);

  // Background
  ctx.fillStyle = isDark ? '#0B0F17' : '#F8F9FB';
  ctx.fillRect(0, 0, treeW, treeH);

  // Soft Dot Grid
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.14)';
  const gs = 24;
  for (let x = 0; x < treeW; x += gs) {
    for (let y = 0; y < treeH; y += gs) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Offset all drawing so (minX - PAD, minY - PAD) maps to (0, 0)
  ctx.translate(-minX + PAD, -minY + PAD);

  const nodeMap = new Map(visibleNodes.map(n => [n._id, n]));
  const HW = CARD_WIDTH / 2;
  const HH = CARD_HEIGHT / 2;

  // Draw Edges
  for (const edge of edges) {
    const src = nodeMap.get(edge.sourceId);
    const tgt = nodeMap.get(edge.targetId);
    if (!src || !tgt) continue;

    const sx = src.position.x;
    const sy = src.position.y;
    const ex = tgt.position.x;
    const ey = tgt.position.y;

    if (edge.type === 'spouse') {
      ctx.strokeStyle = '#F472B6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      const startX = sx < ex ? sx + HW : sx - HW;
      const endX = sx < ex ? ex - HW : ex + HW;
      ctx.moveTo(startX, sy);
      ctx.lineTo(endX, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([]);
      ctx.beginPath();
      const dist = Math.abs(ey - (sy + HH));
      const cp1y = sy + HH + dist * 0.45;
      const cp2y = ey - HH - dist * 0.45;
      ctx.moveTo(sx, sy + HH);
      ctx.bezierCurveTo(sx, cp1y, ex, cp2y, ex, ey - HH);
      ctx.stroke();

      // Arrowhead
      const arrowSize = 5;
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.moveTo(ex, ey - HH);
      ctx.lineTo(ex - arrowSize, ey - HH - arrowSize * 1.6);
      ctx.lineTo(ex + arrowSize, ey - HH - arrowSize * 1.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw Nodes
  for (const node of visibleNodes) {
    const { x, y } = node.position;
    const r = 14;

    // Drop shadow
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Body
    ctx.fillStyle = isDark ? '#151D2C' : '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(x - HW, y - HH, CARD_WIDTH, CARD_HEIGHT, r);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Top Accent Stripe
    const isFemale = node.gender === 'female';
    const isInLaw = node.branchType === 'in-law';
    const accent = isInLaw ? '#8B5CF6' : isFemale ? '#EC4899' : '#2563EB';

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x - HW, y - HH, CARD_WIDTH, CARD_HEIGHT, r);
    ctx.clip();
    ctx.fillStyle = accent;
    ctx.fillRect(x - HW, y - HH, CARD_WIDTH, 4);
    ctx.restore();

    // Border
    ctx.strokeStyle = isDark ? '#2D3748' : '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - HW, y - HH, CARD_WIDTH, CARD_HEIGHT, r);
    ctx.stroke();

    // Initials Avatar
    const avatarX = x - HW + 14;
    const avatarY = y - 4;
    const avatarSize = 38;
    ctx.fillStyle = isInLaw ? '#F5F3FF' : isFemale ? '#FDF2F8' : '#EFF6FF';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '600 12px sans-serif';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = showGujarati
      ? (node.nameGujarati.slice(0, 2) || 'વ્ય')
      : (node.nameEnglish.slice(0, 2).toUpperCase() || 'P');
    ctx.fillText(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2);

    // Text Lines: Gujarati Name + Kinship Title / English
    const textX = avatarX + avatarSize + 10;
    const maxTextW = HW - (textX - x) - 10;

    const primary = showGujarati ? node.nameGujarati : (node.nameEnglish || node.nameGujarati);
    ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(primary || 'અનામી', textX, y + 5, maxTextW);

    const secondary = node.kinshipTitle || (showGujarati ? node.nameEnglish : node.nameGujarati);
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    ctx.font = '400 11px sans-serif';
    ctx.fillText(secondary || '', textX, y + 22, maxTextW);
  }

  // Download Trigger
  const dataUrl = offscreen.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${treeName.replace(/\s+/g, '-')}-family-tree.png`;
  a.click();
}

// ─── 2. Export High-Quality SVG (Vector Full Tree) ─────────────

export function exportTreeAsSVG({
  nodes,
  edges,
  treeName,
  isDark,
  showGujarati,
}: ExportTreeOptions): void {
  const visibleNodes = nodes.filter(n => !n.hidden);
  if (visibleNodes.length === 0) {
    alert('No visible nodes to export.');
    return;
  }

  const PAD = 100;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of visibleNodes) {
    minX = Math.min(minX, n.position.x - CARD_WIDTH / 2);
    minY = Math.min(minY, n.position.y - CARD_HEIGHT / 2);
    maxX = Math.max(maxX, n.position.x + CARD_WIDTH / 2);
    maxY = Math.max(maxY, n.position.y + CARD_HEIGHT / 2);
  }

  const treeW = maxX - minX + PAD * 2;
  const treeH = maxY - minY + PAD * 2;
  const shiftX = -minX + PAD;
  const shiftY = -minY + PAD;

  const nodeMap = new Map(visibleNodes.map(n => [n._id, n]));
  const HW = CARD_WIDTH / 2;
  const HH = CARD_HEIGHT / 2;

  let edgesSvg = '';
  for (const edge of edges) {
    const src = nodeMap.get(edge.sourceId);
    const tgt = nodeMap.get(edge.targetId);
    if (!src || !tgt) continue;

    const sx = src.position.x + shiftX;
    const sy = src.position.y + shiftY;
    const ex = tgt.position.x + shiftX;
    const ey = tgt.position.y + shiftY;

    if (edge.type === 'spouse') {
      const startX = sx < ex ? sx + HW : sx - HW;
      const endX = sx < ex ? ex - HW : ex + HW;
      edgesSvg += `<line x1="${startX}" y1="${sy}" x2="${endX}" y2="${ey}" stroke="#F472B6" stroke-width="2" stroke-dasharray="5,4" />\n`;
    } else {
      const dist = Math.abs(ey - (sy + HH));
      const cp1y = sy + HH + dist * 0.45;
      const cp2y = ey - HH - dist * 0.45;
      const d = `M ${sx} ${sy + HH} C ${sx} ${cp1y}, ${ex} ${cp2y}, ${ex} ${ey - HH}`;
      edgesSvg += `<path d="${d}" stroke="#2563EB" stroke-width="2.2" fill="none" marker-end="url(#arrow)" />\n`;
    }
  }

  let nodesSvg = '';
  for (const node of visibleNodes) {
    const x = node.position.x + shiftX;
    const y = node.position.y + shiftY;
    const isFemale = node.gender === 'female';
    const isInLaw = node.branchType === 'in-law';
    const accent = isInLaw ? '#8B5CF6' : isFemale ? '#EC4899' : '#2563EB';
    const cardBg = isDark ? '#151D2C' : '#FFFFFF';
    const border = isDark ? '#2D3748' : '#E2E8F0';
    const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
    const textSecondary = isDark ? '#94A3B8' : '#64748B';

    const primary = showGujarati ? node.nameGujarati : (node.nameEnglish || node.nameGujarati);
    const secondary = node.kinshipTitle || (showGujarati ? node.nameEnglish : node.nameGujarati);

    nodesSvg += `
    <g transform="translate(${x - HW}, ${y - HH})">
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="14" fill="${cardBg}" stroke="${border}" stroke-width="1" filter="url(#cardShadow)" />
      <path d="M 0 14 Q 0 0 14 0 L ${CARD_WIDTH - 14} 0 Q ${CARD_WIDTH} 0 ${CARD_WIDTH} 14 L ${CARD_WIDTH} 4 L 0 4 Z" fill="${accent}" />
      <circle cx="33" cy="46" r="19" fill="${isInLaw ? '#F5F3FF' : isFemale ? '#FDF2F8' : '#EFF6FF'}" stroke="${accent}" stroke-width="1" />
      <text x="33" y="50" font-family="sans-serif" font-size="12" font-weight="600" fill="${accent}" text-anchor="middle">${showGujarati ? node.nameGujarati.slice(0, 2) : node.nameEnglish.slice(0, 2).toUpperCase()}</text>
      <text x="64" y="44" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="${textPrimary}">${primary}</text>
      <text x="64" y="60" font-family="sans-serif" font-size="11" fill="${textSecondary}">${secondary || ''}</text>
    </g>
    `;
  }

  const svgContent = `<?xml version="1.0" standalone="no"?>
<svg width="${treeW}" height="${treeH}" viewBox="0 0 ${treeW} ${treeH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(15,23,42,0.08)" />
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#2563EB" />
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="${isDark ? '#0B0F17' : '#F8F9FB'}" />
  <g>
    ${edgesSvg}
    ${nodesSvg}
  </g>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${treeName.replace(/\s+/g, '-')}-family-tree.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
