import mongoose, { Schema } from 'mongoose';
import { TERMINAL_STATUSES } from '../config/constants.js';

const leadSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    leadNo: { type: String, index: true },
    customerName: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+91' },
    mobile: { type: String, required: true, index: true },
    mobileFull: { type: String, index: true },
    email: { type: String, lowercase: true, trim: true },
    companyName: { type: String, trim: true },
    address: { type: String, trim: true },
    comment: { type: String },
    reference: { type: String },
    leadDate: { type: Date, default: Date.now },

    source: { type: Schema.Types.ObjectId, ref: 'Source' },
    status: { type: String, default: 'new', index: true },
    labels: [
      {
        label: { type: Schema.Types.ObjectId, ref: 'Label' },
        amount: { type: Number, default: 0 },
      },
    ],
    estimateAmount: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    nextFollowupDate: { type: Date, index: true },
    lastFollowupAt: { type: Date },
    followupCount: { type: Number, default: 0 },

    statusChangedAt: { type: Date },
    closedAt: { type: Date },
    cancelReason: { type: String },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for isOverdue
leadSchema.virtual('isOverdue').get(function () {
  if (!this.nextFollowupDate) return false;
  if (TERMINAL_STATUSES.includes(this.status)) return false;
  return new Date(this.nextFollowupDate) < new Date();
});

// Virtual for overdueByMinutes
leadSchema.virtual('overdueByMinutes').get(function () {
  if (!this.nextFollowupDate || !this.isOverdue) return 0;
  return Math.max(0, Math.floor((new Date() - new Date(this.nextFollowupDate)) / 60000));
});

// Indexes for high performance
leadSchema.index({ workspace: 1, leadNo: 1 }, { unique: true, sparse: true });
leadSchema.index({ workspace: 1, status: 1, assignedTo: 1, nextFollowupDate: 1 });
leadSchema.index({ workspace: 1, createdAt: -1 });
leadSchema.index({ status: 1, assignedTo: 1, nextFollowupDate: 1 });
leadSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
leadSchema.index({ customerName: 'text', companyName: 'text', mobileFull: 'text', email: 'text' });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
