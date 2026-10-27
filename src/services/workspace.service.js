import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

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

export const seedWorkspaceDefaults = async (workspaceId) => {
  // Statuses
  for (const s of initialStatuses) {
    await LeadStatus.findOneAndUpdate(
      { workspace: workspaceId, key: s.key },
      { $setOnInsert: { ...s, workspace: workspaceId } },
      { upsert: true }
    );
  }

  // Sources
  for (const src of initialSources) {
    await Source.findOneAndUpdate(
      { workspace: workspaceId, name: src.name },
      { $setOnInsert: { ...src, workspace: workspaceId } },
      { upsert: true }
    );
  }

  // Labels
  for (const l of initialLabels) {
    await Label.findOneAndUpdate(
      { workspace: workspaceId, name: l.name },
      { $setOnInsert: { ...l, workspace: workspaceId } },
      { upsert: true }
    );
  }

  // Categories
  for (const c of initialCategories) {
    await FollowupCategory.findOneAndUpdate(
      { workspace: workspaceId, name: c.name },
      { $setOnInsert: { ...c, workspace: workspaceId } },
      { upsert: true }
    );
  }

  // Setting
  await Setting.findOneAndUpdate(
    { workspace: workspaceId, key: 'followup' },
    { $setOnInsert: { workspace: workspaceId, key: 'followup', allowedMinutes: 30, graceMinutes: 0 } },
    { upsert: true }
  );
};

export const createWorkspace = async ({ companyName, companySize, name, email, password }) => {
  if (!companyName || !name || !email || !password) {
    throw ApiError.badRequest('Company name, admin name, email, and password are required');
  }

  const cleanEmail = email.toLowerCase().trim();
  let baseSlug = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workspace';

  let slug = baseSlug;
  let counter = 1;
  while (await Workspace.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Create workspace
  const workspace = await Workspace.create({
    name: companyName.trim(),
    slug,
    companySize: companySize || '',
    isActive: true,
  });

  // Create admin user
  const user = await User.create({
    workspace: workspace._id,
    name: name.trim(),
    email: cleanEmail,
    password,
    role: 'admin',
    designation: 'Workspace Administrator',
    isActive: true,
  });

  // Seed default masters for this workspace
  await seedWorkspaceDefaults(workspace._id);

  // Sign tokens
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    workspace: workspace._id.toString(),
  };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    workspace,
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
};

export const getWorkspaceById = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');
  return workspace;
};

export const renameWorkspace = async (workspaceId, name) => {
  if (!name || !name.trim()) throw ApiError.badRequest('Workspace name is required');
  const workspace = await Workspace.findByIdAndUpdate(
    workspaceId,
    { name: name.trim() },
    { new: true }
  );
  if (!workspace) throw ApiError.notFound('Workspace not found');
  return workspace;
};

export const deleteWorkspace = async (workspaceId, actor) => {
  if (actor.role !== 'admin') {
    throw ApiError.forbidden('Only workspace admin can delete the workspace');
  }

  // Cascading hard delete of all data strictly from database
  await Promise.all([
    Lead.deleteMany({ workspace: workspaceId }),
    Customer.deleteMany({ workspace: workspaceId }),
    Followup.deleteMany({ workspace: workspaceId }),
    FollowupCategory.deleteMany({ workspace: workspaceId }),
    Label.deleteMany({ workspace: workspaceId }),
    LeadHistory.deleteMany({ workspace: workspaceId }),
    LeadStatus.deleteMany({ workspace: workspaceId }),
    Meeting.deleteMany({ workspace: workspaceId }),
    Note.deleteMany({ workspace: workspaceId }),
    Notification.deleteMany({ workspace: workspaceId }),
    Reminder.deleteMany({ workspace: workspaceId }),
    Setting.deleteMany({ workspace: workspaceId }),
    Source.deleteMany({ workspace: workspaceId }),
    Task.deleteMany({ workspace: workspaceId }),
    Todo.deleteMany({ workspace: workspaceId }),
    Counter.deleteMany({ workspace: workspaceId }),
    User.deleteMany({ workspace: workspaceId }),
    Workspace.findByIdAndDelete(workspaceId),
  ]);

  return { success: true };
};
