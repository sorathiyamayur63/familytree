// ============================================================
// Family Tree App — Core Type Definitions
// ============================================================

export type Gender = 'male' | 'female' | 'other';

export type NodeShape = 'rounded-card' | 'circle' | 'badge' | 'minimal-pill';

export type EdgeStyle = 'curved' | 'step' | 'straight' | 'zigzag';

export type RelationType = 'parent-child' | 'spouse' | 'in-law' | 'mosal';

export type GridType = 'dots' | 'lines' | 'cross' | 'none';

export type ZoomLevel = 'macro' | 'medium' | 'detail';

export type BranchType = 'main' | 'in-law' | 'mosal';

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
  accentColor?: string;
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
  notes?: string;
  
  // ─── Advanced In-Law & Branch Support ───────────────────────
  branchType?: BranchType;           // 'main' (Patrilineal), 'in-law' (સાસરી), 'mosal' (મોસાળ)
  inLawsHidden?: boolean;            // Whether in-law branch is collapsed/hidden by default
  inLawNodeIds?: string[];           // IDs of in-law relatives connected to this node
  kinshipTitle?: string;             // Custom kinship title override (e.g. 'પાટલા સાસુ', 'મોટાબાપા')
  
  metadata?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Ghost / Suggestion Node ─────────────────────────────────

export interface GhostNode {
  id: string;
  targetNodeId: string;
  relationType: 'father' | 'mother' | 'spouse' | 'child' | 'in-laws';
  labelGujarati: string;
  labelEnglish: string;
  position: NodePosition;
  gender: Gender;
  branchType: BranchType;
}

// ─── Edge / Connection ────────────────────────────────────────

export interface FamilyEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  style?: EdgeStyle;
  isGhost?: boolean;
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
  rootNodeId?: string;
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

// ─── Canvas Config ────────────────────────────────────────────

export interface CanvasConfig {
  gridType: GridType;
  snapToGrid: boolean;
  gridSize: number;
  edgeStyle: EdgeStyle;
  showMinimap: boolean;
  isEditMode: boolean;
  showGhostSuggestions: boolean;
  showInLawBranches: boolean;
}

// ─── Kinship Calculation Result ───────────────────────────────

export interface KinshipResult {
  termGujarati: string;        // e.g. "પાટલા સાસુ", "કાકા", "મામા"
  termPhonetic: string;        // e.g. "Patala Sasu", "Kaka", "Mama"
  termEnglish: string;         // e.g. "Senior Mother-in-law / Husband's elder brother's wife"
  descriptionGujarati: string; // e.g. "પતિની વડીલ ભાભી અથવા વડીલ સાસુ સમાન"
  category: 'paternal' | 'maternal' | 'in-law' | 'direct' | 'sibling' | 'extended' | 'unrelated';
  generationDiff: number;      // 0 = same gen, +1 = 1 gen older, -1 = 1 gen younger
  path: string[];              // node ids connecting from to to
  pathExplanation?: string;    // Human-readable path description
}

// ─── Search ──────────────────────────────────────────────────

export interface SearchResult {
  nodeId: string;
  score: number;
  matchField: 'nameGujarati' | 'nameEnglish' | 'metadata';
}

// ─── Undo / Redo ─────────────────────────────────────────────

export type ActionType =
  | 'MOVE_NODE'
  | 'ADD_NODE'
  | 'DELETE_NODE'
  | 'UPDATE_NODE'
  | 'TOGGLE_IN_LAWS'
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
  inLawCount: number;
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
