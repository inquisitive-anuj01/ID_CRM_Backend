import mongoose, { Schema } from 'mongoose';

const workspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    companySize: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
