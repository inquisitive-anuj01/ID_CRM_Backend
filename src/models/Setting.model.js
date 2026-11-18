import mongoose, { Schema } from 'mongoose';

const settingSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    key: { type: String, required: true, default: 'followup' },

    // ── Calling / working hours ───────────────────────────────────────────
    startHour: { type: Number, default: 9, min: 0, max: 23 },   // e.g. 9  → 09:00
    endHour:   { type: Number, default: 21, min: 0, max: 23 },  // e.g. 21 → 21:00

    // ── SLA / policy ─────────────────────────────────────────────────────
    maxFollowupGapHours: { type: Number, default: 48, min: 1 }, // Max gap (hours) between followups
    autoReassignHours:   { type: Number, default: 24, min: 0 }, // 0 = disabled

    // ── Derived / legacy (kept for backward-compat; always synced from maxFollowupGapHours) ──
    allowedMinutes: { type: Number, default: 2880 }, // maxFollowupGapHours * 60
    graceMinutes:   { type: Number, default: 0 },

    // ── Staff permissions ─────────────────────────────────────────────────
    staffCanDeleteOwnLead:          { type: Boolean, default: false },
    staffFollowupEditWindowMinutes: { type: Number, default: 1440 }, // 24 hours
  },
  { timestamps: true }
);

settingSchema.index({ workspace: 1, key: 1 }, { unique: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
