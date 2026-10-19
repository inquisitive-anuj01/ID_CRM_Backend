import mongoose, { Schema } from 'mongoose';

const followupCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FollowupCategory = mongoose.model('FollowupCategory', followupCategorySchema);
export default FollowupCategory;
