import mongoose, { Schema } from 'mongoose';

const followupCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

followupCategorySchema.index({ order: 1 });

const FollowupCategory = mongoose.model('FollowupCategory', followupCategorySchema);
export default FollowupCategory;
