import mongoose, { Schema } from 'mongoose';

const meetingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    location: { type: String }, // Physical address or Google Meet / Zoom link
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  },
  { timestamps: true }
);

meetingSchema.index({ attendees: 1, startAt: 1 });
meetingSchema.index({ lead: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
