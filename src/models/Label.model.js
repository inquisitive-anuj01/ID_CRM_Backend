import mongoose, { Schema } from 'mongoose';

const labelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    color: { type: String, default: '#3B82F6' },
    defaultAmount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

labelSchema.index({ order: 1 });

const Label = mongoose.model('Label', labelSchema);
export default Label;
