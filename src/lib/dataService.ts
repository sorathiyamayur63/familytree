// ============================================================
// DataService.ts — Resilient Data Layer with MongoDB & Local Fallback
// Guarantees zero 500 crashes even if MongoDB DNS/Atlas is unreachable.
// ============================================================
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import Tree from './models/Tree';
import NodeModel from './models/Node';
import type { FamilyNode } from '@/types';




const MONGODB_URI = process.env.MONGODB_URI || '';

let isMongoAvailable: boolean | null = null;

async function checkOrConnectMongo(): Promise<boolean> {
  if (isMongoAvailable === true && mongoose.connection.readyState === 1) {
    return true;
  }
  if (!MONGODB_URI) {
    isMongoAvailable = false;
    return false;
  }
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 2500, // Short timeout to prevent UI freezes
      });
    }
    isMongoAvailable = mongoose.connection.readyState === 1;
    return isMongoAvailable;
  } catch (err) {
    console.warn('[DataService] MongoDB Atlas unreachable. Using resilient local fallback.', (err as Error).message);
    isMongoAvailable = false;
    return false;
  }
}

// ─── Default Authentic Gujarati Demo Data ───────────────────────

export const DEFAULT_TREE_ID = 'patel-vanshavali-default';

export const DEFAULT_DEMO_TREE = {
  _id: DEFAULT_TREE_ID,
  name: 'પટેલ પરિવાર વંશાવળી (Patel Vanshavali)',
  description: 'સૂરત - બારડોલી વંશાવળી સહિત સાસરી પક્ષ તથા મોસાળ શાખાઓ',
  nodeCount: 18,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_DEMO_NODES: FamilyNode[] = [
  // ─── Gen 1: Grandparents (વડીલો) ───────────────────────────
  {
    _id: 'dada1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'ભૂલાભાઈ પટેલ',
    nameEnglish: 'Bhulabhai Patel',
    gender: 'male',
    generation: 1,
    branchType: 'main',
    kinshipTitle: 'દાદા (Grandfather)',
    birthDate: '1895-04-10',
    deathDate: '1972-11-20',
    position: { x: 0, y: -260 },
    parentIds: [],
    childIds: ['motabapa1', 'pita1', 'kaka1', 'fai1'],
    spouseIds: ['dadi1'],
  },
  {
    _id: 'dadi1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'જમનાબેન પટેલ',
    nameEnglish: 'Jamnaben Patel',
    gender: 'female',
    generation: 1,
    branchType: 'main',
    kinshipTitle: 'દાદી (Grandmother)',
    birthDate: '1900-08-15',
    deathDate: '1980-02-14',
    position: { x: 220, y: -260 },
    parentIds: [],
    childIds: ['motabapa1', 'pita1', 'kaka1', 'fai1'],
    spouseIds: ['dada1'],
  },

  // ─── Gen 2: Motabapa & Motiba ──────────────────────────────
  {
    _id: 'motabapa1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'ચીમનલાલ પટેલ',
    nameEnglish: 'Chimanlal Patel',
    gender: 'male',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'મોટાબાપા (Elder Uncle)',
    birthDate: '1922-01-05',
    position: { x: -440, y: -70 },
    parentIds: ['dada1', 'dadi1'],
    childIds: [],
    spouseIds: ['motiba1'],
  },
  {
    _id: 'motiba1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'હંસાબેન પટેલ',
    nameEnglish: 'Hansaben Patel',
    gender: 'female',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'મોટીબા (Elder Aunt)',
    birthDate: '1926-06-12',
    position: { x: -240, y: -70 },
    parentIds: [],
    childIds: [],
    spouseIds: ['motabapa1'],
  },

  // ─── Gen 2: Father (પિતા) & Mother (માતા) ──────────────────
  {
    _id: 'pita1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'રમેશભાઈ પટેલ',
    nameEnglish: 'Rameshbhai Patel',
    gender: 'male',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'પિતા (Father)',
    birthDate: '1928-09-19',
    position: { x: 0, y: -70 },
    parentIds: ['dada1', 'dadi1'],
    childIds: ['sunil1', 'geeta1'],
    spouseIds: ['mata1'],
  },
  {
    _id: 'mata1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'સુમિત્રાબેન પટેલ',
    nameEnglish: 'Sumitraben Patel',
    gender: 'female',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'માતા (Mother)',
    birthDate: '1932-12-01',
    position: { x: 220, y: -70 },
    parentIds: [],
    childIds: ['sunil1', 'geeta1'],
    spouseIds: ['pita1'],
    // In-Laws linked to Mata (Sasara, Sasu, Jeth, Patala Sasu, Der, Nanand)
    inLawNodeIds: ['sasara1', 'sasu1', 'jeth1', 'patala_sasu1', 'der1', 'nanand1'],
    inLawsHidden: true, // Hidden by default!
  },

  // ─── Gen 2: Kaka & Kaki ───────────────────────────────────
  {
    _id: 'kaka1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'મનુભાઈ પટેલ',
    nameEnglish: 'Manubhai Patel',
    gender: 'male',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'કાકા (Paternal Uncle)',
    birthDate: '1935-03-22',
    position: { x: 460, y: -70 },
    parentIds: ['dada1', 'dadi1'],
    childIds: [],
    spouseIds: ['kaki1'],
  },
  {
    _id: 'kaki1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'ઉષાબેન પટેલ',
    nameEnglish: 'Ushaben Patel',
    gender: 'female',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'કાકી (Paternal Aunt)',
    birthDate: '1938-07-09',
    position: { x: 660, y: -70 },
    parentIds: [],
    childIds: [],
    spouseIds: ['kaka1'],
  },

  // ─── Gen 2: Fai & Fuva ────────────────────────────────────
  {
    _id: 'fai1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'કોકિલાબેન પટેલ',
    nameEnglish: 'Kokilaben Patel',
    gender: 'female',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'ફઈ (Paternal Aunt)',
    birthDate: '1940-10-18',
    position: { x: 880, y: -70 },
    parentIds: ['dada1', 'dadi1'],
    childIds: [],
    spouseIds: ['fuva1'],
  },
  {
    _id: 'fuva1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'પ્રમોદરાય શાહ',
    nameEnglish: 'Pramodrai Shah',
    gender: 'male',
    generation: 2,
    branchType: 'main',
    kinshipTitle: 'ફુવા (Uncle)',
    birthDate: '1937-05-14',
    position: { x: 1080, y: -70 },
    parentIds: [],
    childIds: [],
    spouseIds: ['fai1'],
  },

  // ─── Gen 3: Children (સુનીલ & ગીતા) ───────────────────────
  {
    _id: 'sunil1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'સુનીલ પટેલ',
    nameEnglish: 'Sunil Patel',
    gender: 'male',
    generation: 3,
    branchType: 'main',
    kinshipTitle: 'પુત્ર / ભાઈ (Son)',
    birthDate: '1958-02-11',
    position: { x: -80, y: 130 },
    parentIds: ['pita1', 'mata1'],
    childIds: ['rahul1'],
    spouseIds: [],
  },
  {
    _id: 'geeta1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'ગીતાબેન પટેલ',
    nameEnglish: 'Geetaben Patel',
    gender: 'female',
    generation: 3,
    branchType: 'main',
    kinshipTitle: 'પુત્રી / બહેન (Daughter)',
    birthDate: '1962-07-25',
    position: { x: 180, y: 130 },
    parentIds: ['pita1', 'mata1'],
    childIds: [],
    spouseIds: ['jamai1'],
    inLawNodeIds: ['sasara1', 'sasu1', 'der1'],
    inLawsHidden: true, // Hidden by default!
  },
  {
    _id: 'jamai1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'અશોકકુમાર દેસાઈ',
    nameEnglish: 'Ashokkumar Desai',
    gender: 'male',
    generation: 3,
    branchType: 'in-law',
    kinshipTitle: 'જમાઈરાજ (Son-in-law)',
    birthDate: '1959-11-04',
    position: { x: 380, y: 130 },
    parentIds: [],
    childIds: [],
    spouseIds: ['geeta1'],
  },

  // ─── Gen 4: Grandson (રાહુલ પટેલ) ─────────────────────────
  {
    _id: 'rahul1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'રાહુલ પટેલ',
    nameEnglish: 'Rahul Patel',
    gender: 'male',
    generation: 4,
    branchType: 'main',
    kinshipTitle: 'પૌત્ર (Grandson)',
    birthDate: '1988-06-19',
    position: { x: -80, y: 320 },
    parentIds: ['sunil1'],
    childIds: [],
    spouseIds: [],
  },

  // ─── In-Laws Branch (સાસરી પક્ષ: સસરા, સાસુ, જેઠ, પાટલા સાસુ, દેર, નણંદ) ──
  // Hidden by default, linked via Mata / Geeta
  {
    _id: 'sasara1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'મણીલાલ દેસાઈ',
    nameEnglish: 'Manilal Desai',
    gender: 'male',
    generation: 1,
    branchType: 'in-law',
    kinshipTitle: 'સસરા (Father-in-law)',
    position: { x: 260, y: -260 },
    parentIds: [],
    childIds: ['mata1', 'jeth1', 'der1', 'nanand1'],
    spouseIds: ['sasu1'],
    hidden: true,
  },
  {
    _id: 'sasu1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'દક્ષાબેન દેસાઈ',
    nameEnglish: 'Daxaben Desai',
    gender: 'female',
    generation: 1,
    branchType: 'in-law',
    kinshipTitle: 'સાસુ (Mother-in-law)',
    position: { x: 460, y: -260 },
    parentIds: [],
    childIds: ['mata1', 'jeth1', 'der1', 'nanand1'],
    spouseIds: ['sasara1'],
    hidden: true,
  },
  {
    _id: 'jeth1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'કિશોરભાઈ દેસાઈ',
    nameEnglish: 'Kishorbhai Desai',
    gender: 'male',
    generation: 2,
    branchType: 'in-law',
    kinshipTitle: 'જેઠ (Husband’s Elder Brother)',
    position: { x: 520, y: -190 },
    parentIds: ['sasara1', 'sasu1'],
    childIds: [],
    spouseIds: ['patala_sasu1'],
    hidden: true,
  },
  {
    _id: 'patala_sasu1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'શિલ્પાબેન દેસાઈ',
    nameEnglish: 'Shilpaben Desai',
    gender: 'female',
    generation: 2,
    branchType: 'in-law',
    kinshipTitle: 'પાટલા સાસુ / જેઠાણી',
    position: { x: 720, y: -190 },
    parentIds: [],
    childIds: [],
    spouseIds: ['jeth1'],
    hidden: true,
  },
  {
    _id: 'der1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'ભાવેશભાઈ દેસાઈ',
    nameEnglish: 'Bhaveshbhai Desai',
    gender: 'male',
    generation: 2,
    branchType: 'in-law',
    kinshipTitle: 'દેર / દિયર (Husband’s Younger Brother)',
    position: { x: 520, y: 10 },
    parentIds: ['sasara1', 'sasu1'],
    childIds: [],
    spouseIds: [],
    hidden: true,
  },
  {
    _id: 'nanand1',
    treeId: DEFAULT_TREE_ID,
    nameGujarati: 'પારુલબેન દેસાઈ',
    nameEnglish: 'Parulben Desai',
    gender: 'female',
    generation: 2,
    branchType: 'in-law',
    kinshipTitle: 'નણંદ (Husband’s Sister)',
    position: { x: 720, y: 10 },
    parentIds: ['sasara1', 'sasu1'],
    childIds: [],
    spouseIds: [],
    hidden: true,
  },
];

// ─── Local In-Memory / Fallback Storage Cache ───────────────────

interface TreeDoc {
  _id: string;
  name: string;
  description?: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

let localTrees: TreeDoc[] = [DEFAULT_DEMO_TREE];
let localNodes: FamilyNode[] = [...DEFAULT_DEMO_NODES];

export const DataService = {
  // ─── Trees ──────────────────────────────────────────────────
  async getTrees(): Promise<TreeDoc[]> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        const trees = await Tree.find({}).sort({ updatedAt: -1 }).lean();
        if (trees.length > 0) {
          const treesWithCount = await Promise.all(
            trees.map(async t => {
              const count = await NodeModel.countDocuments({ treeId: String(t._id) });
              return {
                _id: String(t._id),
                name: t.name,
                description: t.description,
                nodeCount: count,
                createdAt: t.createdAt ? String(t.createdAt) : new Date().toISOString(),
                updatedAt: t.updatedAt ? String(t.updatedAt) : new Date().toISOString(),
              };
            })
          );
          return treesWithCount;
        }
      } catch (err) {
        console.warn('[DataService] Error querying MongoDB trees, falling back:', err);
      }
    }
    // Return local trees with live calculated member counts
    return localTrees.map(t => ({
      ...t,
      nodeCount: localNodes.filter(n => n.treeId === t._id).length,
    }));
  },

  async getTreeById(id: string): Promise<TreeDoc | null> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        const tree = await Tree.findById(id).lean();
        if (tree) {
          const count = await NodeModel.countDocuments({ treeId: id });
          return {
            _id: String(tree._id),
            name: tree.name,
            description: tree.description,
            nodeCount: count,
            createdAt: tree.createdAt ? String(tree.createdAt) : new Date().toISOString(),
            updatedAt: tree.updatedAt ? String(tree.updatedAt) : new Date().toISOString(),
          };
        }
      } catch {
        // Fallback to local
      }
    }
    const found = localTrees.find(t => t._id === id);
    if (!found && id === DEFAULT_TREE_ID) {
      return {
        ...DEFAULT_DEMO_TREE,
        nodeCount: localNodes.filter(n => n.treeId === DEFAULT_TREE_ID).length,
      };
    }
    if (found) {
      return {
        ...found,
        nodeCount: localNodes.filter(n => n.treeId === found._id).length,
      };
    }
    return null;
  },

  async createTree(data: { name: string; description?: string }): Promise<TreeDoc> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        const tree = await Tree.create(data);
        const doc: TreeDoc = {
          _id: String(tree._id),
          name: tree.name,
          description: tree.description,
          nodeCount: tree.nodeCount || 0,
          createdAt: tree.createdAt ? String(tree.createdAt) : new Date().toISOString(),
          updatedAt: tree.updatedAt ? String(tree.updatedAt) : new Date().toISOString(),
        };
        // Also save to local
        localTrees.unshift(doc);
        return doc;
      } catch (err) {
        console.warn('[DataService] Mongo createTree failed, using fallback:', err);
      }
    }
    const newDoc: TreeDoc = {
      _id: `tree-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      nodeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localTrees.unshift(newDoc);
    return newDoc;
  },

  async updateTree(id: string, data: Partial<{ name: string; description: string; nodeCount: number }>): Promise<TreeDoc | null> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        const tree = await Tree.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
        if (tree) {
          return {
            _id: String(tree._id),
            name: tree.name,
            description: tree.description,
            nodeCount: tree.nodeCount,
            createdAt: tree.createdAt ? String(tree.createdAt) : new Date().toISOString(),
            updatedAt: tree.updatedAt ? String(tree.updatedAt) : new Date().toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }
    const idx = localTrees.findIndex(t => t._id === id);
    if (idx !== -1) {
      localTrees[idx] = { ...localTrees[idx], ...data, updatedAt: new Date().toISOString() };
      return localTrees[idx];
    }
    return null;
  },

  async deleteTree(id: string): Promise<boolean> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        await Tree.findByIdAndDelete(id);
      } catch {}
    }
    localTrees = localTrees.filter(t => t._id !== id);
    localNodes = localNodes.filter(n => n.treeId !== id);
    return true;
  },

  // ─── Nodes ──────────────────────────────────────────────────
  async getNodes(treeId: string): Promise<FamilyNode[]> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        const nodes = await NodeModel.find({ treeId }).lean();
        if (nodes && nodes.length > 0) {
          return nodes.map(n => ({
            ...n,
            _id: String(n._id),
            treeId: String(n.treeId),
          })) as unknown as FamilyNode[];
        }
        if (treeId === DEFAULT_TREE_ID) {
          try {
            await NodeModel.insertMany(DEFAULT_DEMO_NODES);
            return DEFAULT_DEMO_NODES;
          } catch {}
        }
      } catch (err) {
        console.warn('[DataService] Error querying MongoDB nodes, falling back:', err);
      }
    }
    const matching = localNodes.filter(n => n.treeId === treeId);
    if (matching.length === 0 && treeId === DEFAULT_TREE_ID) {
      return DEFAULT_DEMO_NODES;
    }
    return matching;
  },

  async createNode(data: Partial<FamilyNode>): Promise<FamilyNode> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        const created = await NodeModel.create(data);
        const nodeObj = {
          ...created.toObject(),
          _id: String(created._id),
          treeId: String(created.treeId),
        } as unknown as FamilyNode;
        localNodes.push(nodeObj);
        return nodeObj;
      } catch (err) {
        console.warn('[DataService] Mongo createNode failed, using fallback:', err);
      }
    }
    const newNode: FamilyNode = {
      _id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      treeId: data.treeId || DEFAULT_TREE_ID,
      nameGujarati: data.nameGujarati || 'નવ સભ્ય',
      nameEnglish: data.nameEnglish || 'New Member',
      gender: data.gender || 'other',
      generation: data.generation ?? 1,
      branchType: data.branchType || 'main',
      parentIds: data.parentIds || [],
      childIds: data.childIds || [],
      spouseIds: data.spouseIds || [],
      inLawNodeIds: data.inLawNodeIds || [],
      position: data.position || { x: 0, y: 0 },
      kinshipTitle: data.kinshipTitle,
      birthDate: data.birthDate,
      deathDate: data.deathDate,
      notes: data.notes,
      photo: data.photo,
      collapsed: data.collapsed ?? false,
      hidden: data.hidden ?? false,
      inLawsHidden: data.inLawsHidden ?? true,
    };
    localNodes.push(newNode);
    return newNode;
  },

  async updateNode(id: string, data: Partial<FamilyNode>): Promise<FamilyNode | null> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        const updated = await NodeModel.findOneAndUpdate(
          { _id: id },
          { $set: data },
          { new: true, upsert: false }
        ).lean();
        if (updated) {
          const nodeObj = {
            ...updated,
            _id: String(updated._id),
            treeId: String(updated.treeId),
          } as unknown as FamilyNode;
          const idx = localNodes.findIndex(n => n._id === id);
          if (idx !== -1) localNodes[idx] = nodeObj;
          else localNodes.push(nodeObj);
          return nodeObj;
        }
      } catch (err) {
        console.warn('[DataService] Mongo updateNode error:', err);
      }
    }
    const idx = localNodes.findIndex(n => n._id === id);
    if (idx !== -1) {
      localNodes[idx] = { ...localNodes[idx], ...data } as FamilyNode;
      return localNodes[idx];
    }
    const defNode = DEFAULT_DEMO_NODES.find(n => n._id === id);
    if (defNode) {
      const merged = { ...defNode, ...data } as FamilyNode;
      localNodes.push(merged);
      return merged;
    }
    return null;
  },

  async deleteNode(id: string): Promise<boolean> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        await NodeModel.findByIdAndDelete(id);
      } catch {}
    }
    localNodes = localNodes.filter(n => n._id !== id);
    return true;
  },

  async bulkSaveNodes(treeId: string, nodes: FamilyNode[]): Promise<FamilyNode[]> {
    const mongoReady = await checkOrConnectMongo();
    if (mongoReady) {
      try {
        await NodeModel.deleteMany({ treeId });
        const inserted = await NodeModel.insertMany(nodes.map(n => ({ ...n, treeId })));
        return inserted.map(n => ({
          ...n.toObject(),
          _id: String(n._id),
          treeId: String(n.treeId),
        })) as unknown as FamilyNode[];
      } catch (err) {
        console.warn('[DataService] Mongo bulkSaveNodes failed, using fallback:', err);
      }
    }
    localNodes = localNodes.filter(n => n.treeId !== treeId);
    localNodes.push(...nodes.map(n => ({ ...n, treeId })));
    return nodes;
  },
};
