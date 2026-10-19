import mongoose, { Schema } from 'mongoose';

const reminderSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    remindAt: { type: Date, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    isDone: { type: Boolean, default: false },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, remindAt: 1, isDone: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
