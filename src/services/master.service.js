import LeadStatus from '../models/LeadStatus.model.js';
import Source from '../models/Source.model.js';
import Label from '../models/Label.model.js';
import FollowupCategory from '../models/FollowupCategory.model.js';
import Setting from '../models/Setting.model.js';
import Lead from '../models/Lead.model.js';
import { ApiError } from '../utils/ApiError.js';

// ─── Lead Statuses ────────────────────────────────────────────────────────────
export const listStatuses = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { isActive: true };
  return LeadStatus.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createStatus = async (data) => {
  const existing = await LeadStatus.findOne({ key: data.key });
  if (existing) throw ApiError.conflict(`Status key '${data.key}' already exists`);

  if (data.order === undefined) {
    const last = await LeadStatus.findOne().sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return LeadStatus.create(data);
};

export const updateStatus = async (id, data) => {
  const current = await LeadStatus.findById(id);
  if (!current) throw ApiError.notFound('Status not found');

  if (data.key && data.key !== current.key) {
    const existingKey = await LeadStatus.findOne({ key: data.key, _id: { $ne: id } });
    if (existingKey) throw ApiError.conflict(`Status key '${data.key}' already exists`);
    // Migrate any leads using the previous status key
    await Lead.updateMany({ status: current.key }, { $set: { status: data.key } });
  }

  const status = await LeadStatus.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  return status;
};

export const reorderStatuses = async (orders) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));
  await LeadStatus.bulkWrite(bulkOps);
  return listStatuses(true);
};

// ─── Sources ──────────────────────────────────────────────────────────────────
export const listSources = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { isActive: true };
  return Source.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createSource = async (data) => {
  const existing = await Source.findOne({ name: data.name });
  if (existing) throw ApiError.conflict(`Source '${data.name}' already exists`);

  if (data.order === undefined) {
    const last = await Source.findOne().sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return Source.create(data);
};

export const updateSource = async (id, data) => {
  const source = await Source.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!source) throw ApiError.notFound('Source not found');
  return source;
};

export const reorderSources = async (orders) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));
  await Source.bulkWrite(bulkOps);
  return listSources(true);
};

// ─── Labels ───────────────────────────────────────────────────────────────────
export const listLabels = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { isActive: true };
  return Label.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createLabel = async (data) => {
  const existing = await Label.findOne({ name: data.name });
  if (existing) throw ApiError.conflict(`Label '${data.name}' already exists`);

  if (data.order === undefined) {
    const last = await Label.findOne().sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return Label.create(data);
};

export const updateLabel = async (id, data) => {
  const label = await Label.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!label) throw ApiError.notFound('Label not found');
  return label;
};

export const reorderLabels = async (orders) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));
  await Label.bulkWrite(bulkOps);
  return listLabels(true);
};

// ─── Followup Categories ──────────────────────────────────────────────────────
export const listCategories = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { isActive: true };
  return FollowupCategory.find(filter).sort({ order: 1, createdAt: 1 }).lean();
};

export const createCategory = async (data) => {
  const existing = await FollowupCategory.findOne({ name: data.name });
  if (existing) throw ApiError.conflict(`Category '${data.name}' already exists`);

  if (data.order === undefined) {
    const last = await FollowupCategory.findOne().sort({ order: -1 }).select('order');
    data.order = last && typeof last.order === 'number' ? last.order + 1 : 0;
  }

  return FollowupCategory.create(data);
};

export const updateCategory = async (id, data) => {
  const cat = await FollowupCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!cat) throw ApiError.notFound('Category not found');
  return cat;
};

export const reorderCategories = async (orders) => {
  const bulkOps = orders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));
  await FollowupCategory.bulkWrite(bulkOps);
  return listCategories(true);
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSetting = async () => {
  let setting = await Setting.findOne({ key: 'followup' });
  if (!setting) {
    setting = await Setting.create({ key: 'followup' });
  }
  return setting;
};

export const updateSetting = async (data) => {
  const setting = await Setting.findOneAndUpdate(
    { key: 'followup' },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  );
  return setting;
};

export const deleteStatus = async (id) => {
  const status = await LeadStatus.findByIdAndDelete(id);
  if (!status) throw ApiError.notFound('Status not found');
  return status;
};

export const deleteSource = async (id) => {
  const source = await Source.findByIdAndDelete(id);
  if (!source) throw ApiError.notFound('Source not found');
  return source;
};

export const deleteLabel = async (id) => {
  const label = await Label.findByIdAndDelete(id);
  if (!label) throw ApiError.notFound('Label not found');
  return label;
};

export const deleteCategory = async (id) => {
  const cat = await FollowupCategory.findByIdAndDelete(id);
  if (!cat) throw ApiError.notFound('Category not found');
  return cat;
};
