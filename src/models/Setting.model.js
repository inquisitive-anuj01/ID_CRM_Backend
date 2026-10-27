import mongoose, { Schema } from 'mongoose';

const settingSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    key: { type: String, required: true, default: 'followup' },
    allowedMinutes: { type: Number, default: 30 },
    graceMinutes: { type: Number, default: 0 },
    staffCanDeleteOwnLead: { type: Boolean, default: false },
    staffFollowupEditWindowMinutes: { type: Number, default: 1440 }, // 24 hours
  },
  { timestamps: true }
);

settingSchema.index({ workspace: 1, key: 1 }, { unique: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
