// ============================================================
// Hierarchical Tree Layout — Reingold-Tilford Algorithm
// ============================================================
// Computes aesthetically pleasing node positions for family trees.

import type { FamilyNode } from '@/types';

const H_GAP = 220;  // horizontal gap between siblings
const V_GAP = 180;  // vertical gap between generations

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  mod: number;     // modifier for subtree shift
  children: LayoutNode[];
  parent?: LayoutNode;
  thread?: LayoutNode;
  ancestor?: LayoutNode;
  change: number;
  shift: number;
  leftNeighbor?: LayoutNode;
  number: number;  // position among siblings
}

function buildLayoutTree(
  nodeId: string,
  nodesMap: Map<string, FamilyNode>,
  visited: Set<string>,
  depth: number = 0
): LayoutNode | null {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);

  const node = nodesMap.get(nodeId);
  if (!node || node.hidden) return null;

  const children: LayoutNode[] = [];
  for (const childId of node.childIds) {
    const child = buildLayoutTree(childId, nodesMap, visited, depth + 1);
    if (child) children.push(child);
  }

  const ln: LayoutNode = {
    id: nodeId,
    x: 0,
    y: depth * V_GAP,
    mod: 0,
    children,
    change: 0,
    shift: 0,
    number: 0,
  };

  children.forEach((c, i) => {
    c.parent = ln;
    c.number = i;
  });

  ln.ancestor = ln;
  return ln;
}

function firstWalk(v: LayoutNode, distance: number): void {
  if (v.children.length === 0) {
    const w = v.leftNeighbor;
    if (w) {
      v.x = w.x + distance;
    } else {
      v.x = 0;
    }
  } else {
    let defaultAncestor = v.children[0];
    for (const w of v.children) {
      w.leftNeighbor = defaultAncestor;
      firstWalk(w, distance);
      defaultAncestor = apportion(w, defaultAncestor, distance);
    }
    executeShifts(v);
    const midpoint =
      (v.children[0].x + v.children[v.children.length - 1].x) / 2;
    const w = v.leftNeighbor;
    if (w) {
      v.x = w.x + distance;
      v.mod = v.x - midpoint;
    } else {
      v.x = midpoint;
    }
  }
}

function apportion(
  v: LayoutNode,
  defaultAncestor: LayoutNode,
  distance: number
): LayoutNode {
  const w = v.leftNeighbor;
  if (!w) return defaultAncestor;

  let vip: LayoutNode | undefined = v;
  let vop: LayoutNode | undefined = v;
  let vim: LayoutNode | undefined = w;
  let vom: LayoutNode | undefined = vip.parent?.children[0];

  let sip = vip.mod;
  let sop = vop.mod;
  let sim = vim.mod;
  let som = vom ? vom.mod : 0;

  let nr = nextRight(vim);
  let nl = nextLeft(vip);

  while (nr && nl) {
    vim = nr;
    vip = nl;
    vom = nextLeft(vom);
    vop = nextRight(vop);

    if (vop) vop.ancestor = v;

    const shift = vim.x + sim - (vip.x + sip) + distance;
    if (shift > 0) {
      moveSubtree(ancestor(vim, v, defaultAncestor), v, shift);
      sip += shift;
      sop += shift;
    }
    sim += vim.mod;
    sip += vip.mod;
    if (vom) som += vom.mod;
    if (vop) sop += vop.mod;

    nr = nextRight(vim);
    nl = nextLeft(vip);
  }

  if (nr && vop && !nextRight(vop)) {
    vop.thread = nr;
    vop.mod += sim - sop;
  }
  if (nl && vom && !nextLeft(vom)) {
    vom.thread = nl;
    vom.mod += sip - som;
    defaultAncestor = v;
  }
  return defaultAncestor;
}

function nextLeft(v: LayoutNode | undefined): LayoutNode | undefined {
  if (!v) return undefined;
  return v.children.length > 0 ? v.children[0] : v.thread;
}

function nextRight(v: LayoutNode | undefined): LayoutNode | undefined {
  if (!v) return undefined;
  return v.children.length > 0
    ? v.children[v.children.length - 1]
    : v.thread;
}

function moveSubtree(wm: LayoutNode, wp: LayoutNode, shift: number): void {
  const subtrees = wp.number - wm.number;
  if (subtrees !== 0) {
    wp.change -= shift / subtrees;
    wp.shift += shift;
    wm.change += shift / subtrees;
    wp.x += shift;
    wp.mod += shift;
  }
}

function executeShifts(v: LayoutNode): void {
  let shift = 0;
  let change = 0;
  for (let i = v.children.length - 1; i >= 0; i--) {
    const w = v.children[i];
    w.x += shift;
    w.mod += shift;
    change += w.change;
    shift += w.shift + change;
  }
}

function ancestor(
  vim: LayoutNode,
  v: LayoutNode,
  defaultAncestor: LayoutNode
): LayoutNode {
  if (vim.ancestor && vim.ancestor.parent === v.parent) {
    return vim.ancestor;
  }
  return defaultAncestor;
}

function secondWalk(
  v: LayoutNode,
  m: number,
  result: Map<string, { x: number; y: number }>
): void {
  result.set(v.id, { x: v.x + m, y: v.y });
  for (const w of v.children) {
    secondWalk(w, m + v.mod, result);
  }
}

/**
 * Compute positions for all nodes using Reingold-Tilford layout.
 * Returns a map of nodeId → { x, y } in world coordinates.
 * Only recalculates positions for nodes without explicit position overrides.
 */
