import mongoose, { Schema } from 'mongoose';

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'followup' },
    allowedMinutes: { type: Number, default: 30 },
    graceMinutes: { type: Number, default: 0 },
    staffCanDeleteOwnLead: { type: Boolean, default: false },
    staffFollowupEditWindowMinutes: { type: Number, default: 1440 }, // 24 hours
  },
  { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
