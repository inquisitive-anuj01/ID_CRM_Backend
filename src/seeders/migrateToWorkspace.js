import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Workspace from '../models/Workspace.model.js';
import User from '../models/User.model.js';
import Lead from '../models/Lead.model.js';
import Customer from '../models/Customer.model.js';
import Followup from '../models/Followup.model.js';
import FollowupCategory from '../models/FollowupCategory.model.js';
import Label from '../models/Label.model.js';
import LeadHistory from '../models/LeadHistory.model.js';
import LeadStatus from '../models/LeadStatus.model.js';
import Meeting from '../models/Meeting.model.js';
import Note from '../models/Note.model.js';
import Notification from '../models/Notification.model.js';
import Reminder from '../models/Reminder.model.js';
import Setting from '../models/Setting.model.js';
import Source from '../models/Source.model.js';
import Task from '../models/Task.model.js';
import Todo from '../models/Todo.model.js';
import Counter from '../models/Counter.model.js';

export const runWorkspaceMigration = async () => {
  console.log('🔄 Starting Workspace Data Migration...');

  // 1. Find or create default 'Inquisitive Digital' workspace
  let workspace = await Workspace.findOne({ slug: 'inquisitive-digital' });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'Inquisitive Digital',
      slug: 'inquisitive-digital',
      companySize: '11-50',
      isActive: true,
    });
    console.log(`✅ Created default workspace: ${workspace.name} (${workspace._id})`);
  } else {
    console.log(`ℹ️ Existing default workspace found: ${workspace.name} (${workspace._id})`);
  }

  const wsFilter = { $or: [{ workspace: { $exists: false } }, { workspace: null }] };
  const wsUpdate = { $set: { workspace: workspace._id } };

  // 2. Migrate User collection
  const userRes = await User.updateMany(wsFilter, wsUpdate);
  console.log(`👤 Users stamped with workspace: ${userRes.modifiedCount}`);

  // 3. Drop legacy unique indexes safely if they exist
  const dropIndexSafe = async (model, indexName) => {
    try {
      await model.collection.dropIndex(indexName);
      console.log(`Index ${indexName} dropped from ${model.modelName}`);
    } catch {
      // index might not exist, ignore
    }
  };

  await dropIndexSafe(User, 'email_1');
  await dropIndexSafe(Source, 'name_1');
  await dropIndexSafe(Label, 'name_1');
  await dropIndexSafe(FollowupCategory, 'name_1');
  await dropIndexSafe(LeadStatus, 'key_1');
  await dropIndexSafe(Setting, 'key_1');

  // 4. Migrate all other collections
  const collections = [
    { name: 'Lead', model: Lead },
    { name: 'Customer', model: Customer },
    { name: 'Followup', model: Followup },
    { name: 'FollowupCategory', model: FollowupCategory },
    { name: 'Label', model: Label },
    { name: 'LeadHistory', model: LeadHistory },
    { name: 'LeadStatus', model: LeadStatus },
    { name: 'Meeting', model: Meeting },
    { name: 'Note', model: Note },
    { name: 'Notification', model: Notification },
    { name: 'Reminder', model: Reminder },
    { name: 'Setting', model: Setting },
    { name: 'Source', model: Source },
    { name: 'Task', model: Task },
    { name: 'Todo', model: Todo },
    { name: 'Counter', model: Counter },
  ];

  for (const { name, model } of collections) {
    const res = await model.updateMany(wsFilter, wsUpdate);
    if (res.modifiedCount > 0) {
      console.log(`📦 ${name}: updated ${res.modifiedCount} records`);
    }
  }

  // 5. Ensure indexes are built
  await User.syncIndexes();
  await Lead.syncIndexes();
  await Setting.syncIndexes();
  await Source.syncIndexes();
  await Label.syncIndexes();
  await LeadStatus.syncIndexes();
  await FollowupCategory.syncIndexes();

  console.log('🎉 Workspace Data Migration completed successfully!');
  return workspace;
};

// Allow direct CLI execution: node src/seeders/migrateToWorkspace.js
if (process.argv[1]?.endsWith('migrateToWorkspace.js')) {
  (async () => {
    try {
      const mongoUri = env.MONGODB_URI || env.MONGO_URI || process.env.MONGO_URI;
      if (!mongoUri) throw new Error('MONGO_URI not set in environment');
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected for migration.');
      await runWorkspaceMigration();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err.message);
      process.exit(1);
    }
  })();
}
