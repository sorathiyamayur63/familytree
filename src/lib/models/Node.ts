import mongoose, { Schema, Document, Model } from 'mongoose';
import type { FamilyNode } from '@/types';

export interface INode extends Omit<FamilyNode, '_id'>, Document<string> {
  _id: string;
}

const NodeSchema = new Schema<INode>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    treeId: { type: String, required: true, index: true },
    nameGujarati: { type: String, required: true, default: '' },
    nameEnglish: { type: String, required: true, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    birthDate: { type: String, default: '' },
    deathDate: { type: String, default: '' },
    photo: { type: String, default: '' },
    parentIds: [{ type: String }],
    spouseIds: [{ type: String }],
    childIds: [{ type: String }],
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    style: {
      bgColor: String,
      borderColor: String,
      shape: { type: String, enum: ['rounded-card', 'circle', 'badge', 'minimal-pill'] },
      photoMask: { type: String, enum: ['circle', 'square'] },
      accentColor: String,
    },
    collapsed: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    generation: { type: Number, default: 1 },

    // ─── In-Law & Branch Support ─────────────────────────────
    branchType: {
      type: String,
      enum: ['main', 'in-law', 'mosal'],
      default: 'main',
    },
    inLawsHidden: { type: Boolean, default: true },
    inLawNodeIds: [{ type: String }],
    kinshipTitle: { type: String, default: '' },

    metadata: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

NodeSchema.index({ treeId: 1, nameEnglish: 'text', nameGujarati: 'text' });

const Node: Model<INode> =
  mongoose.models.FamilyNode ??
  mongoose.model<INode>('FamilyNode', NodeSchema);

export default Node;
