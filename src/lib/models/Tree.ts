import mongoose, { Schema, Document, Model } from 'mongoose';
import type { FamilyTree } from '@/types';

export interface ITree extends Omit<FamilyTree, '_id'>, Document {}

const TreeSchema = new Schema<ITree>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    edgeStyle: {
      type: String,
      enum: ['straight', 'step', 'curved', 'zigzag'],
      default: 'curved',
    },
    gridType: {
      type: String,
      enum: ['none', 'dots', 'lines', 'cross'],
      default: 'dots',
    },
    snapToGrid: { type: Boolean, default: false },
    defaultNodeShape: {
      type: String,
      enum: ['circle', 'rounded-card', 'badge'],
      default: 'rounded-card',
    },
    backgroundColor: { type: String, default: '#ffffff' },
    nodeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Tree: Model<ITree> =
  mongoose.models.Tree ?? mongoose.model<ITree>('Tree', TreeSchema);

export default Tree;
