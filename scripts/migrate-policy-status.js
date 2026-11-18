/**
 * Migration: Recalculate policyStatus on all existing followup documents
 *
 * What this fixes
 * ───────────────
 * Before the fix, every followup was stored with policyStatus = 'outofpolicy'
 * because:
 *   1. The Setting fields sent from the UI were silently stripped, so
 *      allowedMinutes stayed at the 30-minute default.
 *   2. Any followup scheduled more than 30 minutes in the future is
 *      therefore "out of policy" — which is every real followup.
 *
 * After running this script
 * ─────────────────────────
 * Each followup's policyStatus and gapMinutes are recomputed using the
 * correct allowedMinutes from the workspace's current Setting document
 * (defaults to 2880 min = 48 h if no setting exists).
 *
 * Usage
 * ─────
 *   cd backend
 *   node scripts/migrate-policy-status.js
 *
 *   # Dry-run (prints changes but writes nothing):
 *   DRY_RUN=true node scripts/migrate-policy-status.js
 *
 * Requirements
 * ────────────
 *   • Node ≥ 18
 *   • MONGO_URI in backend/.env  (the script loads it automatically)
 */

import 'dotenv/config';
import mongoose from 'mongoose';

// ── Schema stubs (mirrors the real models without importing the full app) ──
const settingSchema = new mongoose.Schema({
  workspace:           mongoose.Schema.Types.ObjectId,
  key:                 String,
  allowedMinutes:      { type: Number, default: 2880 },
  maxFollowupGapHours: { type: Number, default: 48 },
}, { timestamps: true });

const followupSchema = new mongoose.Schema({
  workspace:       mongoose.Schema.Types.ObjectId,
  lead:            mongoose.Schema.Types.ObjectId,
  createdAt:       Date,
  nextFollowupDate:Date,
  gapMinutes:      Number,
  allowedMinutes:  Number,
  differenceMinutes: Number,
  policyStatus:    String,
}, { timestamps: true });

const Setting  = mongoose.model('Setting',  settingSchema);
const Followup = mongoose.model('Followup', followupSchema);

// ── Policy calculator (same logic as the fixed followup.service.js) ───────
function calcPolicyStatus(lastFollowupAt, nextFollowupDate, allowedMinutes = 2880) {
  const gapMinutes      = Math.round((new Date(nextFollowupDate) - new Date(lastFollowupAt)) / 60000);
  const differenceMinutes = allowedMinutes - gapMinutes;
  const policyStatus    = gapMinutes <= allowedMinutes ? 'inpolicy' : 'outofpolicy';
  return { gapMinutes, differenceMinutes, policyStatus };
}

// ── Main ──────────────────────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN === 'true';

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌  MONGO_URI not found in environment. Make sure you run from the backend/ directory with .env present.');
    process.exit(1);
  }

  console.log(`🔗  Connecting to MongoDB…`);
  await mongoose.connect(mongoUri);
  console.log(`✅  Connected.\n`);

  if (DRY_RUN) console.log('⚠️   DRY RUN — no documents will be modified.\n');

  // Load all workspace settings keyed by workspace id
  const allSettings = await Setting.find({ key: 'followup' }).lean();
  const settingMap  = {};   // workspaceId (string) → allowedMinutes
  for (const s of allSettings) {
    const wsKey = s.workspace?.toString();
    if (wsKey) settingMap[wsKey] = s.allowedMinutes || 2880;
  }
  console.log(`📋  Loaded ${allSettings.length} workspace setting(s).\n`);

  // Stream all followups
  const cursor = Followup.find({}).lean().cursor();

  let total   = 0;
  let changed = 0;
  let skipped = 0;
  let errors  = 0;

  const bulkOps = [];
  const BATCH   = 500;

  async function flushBatch() {
    if (bulkOps.length === 0) return;
    if (!DRY_RUN) {
      await Followup.bulkWrite(bulkOps, { ordered: false });
    }
    bulkOps.length = 0;
  }

  for await (const followup of cursor) {
    total++;

    if (!followup.nextFollowupDate) {
      skipped++;
      continue;
    }

    // Determine allowedMinutes for this workspace
    const wsKey        = followup.workspace?.toString();
    const allowedMins  = wsKey && settingMap[wsKey] != null
      ? settingMap[wsKey]
      : 2880;   // global default

    // Use createdAt as the base (mirrors what createFollowup now stores)
    const base   = followup.createdAt || new Date(followup.nextFollowupDate).setHours(0,0,0,0);
    const result = calcPolicyStatus(base, followup.nextFollowupDate, allowedMins);

    const oldStatus = followup.policyStatus;
    if (oldStatus === result.policyStatus &&
        followup.gapMinutes === result.gapMinutes &&
        followup.allowedMinutes === allowedMins) {
      skipped++;
      continue;
    }

    changed++;

    if (DRY_RUN) {
      console.log(
        `  [dry] followup ${followup._id} | ${oldStatus} → ${result.policyStatus}` +
        ` | gap=${result.gapMinutes}m allowed=${allowedMins}m`
      );
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: followup._id },
          update: {
            $set: {
              policyStatus:      result.policyStatus,
              gapMinutes:        result.gapMinutes,
              allowedMinutes:    allowedMins,
              differenceMinutes: result.differenceMinutes,
            },
          },
        },
      });

      if (bulkOps.length >= BATCH) {
        try { await flushBatch(); } catch (e) { errors++; console.error('Batch error:', e.message); }
      }
    }
  }

  // Flush remaining
  try { await flushBatch(); } catch (e) { errors++; console.error('Final batch error:', e.message); }

  await mongoose.disconnect();

  console.log('\n──────────────────────────────────────');
  console.log(`📊  Migration complete`);
  console.log(`    Total followups scanned : ${total}`);
  console.log(`    Updated                 : ${changed}`);
  console.log(`    Already correct / skipped: ${skipped}`);
  if (errors) console.log(`    ⚠️  Batch errors          : ${errors}`);
  if (DRY_RUN) console.log('\n    ℹ️  Nothing was written (DRY_RUN=true).');
  console.log('──────────────────────────────────────\n');
}

run().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});