export function computeAutoLayout(
  nodes: FamilyNode[]
): Map<string, { x: number; y: number }> {
  const nodesMap = new Map(nodes.map(n => [n._id, n]));

  // Find root nodes (no parents or all parents not in this tree)
  const nodeIds = new Set(nodes.map(n => n._id));
  const roots = nodes.filter(n =>
    n.parentIds.length === 0 || !n.parentIds.some(pid => nodeIds.has(pid))
  );

  const result = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  let xOffset = 0;
  for (const root of roots) {
    const tree = buildLayoutTree(root._id, nodesMap, visited);
    if (!tree) continue;

    firstWalk(tree, H_GAP);
    secondWalk(tree, 0, result);

    // Shift this subtree to the right of previous roots
    let maxX = 0;
    for (const [, pos] of result) {
      if (pos.x > maxX) maxX = pos.x;
    }
    // Shift by accumulated offset
    for (const [id, pos] of result) {
      if (!nodesMap.get(id)?.position.x) {
        result.set(id, { x: pos.x + xOffset, y: pos.y });
      }
    }
    xOffset += maxX + H_GAP * 2;
  }

  return result;
}

/**
 * Detect circular references in the parent-child graph.
 * Returns list of node IDs involved in cycles.
 */
export function detectCycles(nodes: FamilyNode[]): string[] {
  const cycleNodes: string[] = [];
  const color = new Map<string, 'white' | 'gray' | 'black'>();
  nodes.forEach(n => color.set(n._id, 'white'));
  const nodesMap = new Map(nodes.map(n => [n._id, n]));

  function dfs(nodeId: string): boolean {
    color.set(nodeId, 'gray');
    const node = nodesMap.get(nodeId);
    if (!node) return false;

    for (const childId of node.childIds) {
      const c = color.get(childId);
      if (c === 'gray') {
        cycleNodes.push(nodeId, childId);
        return true;
      }
      if (c === 'white') {
        if (dfs(childId)) return true;
      }
    }
    color.set(nodeId, 'black');
    return false;
  }

  for (const node of nodes) {
    if (color.get(node._id) === 'white') {
      dfs(node._id);
    }
  }

  return [...new Set(cycleNodes)];
}

/**
 * Calculate relationship between two nodes.
 */
export function calculateRelationship(
  fromId: string,
  toId: string,
  nodes: FamilyNode[]
): string {
  if (fromId === toId) return 'self';

  const nodesMap = new Map(nodes.map(n => [n._id, n]));

  // BFS from fromId upward to find ancestors
  function getAncestors(nodeId: string): Map<string, number> {
    const ancestors = new Map<string, number>();
    const queue: [string, number][] = [[nodeId, 0]];
    while (queue.length > 0) {
      const [id, gen] = queue.shift()!;
      ancestors.set(id, gen);
      const node = nodesMap.get(id);
      if (node) {
        for (const pid of node.parentIds) {
          if (!ancestors.has(pid)) queue.push([pid, gen + 1]);
        }
      }
    }
    return ancestors;
  }

  const fromAncestors = getAncestors(fromId);
  const toAncestors = getAncestors(toId);

  // Check spouse
  const fromNode = nodesMap.get(fromId);
  const toNode = nodesMap.get(toId);
  if (fromNode?.spouseIds.includes(toId) || toNode?.spouseIds.includes(fromId)) {
    return 'spouse';
  }

  // Find common ancestor
  let commonAncestor = '';
  let fromDist = Infinity;
  let toDist = Infinity;

  for (const [aid, fd] of fromAncestors) {
    if (toAncestors.has(aid)) {
      const td = toAncestors.get(aid)!;
      if (fd + td < fromDist + toDist) {
        commonAncestor = aid;
        fromDist = fd;
        toDist = td;
      }
    }
  }

  if (!commonAncestor) return 'unrelated';

  const toGender = toNode?.gender ?? 'other';

  if (fromDist === 1 && toDist === 0) return toGender === 'female' ? 'mother' : 'father';
  if (fromDist === 0 && toDist === 1) return toGender === 'female' ? 'daughter' : 'son';
  if (fromDist === 1 && toDist === 1) return toGender === 'female' ? 'sister' : 'brother';
  if (fromDist === 2 && toDist === 0) return toGender === 'female' ? 'grandmother' : 'grandfather';
  if (fromDist === 0 && toDist === 2) return toGender === 'female' ? 'granddaughter' : 'grandson';
  if (fromDist === 2 && toDist === 1) return toGender === 'female' ? 'aunt' : 'uncle';
  if (fromDist === 1 && toDist === 2) return toGender === 'female' ? 'niece' : 'nephew';
  if (fromDist === 2 && toDist === 2) return 'cousin';
  if (fromDist === 3 && toDist === 0) return toGender === 'female' ? 'great-grandmother' : 'great-grandfather';
  if (fromDist === 0 && toDist === 3) return toGender === 'female' ? 'great-granddaughter' : 'great-grandson';

  // Generic cousin/removed description
  const cousinDegree = Math.min(fromDist, toDist) - 1;
  const removed = Math.abs(fromDist - toDist);
  if (cousinDegree >= 1) {
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];
    const ord = ordinals[cousinDegree - 1] ?? `${cousinDegree}th`;
    return removed === 0
      ? `${ord} cousin`
      : `${ord} cousin ${removed}x removed`;
  }

  return `${fromDist} generations up, ${toDist} down`;
}
