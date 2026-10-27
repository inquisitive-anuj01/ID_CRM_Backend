import LeadStatus from '../models/LeadStatus.model.js';
import Source from '../models/Source.model.js';
import Label from '../models/Label.model.js';
import FollowupCategory from '../models/FollowupCategory.model.js';
import Setting from '../models/Setting.model.js';
import Lead from '../models/Lead.model.js';
import { ApiError } from '../utils/ApiError.js';

// ─── Lead Statuses ────────────────────────────────────────────────────────────
export const listStatuses = async (includeInactive = false, workspaceId = null) => {
  const filter = includeInactive ? {} : { isActive: true };
  if (workspaceId) filter.workspace = workspaceId;
  return LeadStatus.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createStatus = async (data, workspaceId = null) => {
  const filter = { key: data.key };
  if (workspaceId) filter.workspace = workspaceId;

  const existing = await LeadStatus.findOne(filter);
  if (existing) throw ApiError.conflict(`Status key '${data.key}' already exists in this workspace`);

  if (data.order === undefined) {
    const last = await LeadStatus.findOne(workspaceId ? { workspace: workspaceId } : {}).sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return LeadStatus.create({ ...data, ...(workspaceId && { workspace: workspaceId }) });
};

export const updateStatus = async (id, data, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;

  const current = await LeadStatus.findOne(query);
  if (!current) throw ApiError.notFound('Status not found');

  if (data.key && data.key !== current.key) {
    const existingKey = await LeadStatus.findOne({
      key: data.key,
      _id: { $ne: id },
      ...(workspaceId && { workspace: workspaceId }),
    });
    if (existingKey) throw ApiError.conflict(`Status key '${data.key}' already exists in this workspace`);
    // Migrate any leads using the previous status key in this workspace
    const leadFilter = { status: current.key };
    if (workspaceId) leadFilter.workspace = workspaceId;
    await Lead.updateMany(leadFilter, { $set: { status: data.key } });
  }

  const status = await LeadStatus.findOneAndUpdate(query, data, { new: true, runValidators: true });
  return status;
};

export const reorderStatuses = async (orders, workspaceId = null) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, ...(workspaceId && { workspace: workspaceId }) },
      update: { $set: { order } },
    },
  }));
  await LeadStatus.bulkWrite(bulkOps);
  return listStatuses(true, workspaceId);
};

// ─── Sources ──────────────────────────────────────────────────────────────────
export const listSources = async (includeInactive = false, workspaceId = null) => {
  const filter = includeInactive ? {} : { isActive: true };
  if (workspaceId) filter.workspace = workspaceId;
  return Source.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createSource = async (data, workspaceId = null) => {
  const filter = { name: data.name };
  if (workspaceId) filter.workspace = workspaceId;

  const existing = await Source.findOne(filter);
  if (existing) throw ApiError.conflict(`Source '${data.name}' already exists in this workspace`);

  if (data.order === undefined) {
    const last = await Source.findOne(workspaceId ? { workspace: workspaceId } : {}).sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return Source.create({ ...data, ...(workspaceId && { workspace: workspaceId }) });
};

export const updateSource = async (id, data, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;

  const source = await Source.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!source) throw ApiError.notFound('Source not found');
  return source;
};

export const reorderSources = async (orders, workspaceId = null) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, ...(workspaceId && { workspace: workspaceId }) },
      update: { $set: { order } },
    },
  }));
  await Source.bulkWrite(bulkOps);
  return listSources(true, workspaceId);
};

// ─── Labels ───────────────────────────────────────────────────────────────────
export const listLabels = async (includeInactive = false, workspaceId = null) => {
  const filter = includeInactive ? {} : { isActive: true };
  if (workspaceId) filter.workspace = workspaceId;
  return Label.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createLabel = async (data, workspaceId = null) => {
  const filter = { name: data.name };
  if (workspaceId) filter.workspace = workspaceId;

  const existing = await Label.findOne(filter);
  if (existing) throw ApiError.conflict(`Label '${data.name}' already exists in this workspace`);

  if (data.order === undefined) {
    const last = await Label.findOne(workspaceId ? { workspace: workspaceId } : {}).sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return Label.create({ ...data, ...(workspaceId && { workspace: workspaceId }) });
};

export const updateLabel = async (id, data, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;

  const label = await Label.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!label) throw ApiError.notFound('Label not found');
  return label;
};

export const reorderLabels = async (orders, workspaceId = null) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, ...(workspaceId && { workspace: workspaceId }) },
      update: { $set: { order } },
    },
  }));
  await Label.bulkWrite(bulkOps);
  return listLabels(true, workspaceId);
};

// ─── Followup Categories ──────────────────────────────────────────────────────
export const listCategories = async (includeInactive = false, workspaceId = null) => {
  const filter = includeInactive ? {} : { isActive: true };
  if (workspaceId) filter.workspace = workspaceId;
  return FollowupCategory.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createCategory = async (data, workspaceId = null) => {
  const filter = { name: data.name };
  if (workspaceId) filter.workspace = workspaceId;

  const existing = await FollowupCategory.findOne(filter);
  if (existing) throw ApiError.conflict(`Category '${data.name}' already exists in this workspace`);

  if (data.order === undefined) {
    const last = await FollowupCategory.findOne(workspaceId ? { workspace: workspaceId } : {}).sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return FollowupCategory.create({ ...data, ...(workspaceId && { workspace: workspaceId }) });
};

export const updateCategory = async (id, data, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;

  const cat = await FollowupCategory.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!cat) throw ApiError.notFound('Category not found');
  return cat;
};

export const reorderCategories = async (orders, workspaceId = null) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, ...(workspaceId && { workspace: workspaceId }) },
      update: { $set: { order } },
    },
  }));
  await FollowupCategory.bulkWrite(bulkOps);
  return listCategories(true, workspaceId);
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSetting = async (workspaceId = null) => {
  const query = { key: 'followup' };
  if (workspaceId) query.workspace = workspaceId;

  let setting = await Setting.findOne(query);
  if (!setting) {
    setting = await Setting.create({ key: 'followup', ...(workspaceId && { workspace: workspaceId }) });
  }
  return setting;
};

export const updateSetting = async (data, workspaceId = null) => {
  const query = { key: 'followup' };
  if (workspaceId) query.workspace = workspaceId;

  const setting = await Setting.findOneAndUpdate(
    query,
    { $set: data, ...(workspaceId && { $setOnInsert: { workspace: workspaceId, key: 'followup' } }) },
    { new: true, upsert: true, runValidators: true }
  );
  return setting;
};

export const deleteStatus = async (id, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;
  const status = await LeadStatus.findOneAndDelete(query);
  if (!status) throw ApiError.notFound('Status not found');
  return status;
};

export const deleteSource = async (id, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;
  const source = await Source.findOneAndDelete(query);
  if (!source) throw ApiError.notFound('Source not found');
  return source;
};

export const deleteLabel = async (id, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;
  const label = await Label.findOneAndDelete(query);
  if (!label) throw ApiError.notFound('Label not found');
  return label;
};

export const deleteCategory = async (id, workspaceId = null) => {
  const query = { _id: id };
  if (workspaceId) query.workspace = workspaceId;
  const cat = await FollowupCategory.findOneAndDelete(query);
  if (!cat) throw ApiError.notFound('Category not found');
  return cat;
};
