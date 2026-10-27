import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, trim: true },
    content: { type: String, required: true },
    color: { type: String, default: '#FEF08A' }, // Yellow sticky default
    isPinned: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
  },
  { timestamps: true }
);

noteSchema.index({ workspace: 1, user: 1, createdAt: -1 });
noteSchema.index({ workspace: 1, lead: 1 });

const Note = mongoose.model('Note', noteSchema);
export default Note;
