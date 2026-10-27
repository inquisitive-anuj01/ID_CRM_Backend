import mongoose, { Schema } from 'mongoose';

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g. 'lead' or 'lead_<workspaceId>'
  name: { type: String },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

export const getNextSequence = async (name, workspaceId = null) => {
  const id = workspaceId ? `${name}_${workspaceId}` : name;
  const update = { $inc: { seq: 1 } };
  if (workspaceId) {
    update.$setOnInsert = { name, workspace: workspaceId };
  }
  const counter = await Counter.findByIdAndUpdate(
    id,
    update,
    { new: true, upsert: true }
  );
  return counter.seq;
};

export default Counter;
