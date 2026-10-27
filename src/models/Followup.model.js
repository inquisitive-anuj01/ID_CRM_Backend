import mongoose, { Schema } from 'mongoose';

const followupAttachmentSchema = new Schema(
  {
    kind: { type: String, enum: ['file', 'voice'], default: 'file' },
    url: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: true }
);

const followupSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'FollowupCategory', required: true },
    comment: { type: String, trim: true },
    nextFollowupDate: { type: Date, required: true },
    attachments: [followupAttachmentSchema],

    // Policy snapshot
    gapMinutes: { type: Number },
    allowedMinutes: { type: Number, default: 30 },
    differenceMinutes: { type: Number },
    policyStatus: { type: String, enum: ['inpolicy', 'outofpolicy'] },

    leadStatusAtTime: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    completedAt: { type: Date },
    completedOnTime: { type: Boolean },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

followupSchema.index({ workspace: 1, lead: 1, createdAt: -1 });
followupSchema.index({ workspace: 1, createdBy: 1, nextFollowupDate: 1, completedAt: 1 });
followupSchema.index({ lead: 1, createdAt: -1 });
followupSchema.index({ createdBy: 1, nextFollowupDate: 1, completedAt: 1 });

const Followup = mongoose.model('Followup', followupSchema);
export default Followup;
