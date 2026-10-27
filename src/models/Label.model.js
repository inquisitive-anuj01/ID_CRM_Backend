import mongoose, { Schema } from 'mongoose';

const labelSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#3B82F6' },
    defaultAmount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

labelSchema.index({ workspace: 1, name: 1 }, { unique: true });
labelSchema.index({ workspace: 1, order: 1 });
labelSchema.index({ order: 1 });

const Label = mongoose.model('Label', labelSchema);
export default Label;
