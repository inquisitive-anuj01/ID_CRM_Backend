import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
  {
    title: { type: String, trim: true },
    content: { type: String, required: true },
    color: { type: String, default: '#FEF08A' }, // Yellow sticky default
    isPinned: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
  },
  { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;
