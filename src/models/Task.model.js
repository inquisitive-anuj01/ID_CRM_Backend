import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
  },
  { timestamps: true }
);

taskSchema.index({ workspace: 1, assignedTo: 1, dueDate: 1, status: 1 });
taskSchema.index({ workspace: 1, lead: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1, status: 1 });
taskSchema.index({ lead: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
