import mongoose, { Schema } from 'mongoose';

const followupCategorySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

followupCategorySchema.index({ workspace: 1, name: 1 }, { unique: true });
followupCategorySchema.index({ workspace: 1, order: 1 });
followupCategorySchema.index({ order: 1 });

const FollowupCategory = mongoose.model('FollowupCategory', followupCategorySchema);
export default FollowupCategory;
