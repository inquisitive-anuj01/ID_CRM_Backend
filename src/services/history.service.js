import LeadHistory from '../models/LeadHistory.model.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';

export const logHistory = async ({ leadId, actorId, action, changes = [], note = '', meta = {} }) => {
  try {
    return await LeadHistory.create({
      lead: leadId,
      actor: actorId,
      action,
      changes,
      note,
      meta,
    });
  } catch (err) {
    console.error('Failed to write history log:', err);
  }
};

export const getLeadHistory = async (leadId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const [items, total] = await Promise.all([
    LeadHistory.find({ lead: leadId })
      .populate('actor', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LeadHistory.countDocuments({ lead: leadId }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
};
