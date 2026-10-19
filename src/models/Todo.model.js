import mongoose, { Schema } from 'mongoose';

const todoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    isDone: { type: Boolean, default: false },
    dueDate: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

const Todo = mongoose.model('Todo', todoSchema);
export default Todo;
