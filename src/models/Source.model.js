import mongoose, { Schema } from 'mongoose';

const sourceSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['online', 'offline'], default: 'online' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sourceSchema.index({ workspace: 1, name: 1 }, { unique: true });
sourceSchema.index({ workspace: 1, order: 1 });
sourceSchema.index({ order: 1 });

const Source = mongoose.model('Source', sourceSchema);
export default Source;
