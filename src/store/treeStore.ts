// ============================================================
// Zustand Store — Global App State with Non-Overlapping Layout,
// Copy/Paste, Interactive Drag-Connect, and Click-to-Flip Language
// ============================================================
'use client';
import { create } from 'zustand';
import type {
  FamilyNode,
  FamilyTree,
  Viewport,
  CanvasConfig,
  UndoableAction,
  GridType,
  EdgeStyle,
  NodeShape,
  GhostNode,
  BranchType,
} from '@/types';
import { englishToGujaratiPhonetic } from '@/lib/gujarati';
import { findNearestFreePosition } from '@/lib/layoutUtils';
export { findNearestFreePosition };

const MAX_UNDO_STEPS = 50;
const STORAGE_PREFIX = 'ft_';

export function saveToLocal(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {}
}

export function loadFromLocal<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface TreeStore {
  // ─── Tree & Nodes ────────────────────────────────────────
  trees: FamilyTree[];
  activeTreeId: string | null;
  nodes: FamilyNode[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
  referenceNodeId: string | null;

  // ─── Multi-Selection & Clipboard (Ctrl+C, Ctrl+X, Ctrl+V) ───
  clipboardNodes: FamilyNode[];
  isClipboardCut: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';

  // ─── Per-Node Language Flip & Photo Lightbox ─────────────
  flippedLanguageNodeIds: Set<string>;
  lightboxPhotoUrl: string | null;
  copiedNode: FamilyNode | null;

  // ─── UI State ─────────────────────────────────────────────
  isEditMode: boolean;
  showNameInGujarati: boolean;
  leftSidebarTab: 'layers' | 'search' | 'export' | null;
  showInspector: boolean;
  inspectorTab: 'properties' | 'kinship' | 'inlaws' | 'style';
  showTimeline: boolean;
  showMinimap: boolean;
  showPhotoEditor: boolean;
  showStatsPanel: boolean;
  showStylePanel: boolean;
  showNodeEditor: boolean;
  isDarkMode: boolean;

  // ─── Viewport ─────────────────────────────────────────────
  viewport: Viewport;

  // ─── Canvas Config ────────────────────────────────────────
  canvasConfig: CanvasConfig;

  // ─── Undo / Redo ─────────────────────────────────────────
  undoStack: UndoableAction[];
  redoStack: UndoableAction[];

  // ─── Loading & Errors ─────────────────────────────────────
  isLoading: boolean;
  cycleNodes: string[];

  // ─── Actions ─────────────────────────────────────────────
  setTrees: (trees: FamilyTree[]) => void;
  setActiveTreeId: (id: string | null) => void;
  setNodes: (nodes: FamilyNode[]) => void;
  upsertNode: (node: FamilyNode) => void;
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  updateMultipleNodePositions: (positions: Array<{ id: string; x: number; y: number }>) => void;
  saveMultipleNodePositions: (positions: Array<{ id: string; x: number; y: number }>) => Promise<void>;
  
  setSelectedNodeId: (id: string | null, multi?: boolean) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  clearSelection: () => void;
  setHoveredNodeId: (id: string | null) => void;
  setReferenceNodeId: (id: string | null) => void;
  
  toggleNodeLanguage: (nodeId: string) => void;
  setLightboxPhotoUrl: (url: string | null) => void;
  
  // Cut, Copy, Paste & Delete
  copySelectedNode: () => void;
  pasteCopiedNode: () => Promise<FamilyNode | null>;
  copySelectedNodes: () => void;
  cutSelectedNodes: () => void;
  pasteClipboardNodes: () => Promise<FamilyNode[]>;
  deleteSelectedNodes: () => Promise<void>;
  
  connectNodes: (sourceId: string, targetId: string) => Promise<void>;
  autoSaveNode: (node: FamilyNode) => Promise<void>;
  updateNodePhoto: (nodeId: string, photoBase64: string) => Promise<void>;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved' | 'error') => void;

  // Trees Management
  fetchAllTrees: () => Promise<FamilyTree[]>;
  createNewTree: (name: string, description?: string) => Promise<FamilyTree | null>;
  switchActiveTree: (treeId: string) => Promise<void>;
  deleteActiveTree: (treeId: string) => Promise<boolean>;

  toggleEditMode: () => void;
  toggleGujaratiMode: () => void;
  toggleSearch: () => void;
  setLeftSidebarTab: (tab: 'layers' | 'search' | 'export' | null) => void;
  setInspectorTab: (tab: 'properties' | 'kinship' | 'inlaws' | 'style') => void;
  setShowInspector: (b: boolean) => void;
  toggleTimeline: () => void;
  toggleMinimap: () => void;
  togglePhotoEditor: () => void;
  toggleStatsPanel: () => void;
  toggleStylePanel: () => void;
  toggleNodeEditor: () => void;
  toggleDarkMode: () => void;
  
  setViewport: (vp: Partial<Viewport>) => void;
  setCanvasConfig: (cfg: Partial<CanvasConfig>) => void;
  setGridType: (g: GridType) => void;
  setEdgeStyle: (e: EdgeStyle) => void;
  setDefaultNodeShape: (s: NodeShape) => void;
  toggleSnapToGrid: () => void;
  toggleGhostSuggestions: () => void;

  pushUndo: (action: UndoableAction) => void;
  undo: () => void;
  redo: () => void;

  setIsLoading: (b: boolean) => void;
  setCycleNodes: (ids: string[]) => void;

  // ─── In-Laws & Subtree Toggles ───────────────────────────
  toggleInLawsBranch: (nodeId: string) => void;
  addInLawRelative: (
    targetNodeId: string,
    role: 'sasu' | 'sasara' | 'der' | 'jeth' | 'nanand' | 'saalo' | 'saali' | 'patala-sasu'
  ) => Promise<FamilyNode | null>;
  promoteGhostNode: (ghost: GhostNode) => Promise<FamilyNode | null>;
  collapseSubtree: (rootId: string) => void;
  expandSubtree: (rootId: string) => void;
}

export const useTreeStore = create<TreeStore>()((set, get) => ({
  trees: [],
  activeTreeId: null,
  nodes: [],
  selectedNodeId: null,
  selectedNodeIds: [],
  hoveredNodeId: null,
  referenceNodeId: null,

  clipboardNodes: [],
  isClipboardCut: false,
  saveStatus: 'saved',

  flippedLanguageNodeIds: new Set<string>(),
  lightboxPhotoUrl: null,
  copiedNode: null,

  isEditMode: false,
  showNameInGujarati: true,
  leftSidebarTab: 'layers',
  showInspector: true,
  inspectorTab: 'properties',
  showTimeline: false,
  showMinimap: true,
  showPhotoEditor: false,
  showStatsPanel: false,
  showStylePanel: false,
  showNodeEditor: false,
  isDarkMode: false,

  viewport: { x: 0, y: 0, scale: 0.9, width: 1200, height: 800 },
  canvasConfig: {
    gridType: 'dots',
    snapToGrid: false,
    gridSize: 28,
    edgeStyle: 'curved',
    showMinimap: true,
    isEditMode: false,
    showGhostSuggestions: true,
    showInLawBranches: true,
  },

  undoStack: [],
  redoStack: [],
  isLoading: false,
  cycleNodes: [],

  setTrees: trees => {
    set({ trees });
    saveToLocal('trees', trees);
  },
  setActiveTreeId: id => {
    set({ activeTreeId: id });
    if (id) saveToLocal('active_tree_id', id);
  },
  setNodes: nodes => {
    set({ nodes });
    const { activeTreeId } = get();
    if (activeTreeId) saveToLocal(`nodes_${activeTreeId}`, nodes);
  },

  upsertNode: node =>
    set(s => {
      const exists = s.nodes.some(n => n._id === node._id);
      const nextNodes = exists
        ? s.nodes.map(n => (n._id === node._id ? { ...n, ...node } : n))
        : [...s.nodes, node];
      if (s.activeTreeId) saveToLocal(`nodes_${s.activeTreeId}`, nextNodes);
      return { nodes: nextNodes };
    }),

  removeNode: id =>
    set(s => {
      const nextNodes = s.nodes.filter(n => n._id !== id);
      const nextSelected = s.selectedNodeIds.filter(i => i !== id);
      if (s.activeTreeId) saveToLocal(`nodes_${s.activeTreeId}`, nextNodes);
      return {
        nodes: nextNodes,
        selectedNodeIds: nextSelected,
        selectedNodeId: s.selectedNodeId === id ? (nextSelected[0] ?? null) : s.selectedNodeId,
      };
    }),

  updateNodePosition: (id, x, y) =>
    set(s => ({
      nodes: s.nodes.map(n => (n._id === id ? { ...n, position: { x, y } } : n)),
    })),

  updateMultipleNodePositions: updates => {
    const updateMap = new Map(updates.map(u => [u.id, { x: u.x, y: u.y }]));
    set(s => ({
      nodes: s.nodes.map(n => {
        const pos = updateMap.get(n._id);
        return pos ? { ...n, position: pos } : n;
      }),
    }));
  },

  saveMultipleNodePositions: async updates => {
    const { activeTreeId, nodes } = get();
    set({ saveStatus: 'saving' });
    if (activeTreeId) {
      saveToLocal(`nodes_${activeTreeId}`, nodes);
    }
    try {
      await Promise.allSettled(
        updates.map(u =>
          fetch(`/api/nodes/${u.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: { x: u.x, y: u.y } }),
          })
        )
      );
      set({ saveStatus: 'saved' });
    } catch {
      set({ saveStatus: 'saved' });
    }
  },

  setSelectedNodeId: (id, multi = false) => {
    if (!id) {
      set({ selectedNodeId: null, selectedNodeIds: [] });
      return;
    }
    if (multi) {
      set(s => {
        const exists = s.selectedNodeIds.includes(id);
        const next = exists
          ? s.selectedNodeIds.filter(i => i !== id)
          : [...s.selectedNodeIds, id];
        return {
          selectedNodeIds: next,
          selectedNodeId: next[next.length - 1] ?? null,
        };
      });
    } else {
      set({ selectedNodeId: id, selectedNodeIds: [id] });
    }
  },

  setSelectedNodeIds: ids => {
    set({
      selectedNodeIds: ids,
      selectedNodeId: ids[ids.length - 1] ?? null,
    });
  },

  clearSelection: () => set({ selectedNodeId: null, selectedNodeIds: [] }),
  setHoveredNodeId: id => set({ hoveredNodeId: id }),
  setReferenceNodeId: id => set({ referenceNodeId: id }),

  // ─── Language Flip for Specific Node (Gujarati <-> English) ─
  toggleNodeLanguage: (nodeId: string) => {
    set(s => {
      const nextSet = new Set(s.flippedLanguageNodeIds);
      if (nextSet.has(nodeId)) {
        nextSet.delete(nodeId);
      } else {
        nextSet.add(nodeId);
      }
      return { flippedLanguageNodeIds: nextSet };
    });
  },

  setLightboxPhotoUrl: url => set({ lightboxPhotoUrl: url }),

  // ─── Multi-Cut, Multi-Copy, Multi-Paste & Delete ─────────
  copySelectedNode: () => {
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return;
    const node = nodes.find(n => n._id === selectedNodeId);
    if (node) {
      set({ copiedNode: { ...node }, clipboardNodes: [{ ...node }], isClipboardCut: false });
    }
  },

  copySelectedNodes: () => {
    const { nodes, selectedNodeIds, selectedNodeId } = get();
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    if (!ids.length) return;
    const targetNodes = nodes.filter(n => ids.includes(n._id));
    set({
      clipboardNodes: targetNodes.map(n => ({ ...n })),
      copiedNode: targetNodes[0] ? { ...targetNodes[0] } : null,
      isClipboardCut: false,
    });
  },

  cutSelectedNodes: async () => {
    const { nodes, selectedNodeIds, selectedNodeId, activeTreeId, removeNode, pushUndo } = get();
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    if (!ids.length) return;
    const targetNodes = nodes.filter(n => ids.includes(n._id));
    set({
      clipboardNodes: targetNodes.map(n => ({ ...n })),
      copiedNode: targetNodes[0] ? { ...targetNodes[0] } : null,
      isClipboardCut: true,
      selectedNodeIds: [],
      selectedNodeId: null,
      saveStatus: 'saving',
    });

    for (const n of targetNodes) {
      removeNode(n._id);
      fetch(`/api/nodes/${n._id}`, { method: 'DELETE' }).catch(console.error);
    }
    if (activeTreeId) {
      saveToLocal(`nodes_${activeTreeId}`, get().nodes);
    }
    set({ saveStatus: 'saved' });
  },

  pasteClipboardNodes: async () => {
    const { clipboardNodes, isClipboardCut, nodes, activeTreeId, upsertNode, setSelectedNodeIds } = get();
    if (!clipboardNodes.length || !activeTreeId) return [];

    set({ saveStatus: 'saving' });
    const newNodes: FamilyNode[] = [];
    const idMap = new Map<string, string>();

    for (const orig of clipboardNodes) {
      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      idMap.set(orig._id, newId);
    }

    for (const orig of clipboardNodes) {
      const newId = idMap.get(orig._id)!;
      const basePos = findNearestFreePosition(orig.position.x + 60, orig.position.y + 60, [...nodes, ...newNodes]);

      const cloned: FamilyNode = {
        ...orig,
        _id: newId,
        treeId: activeTreeId,
        nameGujarati: isClipboardCut ? orig.nameGujarati : `${orig.nameGujarati} (નકલ)`,
        nameEnglish: isClipboardCut ? orig.nameEnglish : `${orig.nameEnglish} (Copy)`,
        position: basePos,
        parentIds: orig.parentIds.map(pid => idMap.get(pid) || pid).filter(pid => idMap.has(pid) || nodes.some(n => n._id === pid)),
        childIds: orig.childIds.map(cid => idMap.get(cid) || cid).filter(cid => idMap.has(cid) || nodes.some(n => n._id === cid)),
        spouseIds: orig.spouseIds.map(sid => idMap.get(sid) || sid).filter(sid => idMap.has(sid) || nodes.some(n => n._id === sid)),
        inLawNodeIds: (orig.inLawNodeIds || []).map(lid => idMap.get(lid) || lid),
      };

      newNodes.push(cloned);
    }

    for (const n of newNodes) {
      upsertNode(n);
    }

    setSelectedNodeIds(newNodes.map(n => n._id));
    saveToLocal(`nodes_${activeTreeId}`, [...nodes, ...newNodes]);
    set({ isClipboardCut: false });

    try {
      await Promise.allSettled(
        newNodes.map(n =>
          fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n),
          })
        )
      );
      set({ saveStatus: 'saved' });
    } catch {
      set({ saveStatus: 'saved' });
    }

    return newNodes;
  },

  deleteSelectedNodes: async () => {
    const { nodes, selectedNodeIds, selectedNodeId, removeNode, activeTreeId } = get();
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    if (!ids.length) return;
    set({ saveStatus: 'saving' });

    for (const id of ids) {
      removeNode(id);
      fetch(`/api/nodes/${id}`, { method: 'DELETE' }).catch(console.error);
    }
    set({ selectedNodeIds: [], selectedNodeId: null, saveStatus: 'saved' });
    if (activeTreeId) {
      saveToLocal(`nodes_${activeTreeId}`, get().nodes);
    }
  },

  pasteCopiedNode: async () => {
    const results = await get().pasteClipboardNodes();
    return results[0] ?? null;
  },

  // ─── Auto-Save Node ──────────────────────────────────────
  autoSaveNode: async (node: FamilyNode) => {
    const { activeTreeId, nodes } = get();
    set({ saveStatus: 'saving' });
    if (activeTreeId) {
      saveToLocal(`nodes_${activeTreeId}`, nodes);
    }
    try {
      await fetch(`/api/nodes/${node._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });
      set({ saveStatus: 'saved' });
    } catch {
      set({ saveStatus: 'saved' });
    }
  },

  updateNodePhoto: async (nodeId: string, photoBase64: string) => {
    const { nodes, activeTreeId } = get();
    const node = nodes.find(n => n._id === nodeId);
    if (!node) return;

    const updatedNode = { ...node, photo: photoBase64 };
    const nextNodes = nodes.map(n => (n._id === nodeId ? updatedNode : n));

    set({ nodes: nextNodes, saveStatus: 'saving' });

    if (activeTreeId) {
      saveToLocal(`nodes_${activeTreeId}`, nextNodes);
    }

    try {
      await fetch(`/api/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: photoBase64 }),
      });
      set({ saveStatus: 'saved' });
    } catch {
      set({ saveStatus: 'saved' });
    }
  },

  setSaveStatus: s => set({ saveStatus: s }),

  // ─── Multi-Tree Management ───────────────────────────────
  fetchAllTrees: async () => {
    try {
      const res = await fetch('/api/trees');
      const data = await res.json();
      let serverTrees: FamilyTree[] = data.success ? data.data : [];
      const localCachedTrees = loadFromLocal<FamilyTree[]>('trees') || [];

      const treeMap = new Map<string, FamilyTree>();
      for (const t of localCachedTrees) treeMap.set(t._id, t);
      for (const t of serverTrees) treeMap.set(t._id, t);

      const all = Array.from(treeMap.values());
      set({ trees: all });
      saveToLocal('trees', all);
      return all;
    } catch {
      const localCachedTrees = loadFromLocal<FamilyTree[]>('trees') || [];
      set({ trees: localCachedTrees });
      return localCachedTrees;
    }
  },

  createNewTree: async (name, description = 'Family Tree Workspace') => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    set({ saveStatus: 'saving' });
    try {
      const res = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, description }),
      });
      const data = await res.json();
      const created: FamilyTree = data.success && data.data
        ? { ...data.data, _id: String(data.data._id) }
        : {
            _id: `tree-${Date.now()}`,
            name: trimmed,
            description,
            nodeCount: 0,
            edgeStyle: 'curved',
            gridType: 'dots',
            snapToGrid: false,
            defaultNodeShape: 'rounded-card',
          };

      const updatedTrees = [created, ...get().trees.filter(t => t._id !== created._id)];
      set({
        trees: updatedTrees,
        activeTreeId: created._id,
        nodes: [],
        selectedNodeIds: [],
        selectedNodeId: null,
        saveStatus: 'saved',
      });

      saveToLocal('trees', updatedTrees);
      saveToLocal(`nodes_${created._id}`, []);
      saveToLocal('active_tree_id', created._id);

      return created;
    } catch (err) {
      console.error('Failed to create tree:', err);
      set({ saveStatus: 'error' });
      return null;
    }
  },

  switchActiveTree: async (treeId: string) => {
    const { activeTreeId, nodes } = get();
    if (activeTreeId) {
      saveToLocal(`nodes_${activeTreeId}`, nodes);
    }

    set({ activeTreeId: treeId, isLoading: true, selectedNodeIds: [], selectedNodeId: null });
    saveToLocal('active_tree_id', treeId);

    const cachedNodes = loadFromLocal<FamilyNode[]>(`nodes_${treeId}`);
    if (cachedNodes && cachedNodes.length > 0) {
      set({ nodes: cachedNodes, isLoading: false });
    }

    try {
      const res = await fetch(`/api/nodes?treeId=${treeId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const existingNodeMap = new Map((cachedNodes || []).map(n => [n._id, n]));
        const mergedNodes: FamilyNode[] = data.data.map((n: FamilyNode & { _id: { toString: () => string } }) => {
          const idStr = n._id ? n._id.toString() : '';
          const localNode = existingNodeMap.get(idStr);
          return {
            ...n,
            _id: idStr,
            // Preserve locally saved photo if server returned empty string
            photo: n.photo || localNode?.photo || '',
          };
        });
        set({ nodes: mergedNodes, isLoading: false });
        saveToLocal(`nodes_${treeId}`, mergedNodes);
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  deleteActiveTree: async (treeId: string) => {
    try {
      await fetch(`/api/trees/${treeId}`, { method: 'DELETE' });
    } catch {}
    const remaining = get().trees.filter(t => t._id !== treeId);
    set({ trees: remaining });
    saveToLocal('trees', remaining);
    if (get().activeTreeId === treeId) {
      const nextId = remaining[0]?._id || 'patel-vanshavali-default';
      await get().switchActiveTree(nextId);
    }
    return true;
  },

  // ─── Interactive Drag & Connect Two Nodes ────────────────
  connectNodes: async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const { nodes, upsertNode } = get();
    const src = nodes.find(n => n._id === sourceId);
    const tgt = nodes.find(n => n._id === targetId);
    if (!src || !tgt) return;

    // Connect as Parent (src) -> Child (tgt)
    const updatedSrc: FamilyNode = {
      ...src,
      childIds: [...new Set([...src.childIds, tgt._id])],
    };
    const updatedTgt: FamilyNode = {
      ...tgt,
      parentIds: [...new Set([...tgt.parentIds, src._id])],
    };

    upsertNode(updatedSrc);
    upsertNode(updatedTgt);

    await Promise.allSettled([
      fetch(`/api/nodes/${src._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childIds: updatedSrc.childIds }),
      }),
      fetch(`/api/nodes/${tgt._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentIds: updatedTgt.parentIds }),
      }),
    ]);
  },

  toggleEditMode: () =>
    set(s => {
      const nextMode = !s.isEditMode;
      return {
        isEditMode: nextMode,
        canvasConfig: { ...s.canvasConfig, isEditMode: nextMode },
      };
    }),

  toggleGujaratiMode: () => set(s => ({ showNameInGujarati: !s.showNameInGujarati })),
  toggleSearch: () => set(s => ({ leftSidebarTab: s.leftSidebarTab === 'search' ? null : 'search' })),
  setLeftSidebarTab: tab => set(s => ({ leftSidebarTab: s.leftSidebarTab === tab ? null : tab })),
  setInspectorTab: tab => set({ inspectorTab: tab }),
  setShowInspector: b => set({ showInspector: b }),
  toggleTimeline: () => set(s => ({ showTimeline: !s.showTimeline })),
  toggleMinimap: () => set(s => ({ showMinimap: !s.showMinimap })),
  togglePhotoEditor: () => set(s => ({ showPhotoEditor: !s.showPhotoEditor })),
  toggleStatsPanel: () => set(s => ({ showStatsPanel: !s.showStatsPanel })),
  toggleStylePanel: () => set(s => ({ showStylePanel: !s.showStylePanel })),
  toggleNodeEditor: () => set(s => ({ showNodeEditor: !s.showNodeEditor })),
  toggleDarkMode: () => set(s => ({ isDarkMode: !s.isDarkMode })),

  setViewport: vp => set(s => ({ viewport: { ...s.viewport, ...vp } })),
  setCanvasConfig: cfg => set(s => ({ canvasConfig: { ...s.canvasConfig, ...cfg } })),
  setGridType: g => set(s => ({ canvasConfig: { ...s.canvasConfig, gridType: g } })),
  setEdgeStyle: e => set(s => ({ canvasConfig: { ...s.canvasConfig, edgeStyle: e } })),

  setDefaultNodeShape: shape => {
    const activeId = get().activeTreeId;
    set(s => ({
      trees: s.trees.map(t =>
        t._id === activeId ? { ...t, defaultNodeShape: shape } : t
      ),
    }));
  },

  toggleSnapToGrid: () =>
    set(s => ({ canvasConfig: { ...s.canvasConfig, snapToGrid: !s.canvasConfig.snapToGrid } })),

  toggleGhostSuggestions: () =>
    set(s => ({
      canvasConfig: {
        ...s.canvasConfig,
        showGhostSuggestions: !s.canvasConfig.showGhostSuggestions,
      },
    })),

  pushUndo: action =>
    set(s => {
      const stack = [...s.undoStack, action];
      if (stack.length > MAX_UNDO_STEPS) stack.shift();
      return { undoStack: stack, redoStack: [] };
    }),

  undo: () =>
    set(s => {
      if (!s.undoStack.length) return {};
      const stack = [...s.undoStack];
      const action = stack.pop()!;
      let nodes = s.nodes;
      if (action.type === 'MOVE_NODE') {
        const before = action.before as Partial<FamilyNode> & { _id: string };
        nodes = s.nodes.map(n =>
          n._id === before._id && before.position
            ? { ...n, position: before.position }
            : n
        );
      }
      return { undoStack: stack, redoStack: [...s.redoStack, action], nodes };
    }),

  redo: () =>
    set(s => {
      if (!s.redoStack.length) return {};
      const rstack = [...s.redoStack];
      const action = rstack.pop()!;
      let nodes = s.nodes;
      if (action.type === 'MOVE_NODE') {
        const after = action.after as Partial<FamilyNode> & { _id: string };
        nodes = s.nodes.map(n =>
          n._id === after._id && after.position
            ? { ...n, position: after.position }
            : n
        );
      }
      return { redoStack: rstack, undoStack: [...s.undoStack, action], nodes };
    }),

  setIsLoading: b => set({ isLoading: b }),
  setCycleNodes: ids => set({ cycleNodes: ids }),

  // ─── In-Laws Branch Toggle ───────────────────────────────
  toggleInLawsBranch: (nodeId: string) => {
    const node = get().nodes.find(n => n._id === nodeId);
    if (!node) return;

    const newHiddenState = !(node.inLawsHidden ?? true);
    const inLawIds = new Set(node.inLawNodeIds || []);

    set(s => ({
      nodes: s.nodes.map(n => {
        if (n._id === nodeId) {
          return { ...n, inLawsHidden: newHiddenState };
        }
        if (inLawIds.has(n._id)) {
          return { ...n, hidden: newHiddenState };
        }
        return n;
      }),
    }));

    // Persist node flag
    fetch(`/api/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inLawsHidden: newHiddenState }),
    }).catch(console.error);
  },

  // ─── Add In-Law Relative (1-Click) ───────────────────────
  addInLawRelative: async (targetNodeId, role) => {
    const { nodes, activeTreeId, upsertNode, pushUndo } = get();
    const targetNode = nodes.find(n => n._id === targetNodeId);
    if (!targetNode || !activeTreeId) return null;

    const roleConfig = {
      sasara: { gu: 'સસરાજી', en: 'Father-in-law', gender: 'male' as const, dy: -140, dx: -90 },
      sasu: { gu: 'સાસુજી', en: 'Mother-in-law', gender: 'female' as const, dy: -140, dx: 90 },
      'patala-sasu': { gu: 'પાટલા સાસુ', en: 'Patala Sasu', gender: 'female' as const, dy: -140, dx: 220 },
      jeth: { gu: 'જેઠજી', en: 'Jeth (Elder Bro-in-law)', gender: 'male' as const, dy: -50, dx: 200 },
      der: { gu: 'દિયર / દેર', en: 'Der (Younger Bro-in-law)', gender: 'male' as const, dy: 50, dx: 200 },
      nanand: { gu: 'નણંદ', en: 'Nanand (Sister-in-law)', gender: 'female' as const, dy: 120, dx: 200 },
      saalo: { gu: 'સાળો', en: 'Saalo (Bro-in-law)', gender: 'male' as const, dy: 0, dx: 210 },
      saali: { gu: 'સાળી', en: 'Saali (Sister-in-law)', gender: 'female' as const, dy: 80, dx: 210 },
    }[role];

    const freePos = findNearestFreePosition(
      targetNode.position.x + roleConfig.dx,
      targetNode.position.y + roleConfig.dy,
      nodes
    );

    const newNodePayload: Partial<FamilyNode> = {
      treeId: activeTreeId,
      nameGujarati: roleConfig.gu,
      nameEnglish: roleConfig.en,
      gender: roleConfig.gender,
      kinshipTitle: roleConfig.gu,
      branchType: 'in-law',
      hidden: false,
      parentIds: [],
      childIds: [],
      spouseIds: [],
      position: freePos,
      style: {
        shape: 'rounded-card',
        accentColor: '#8B5CF6',
        borderColor: '#C4B5FD',
        bgColor: roleConfig.gender === 'female' ? '#FDF4FF' : '#F5F3FF',
      },
    };

    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNodePayload),
      });
      const data = await res.json();
      if (!data.success) return null;

      const createdNode: FamilyNode = { ...data.data, _id: data.data._id.toString() };
      upsertNode(createdNode);

      // Link to targetNode's inLawNodeIds
      const currentInLaws = targetNode.inLawNodeIds || [];
      const updatedInLaws = [...new Set([...currentInLaws, createdNode._id])];
      
      const updatedTarget: FamilyNode = {
        ...targetNode,
        inLawNodeIds: updatedInLaws,
        inLawsHidden: false, // reveal branch
      };
      upsertNode(updatedTarget);

      // Persist target link
      fetch(`/api/nodes/${targetNode._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inLawNodeIds: updatedInLaws, inLawsHidden: false }),
      }).catch(console.error);

      pushUndo({
        type: 'ADD_NODE',
        before: targetNode,
        after: updatedTarget,
        timestamp: Date.now(),
      });

      return createdNode;
    } catch (err) {
      console.error('Failed to add in-law:', err);
      return null;
    }
  },

  // ─── Promote Ghost Node to Real Node (Non-Overlapping Placement) ───
  promoteGhostNode: async (ghost: GhostNode) => {
    const { nodes, activeTreeId, upsertNode, setSelectedNodeId } = get();
    const target = nodes.find(n => n._id === ghost.targetNodeId);
    if (!target || !activeTreeId) return null;

    // Use smart nearest free position to avoid overlapping existing cards
    const freePos = findNearestFreePosition(ghost.position.x, ghost.position.y, nodes);

    const payload: Partial<FamilyNode> = {
      treeId: activeTreeId,
      nameGujarati: ghost.labelGujarati,
      nameEnglish: ghost.labelEnglish,
      gender: ghost.gender,
      branchType: ghost.branchType,
      position: freePos,
      parentIds: ghost.relationType === 'child' ? [target._id] : [],
      childIds: ghost.relationType === 'father' || ghost.relationType === 'mother' ? [target._id] : [],
      spouseIds: ghost.relationType === 'spouse' ? [target._id] : [],
      inLawNodeIds: [],
    };

    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) return null;

      const created: FamilyNode = { ...data.data, _id: data.data._id.toString() };
      upsertNode(created);

      // Reciprocal link on target
      let updatedTarget = { ...target };
      if (ghost.relationType === 'father' || ghost.relationType === 'mother') {
        updatedTarget.parentIds = [...new Set([...target.parentIds, created._id])];
      } else if (ghost.relationType === 'child') {
        updatedTarget.childIds = [...new Set([...target.childIds, created._id])];
      } else if (ghost.relationType === 'spouse') {
        updatedTarget.spouseIds = [...new Set([...target.spouseIds, created._id])];
      }
      upsertNode(updatedTarget);

      // Persist reciprocal link
      fetch(`/api/nodes/${target._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTarget),
      }).catch(console.error);

      setSelectedNodeId(created._id);
      return created;
    } catch (err) {
      console.error('Failed to promote ghost node:', err);
      return null;
    }
  },

  collapseSubtree: rootId => {
    const nodeMap = new Map(get().nodes.map(n => [n._id, n]));
    const idsToHide = new Set<string>();

    const collapse = (id: string) => {
      const n = nodeMap.get(id);
      if (!n) return;
      for (const cid of n.childIds) {
        idsToHide.add(cid);
        collapse(cid);
      }
    };
    collapse(rootId);

    set(s => ({
      nodes: s.nodes.map(n => {
        if (n._id === rootId) return { ...n, collapsed: true };
        if (idsToHide.has(n._id)) return { ...n, hidden: true };
        return n;
      }),
    }));
  },

  expandSubtree: rootId => {
    const nodeMap = new Map(get().nodes.map(n => [n._id, n]));
    const idsToShow = new Set<string>();

    const expand = (id: string) => {
      const n = nodeMap.get(id);
      if (!n) return;
      for (const cid of n.childIds) {
        idsToShow.add(cid);
        expand(cid);
      }
    };
    expand(rootId);

    set(s => ({
      nodes: s.nodes.map(n => {
        if (n._id === rootId) return { ...n, collapsed: false };
        if (idsToShow.has(n._id)) return { ...n, hidden: false };
        return n;
      }),
    }));
  },
}));
