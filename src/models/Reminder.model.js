import mongoose, { Schema } from 'mongoose';

const reminderSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    remindAt: { type: Date, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    isDone: { type: Boolean, default: false },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

reminderSchema.index({ workspace: 1, user: 1, remindAt: 1, isDone: 1 });
reminderSchema.index({ workspace: 1, lead: 1 });
reminderSchema.index({ user: 1, remindAt: 1, isDone: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
