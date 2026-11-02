// ============================================================
// Family Tree App — Core Type Definitions
// ============================================================

export type Gender = 'male' | 'female' | 'other';

export type NodeShape = 'circle' | 'rounded-card' | 'badge';

export type EdgeStyle = 'straight' | 'step' | 'curved' | 'zigzag';

export type RelationType = 'parent-child' | 'spouse';

export type GridType = 'none' | 'dots' | 'lines' | 'cross';

export type ZoomLevel = 'macro' | 'medium' | 'detail';

// ─── Node ────────────────────────────────────────────────────

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeStyle {
  bgColor?: string;
  borderColor?: string;
  shape?: NodeShape;
  photoMask?: 'circle' | 'square';
}

export interface FamilyNode {
  _id: string;
  treeId: string;
  nameGujarati: string;
  nameEnglish: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  photo?: string; // base64 or URL
  parentIds: string[];
  spouseIds: string[];
  childIds: string[];
  position: NodePosition;
  style?: NodeStyle;
  collapsed?: boolean;
  hidden?: boolean;
  generation?: number;
  metadata?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Edge / Connection ────────────────────────────────────────

export interface FamilyEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  style?: EdgeStyle;
}

// ─── Tree ────────────────────────────────────────────────────

export interface FamilyTree {
  _id: string;
  name: string;
  description?: string;
  edgeStyle: EdgeStyle;
  gridType: GridType;
  snapToGrid: boolean;
  defaultNodeShape: NodeShape;
  backgroundColor?: string;
  nodeCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Viewport ────────────────────────────────────────────────

export interface Viewport {
  x: number;       // pan offset X
  y: number;       // pan offset Y
  scale: number;   // zoom factor (1.0 = 100%)
  width: number;   // canvas width px
  height: number;  // canvas height px
}

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ─── Canvas Engine ────────────────────────────────────────────

export interface CanvasConfig {
  gridType: GridType;
  snapToGrid: boolean;
  gridSize: number;
  edgeStyle: EdgeStyle;
  showMinimap: boolean;
  isEditMode: boolean;
}

// ─── Search ──────────────────────────────────────────────────

export interface SearchResult {
  nodeId: string;
  score: number;
  matchField: 'nameGujarati' | 'nameEnglish' | 'metadata';
}

// ─── Relationship Calculation ─────────────────────────────────

export interface RelationshipResult {
  label: string;
  labelGujarati?: string;
  generationDiff: number;
  path: string[];
}

// ─── Undo / Redo ─────────────────────────────────────────────

export type ActionType =
  | 'MOVE_NODE'
  | 'ADD_NODE'
  | 'DELETE_NODE'
  | 'UPDATE_NODE'
  | 'ADD_EDGE'
  | 'DELETE_EDGE'
  | 'COLLAPSE_SUBTREE'
  | 'EXPAND_SUBTREE';

export interface UndoableAction {
  type: ActionType;
  before: Partial<FamilyNode> | Partial<FamilyNode>[];
  after: Partial<FamilyNode> | Partial<FamilyNode>[];
  timestamp: number;
}

// ─── API Responses ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Statistics ──────────────────────────────────────────────

export interface TreeStats {
  totalNodes: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  generationDepth: number;
  avgLifespan: number | null;
  oldestPerson: FamilyNode | null;
  youngestPerson: FamilyNode | null;
}

// ─── Export / Import ─────────────────────────────────────────

export interface ExportData {
  version: string;
  exportedAt: string;
  tree: FamilyTree;
  nodes: FamilyNode[];
}
