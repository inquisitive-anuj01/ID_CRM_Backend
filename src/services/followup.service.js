import Followup from '../models/Followup.model.js';
import Lead from '../models/Lead.model.js';
import Setting from '../models/Setting.model.js';
import FollowupCategory from '../models/FollowupCategory.model.js';
import { logHistory } from './history.service.js';
import { ApiError } from '../utils/ApiError.js';
import { HISTORY_ACTIONS, LEAD_STATUS } from '../config/constants.js';

/**
 * Calculate followup policy parameters
 */
export const calcFollowupPolicy = (createdAt, nextFollowupDate, allowedMinutes = 30) => {
  const gapMinutes = Math.round((new Date(nextFollowupDate) - new Date(createdAt)) / 60000);
  const differenceMinutes = allowedMinutes - gapMinutes;
  const policyStatus = gapMinutes <= allowedMinutes ? 'inpolicy' : 'outofpolicy';

  return { gapMinutes, allowedMinutes, differenceMinutes, policyStatus };
};

/**
 * Add a followup to a lead
 */
import mongoose from 'mongoose';

export const createFollowup = async (leadId, actor, data, files = []) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw ApiError.notFound('Lead not found');

  let category = null;
  if (data.category) {
    if (mongoose.Types.ObjectId.isValid(data.category)) {
      category = await FollowupCategory.findById(data.category);
    }
    if (!category) {
      category = await FollowupCategory.findOne({
        name: { $regex: new RegExp(`^${data.category.trim()}$`, 'i') },
      });
    }
  }
  if (!category || !category.isActive) {
    // If not found or inactive, fallback to any active category if available
    category = await FollowupCategory.findOne({ isActive: true });
  }
  if (!category) throw ApiError.badRequest('Invalid or inactive followup category');

  const commentText = data.comment || data.remarks || '';

  const nfd = new Date(data.nextFollowupDate);
  const now = new Date();

  // Validate nextFollowupDate is not in the past (allow 1 minute grace)
  if (actor.role !== 'admin' && nfd.getTime() < now.getTime() - 60000) {
    throw ApiError.badRequest('Next followup date cannot be in the past');
  }

  const wsId = actor.workspace?._id || actor.workspace || lead.workspace;
  const setting = (await Setting.findOne({ workspace: wsId, key: 'followup' })) || (await Setting.findOne({ key: 'followup' })) || { allowedMinutes: 30, graceMinutes: 0 };

  // 1. Mark previous active followup as completed
  const previousFollowup = await Followup.findOne({
    lead: leadId,
    completedAt: null,
    isDeleted: false,
  }).sort({ createdAt: -1 });

  if (previousFollowup) {
    const graceMs = (setting.graceMinutes || 0) * 60000;
    const dueTime = new Date(previousFollowup.nextFollowupDate).getTime() + graceMs;
    previousFollowup.completedAt = now;
    previousFollowup.completedOnTime = now.getTime() <= dueTime;
    await previousFollowup.save();
  }

  // 2. Format attachments
  const attachments = files.map((file) => ({
    kind: file.mimetype.startsWith('audio/') ? 'voice' : 'file',
    url: `/uploads/${file.filename}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  }));

  // 3. Compute policy snapshot
  const policy = calcFollowupPolicy(now, nfd, setting.allowedMinutes);

  // 4. Create followup
  const followup = await Followup.create({
    workspace: wsId,
    lead: leadId,
    category: category._id,
    comment: commentText,
    nextFollowupDate: nfd,
    attachments,
    ...policy,
    leadStatusAtTime: lead.status,
    createdBy: actor._id,
  });

  // 5. Update lead state & auto-promote from 'new' to 'processing'
  lead.nextFollowupDate = nfd;
  lead.lastFollowupAt = now;
  lead.followupCount = (lead.followupCount || 0) + 1;

  let autoPromoted = false;
  if (lead.status === LEAD_STATUS.NEW) {
    lead.status = LEAD_STATUS.PROCESSING;
    lead.statusChangedAt = now;
    autoPromoted = true;
  }

  await lead.save();

  // 6. Log history
  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.FOLLOWUP_ADDED,
    note: `Followup added: ${category.name}`,
    meta: { followupId: followup._id },
  });

  if (autoPromoted) {
    await logHistory({
      leadId: lead._id,
      actorId: actor._id,
      action: HISTORY_ACTIONS.STATUS_CHANGED,
      changes: [{ field: 'status', from: LEAD_STATUS.NEW, to: LEAD_STATUS.PROCESSING }],
      note: 'Auto-promoted on first followup',
    });
  }

  return getFollowupById(followup._id);
};

export const getFollowupById = async (id) => {
  return Followup.findById(id)
    .populate('category', 'name')
    .populate('createdBy', 'name email avatar');
};

/**
 * List all followups for a lead
 */
export const listLeadFollowups = async (leadId) => {
  return Followup.find({ lead: leadId, isDeleted: false })
    .populate('category', 'name')
    .populate('createdBy', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Edit a followup
 */
export const updateFollowup = async (followupId, actor, data) => {
  const followup = await Followup.findById(followupId);
  if (!followup || followup.isDeleted) throw ApiError.notFound('Followup not found');

  // Staff can only edit their own followups
  if (actor.role !== 'admin' && followup.createdBy.toString() !== actor._id.toString()) {
    throw ApiError.forbidden('You can only edit your own followups');
  }

  const changes = [];

  if (data.comment !== undefined && followup.comment !== data.comment) {
    changes.push({ field: 'comment', from: followup.comment, to: data.comment });
    followup.comment = data.comment;
  }

  if (data.category && followup.category.toString() !== data.category) {
    changes.push({ field: 'category', from: followup.category, to: data.category });
    followup.category = data.category;
  }

  if (data.nextFollowupDate) {
    const newNfd = new Date(data.nextFollowupDate);
    changes.push({ field: 'nextFollowupDate', from: followup.nextFollowupDate, to: newNfd });
    followup.nextFollowupDate = newNfd;

    // Recalculate policy
    const setting = (await Setting.findOne({ key: 'followup' })) || { allowedMinutes: 30 };
    const policy = calcFollowupPolicy(followup.createdAt, newNfd, setting.allowedMinutes);
    Object.assign(followup, policy);

    // If this is the latest followup on the lead, sync lead.nextFollowupDate
    const latestFollowup = await Followup.findOne({ lead: followup.lead, isDeleted: false }).sort({ createdAt: -1 });
    if (latestFollowup && latestFollowup._id.toString() === followup._id.toString()) {
      await Lead.findByIdAndUpdate(followup.lead, { nextFollowupDate: newNfd });
    }
  }

  await followup.save();

  if (changes.length > 0) {
    await logHistory({
      leadId: followup.lead,
      actorId: actor._id,
      action: HISTORY_ACTIONS.FOLLOWUP_EDITED,
      changes,
      meta: { followupId: followup._id },
    });
  }

  return getFollowupById(followup._id);
};

/**
 * Soft delete a followup
 */
export const deleteFollowup = async (followupId, actor) => {
  const followup = await Followup.findById(followupId);
  if (!followup || followup.isDeleted) throw ApiError.notFound('Followup not found');

  if (actor.role !== 'admin' && followup.createdBy.toString() !== actor._id.toString()) {
    throw ApiError.forbidden('You can only delete your own followups');
  }

  followup.isDeleted = true;
  await followup.save();

  // Decrement followup count and sync latest nextFollowupDate
  const lead = await Lead.findById(followup.lead);
  if (lead) {
    lead.followupCount = Math.max(0, (lead.followupCount || 1) - 1);

    const latestRemaining = await Followup.findOne({
      lead: lead._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    lead.nextFollowupDate = latestRemaining ? latestRemaining.nextFollowupDate : null;
    await lead.save();

    // If this deleted followup completed a previous one, re-open the previous one
    await Followup.findOneAndUpdate(
      { lead: lead._id, completedAt: { $ne: null }, isDeleted: false },
      { $set: { completedAt: null, completedOnTime: null } },
      { sort: { createdAt: -1 } }
    );
  }

  await logHistory({
    leadId: followup.lead,
    actorId: actor._id,
    action: HISTORY_ACTIONS.FOLLOWUP_DELETED,
    note: 'Followup deleted',
    meta: { followupId: followup._id },
  });

  return { success: true };
};

/**
 * Get followups by filter (e.g. today, overdue, upcoming, all)
 */
export const getMyFollowups = async (actor, query = {}) => {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const baseFilter = { isDeleted: false };
  if (actor.role !== 'admin') {
    baseFilter.createdBy = actor._id;
  } else if (query.userId) {
    baseFilter.createdBy = query.userId;
  }

  // Build main filter based on `when`
  const filter = { ...baseFilter };
  const when = query.when || 'today';

  if (when === 'today') {
    filter.nextFollowupDate = { $gte: todayStart, $lte: todayEnd };
  } else if (when === 'overdue') {
    filter.nextFollowupDate = { $lt: todayStart };
    filter.completedAt = null;
  } else if (when === 'upcoming') {
    filter.nextFollowupDate = { $gt: todayEnd };
  }
  // 'all' → no date filter

  const followups = await Followup.find(filter)
    .populate('lead', 'leadNo customerName mobile companyName status')
    .populate('category', 'name')
    .sort({ nextFollowupDate: 1 })
    .limit(100)
    .lean();

  // Compute counts for badges
  const [todayCount, overdueCount] = await Promise.all([
    Followup.countDocuments({ ...baseFilter, nextFollowupDate: { $gte: todayStart, $lte: todayEnd } }),
    Followup.countDocuments({ ...baseFilter, nextFollowupDate: { $lt: todayStart }, completedAt: null }),
  ]);

  return { followups, counts: { today: todayCount, overdue: overdueCount } };
};

