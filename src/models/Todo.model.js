import mongoose, { Schema } from 'mongoose';

const todoSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    isDone: { type: Boolean, default: false },
    dueDate: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

todoSchema.index({ workspace: 1, user: 1, isDone: 1 });

const Todo = mongoose.model('Todo', todoSchema);
export default Todo;
