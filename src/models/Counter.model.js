import mongoose, { Schema } from 'mongoose';

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g. 'lead'
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

export const getNextSequence = async (name) => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

export default Counter;
