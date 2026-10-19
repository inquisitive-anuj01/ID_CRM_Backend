import mongoose, { Schema } from 'mongoose';

const leadStatusSchema = new Schema(
  {
    key: { type: String, unique: true, lowercase: true, trim: true }, // immutable
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6B7280' },
    order: { type: Number, default: 0 },
    isTerminal: { type: Boolean, default: false },
    requiresReason: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leadStatusSchema.index({ order: 1 });

const LeadStatus = mongoose.model('LeadStatus', leadStatusSchema);
export default LeadStatus;
