import mongoose, { Schema } from 'mongoose';

const leadStatusSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    key: { type: String, lowercase: true, trim: true }, // immutable per workspace
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6B7280' },
    order: { type: Number, default: 0 },
    isTerminal: { type: Boolean, default: false },
    requiresReason: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leadStatusSchema.index({ workspace: 1, key: 1 }, { unique: true });
leadStatusSchema.index({ workspace: 1, order: 1 });
leadStatusSchema.index({ order: 1 });

const LeadStatus = mongoose.model('LeadStatus', leadStatusSchema);
export default LeadStatus;
