import mongoose, { Schema } from 'mongoose';

const sourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: ['online', 'offline'], default: 'online' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sourceSchema.index({ order: 1 });

const Source = mongoose.model('Source', sourceSchema);
export default Source;
