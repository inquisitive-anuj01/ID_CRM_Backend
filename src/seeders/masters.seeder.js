import LeadStatus from '../models/LeadStatus.model.js';
import Source from '../models/Source.model.js';
import Label from '../models/Label.model.js';
import FollowupCategory from '../models/FollowupCategory.model.js';
import Setting from '../models/Setting.model.js';

const initialStatuses = [
  { key: 'new', name: 'New', color: '#3B82F6', order: 1, isTerminal: false },
  { key: 'processing', name: 'Processing', color: '#F59E0B', order: 2, isTerminal: false },
  { key: 'close-by', name: 'Close-by', color: '#8B5CF6', order: 3, isTerminal: false },
  { key: 'visited', name: 'Visited', color: '#EC4899', order: 4, isTerminal: false },
  { key: 'confirm', name: 'Confirm', color: '#10B981', order: 5, isTerminal: true },
  { key: 'cancel', name: 'Cancel', color: '#EF4444', order: 6, isTerminal: true, requiresReason: true },
  { key: 'internal-transfer-needed', name: 'Internal Transfer Needed', color: '#6366F1', order: 7, isTerminal: false },
];

const initialSources = [
  { name: 'Online', type: 'online' },
  { name: 'Meta', type: 'online' },
  { name: 'Google Ads', type: 'online' },
  { name: 'Website', type: 'online' },
  { name: 'Walk-in', type: 'offline' },
  { name: 'Referral', type: 'offline' },
  { name: 'Call', type: 'offline' },
  { name: 'Other', type: 'offline' },
];

const initialLabels = [
  { name: '1BHK', color: '#3B82F6', defaultAmount: 2500000 },
  { name: '2BHK', color: '#10B981', defaultAmount: 4500000 },
  { name: '3BHK', color: '#F59E0B', defaultAmount: 6500000 },
  { name: 'Commercial', color: '#8B5CF6', defaultAmount: 8000000 },
  { name: 'Plot', color: '#EC4899', defaultAmount: 3000000 },
];

const initialCategories = [
  { name: 'Call Not Picked' },
  { name: 'Call Back Later' },
  { name: 'Interested' },
  { name: 'Site Visit' },
  { name: 'Negotiation' },
  { name: 'Other' },
];

export const seedMasters = async () => {
  // Statuses
  for (const s of initialStatuses) {
    await LeadStatus.findOneAndUpdate({ key: s.key }, { $setOnInsert: s }, { upsert: true });
  }

  // Sources
  for (const src of initialSources) {
    await Source.findOneAndUpdate({ name: src.name }, { $setOnInsert: src }, { upsert: true });
  }

  // Labels
  for (const l of initialLabels) {
    await Label.findOneAndUpdate({ name: l.name }, { $setOnInsert: l }, { upsert: true });
  }

  // Categories
  for (const c of initialCategories) {
    await FollowupCategory.findOneAndUpdate({ name: c.name }, { $setOnInsert: c }, { upsert: true });
  }

  // Default Setting
  await Setting.findOneAndUpdate(
    { key: 'followup' },
    { $setOnInsert: { key: 'followup', allowedMinutes: 30, graceMinutes: 0 } },
    { upsert: true }
  );

  console.log('📦  Master data seeded successfully');
};
