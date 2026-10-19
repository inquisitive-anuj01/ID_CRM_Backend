import mongoose, { Schema } from 'mongoose';

const sourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: ['online', 'offline'], default: 'online' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Source = mongoose.model('Source', sourceSchema);
export default Source;
