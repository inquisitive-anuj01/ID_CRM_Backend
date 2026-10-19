import mongoose, { Schema } from 'mongoose';
import { HISTORY_ACTIONS } from '../config/constants.js';

const leadHistorySchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: Object.values(HISTORY_ACTIONS),
      required: true,
    },
    changes: [
      {
        field: { type: String, required: true },
        from: { type: Schema.Types.Mixed },
        to: { type: Schema.Types.Mixed },
      },
    ],
    note: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

leadHistorySchema.index({ lead: 1, createdAt: -1 });

const LeadHistory = mongoose.model('LeadHistory', leadHistorySchema);
export default LeadHistory;
