import Lead from '../models/Lead.model.js';
import User from '../models/User.model.js';
import LeadStatus from '../models/LeadStatus.model.js';
import Setting from '../models/Setting.model.js';
import { getNextSequence } from '../models/Counter.model.js';
import { logHistory } from './history.service.js';
import { createNotification } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';
import {
  HISTORY_ACTIONS,
  NOTIFICATION_TYPES,
  TERMINAL_STATUSES,
  LEAD_NO_PREFIX,
  LEAD_NO_PADDING,
} from '../config/constants.js';

/**
 * Generate formatted lead number, e.g. L-000001
 */
export const generateLeadNumber = async () => {
  const seq = await getNextSequence('lead');
  return `${LEAD_NO_PREFIX}${String(seq).padStart(LEAD_NO_PADDING, '0')}`;
};

/**
 * Clean phone numbers to standard format
 */
export const formatMobile = (countryCode = '+91', mobile = '') => {
  const cleanCC = countryCode.replace(/[^0-9+]/g, '');
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  const ccDigits = cleanCC.replace('+', '');
  const mobileFull = `${ccDigits}${cleanMobile}`;
  return { countryCode: cleanCC, mobile: cleanMobile, mobileFull };
};

/**
 * Calculate estimate amount from label breakdowns
 */
export const calculateEstimateAmount = (labels = [], fallbackAmount = 0) => {
  if (labels && labels.length > 0) {
    const sum = labels.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    if (sum > 0) return sum;
  }
  return Number(fallbackAmount) || 0;
};

/**
 * Create a new lead
 */
export const createLead = async (actor, data) => {
  const { countryCode, mobile, mobileFull } = formatMobile(data.countryCode, data.mobile);

  // Calculate estimate amount from labels if provided
  const estimateAmount = calculateEstimateAmount(data.labels, data.estimateAmount);

  // Generate unique lead number
  const leadNo = await generateLeadNumber();

  const assignedTo = data.assignedTo || actor._id;

  const lead = await Lead.create({
    ...data,
    leadNo,
    countryCode,
    mobile,
    mobileFull,
    estimateAmount,
    createdBy: actor._id,
    assignedTo,
    status: data.status || 'new',
    statusChangedAt: new Date(),
  });

  // Log creation in history
  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.LEAD_CREATED,
    note: `Lead ${leadNo} created`,
  });

  // Notify assigned user if different from creator
  if (assignedTo.toString() !== actor._id.toString()) {
    await createNotification({
      userId: assignedTo,
      type: NOTIFICATION_TYPES.LEAD_ASSIGNED,
      title: 'New Lead Assigned',
      body: `You have been assigned lead ${lead.leadNo} (${lead.customerName})`,
      link: { entity: 'lead', id: lead._id },
    });
  }

  return getLeadById(lead._id);
};

/**
 * Get lead details with populated references
 */
export const getLeadById = async (leadId) => {
  const lead = await Lead.findById(leadId)
    .populate('source', 'name type')
    .populate('labels.label', 'name color defaultAmount')
    .populate('createdBy', 'name email avatar role')
    .populate('assignedTo', 'name email avatar role designation');

  if (!lead || lead.isDeleted) {
    throw ApiError.notFound('Lead not found');
  }

  return lead;
};

/**
 * Update lead general details
 */
export const updateLead = async (lead, actor, data) => {
  const changes = [];
  const textFields = ['customerName', 'email', 'companyName', 'address', 'comment', 'reference', 'leadDate'];

  textFields.forEach((field) => {
    if (data[field] !== undefined) {
      const currentVal = lead[field] !== undefined && lead[field] !== null ? String(lead[field]) : '';
      const newVal = data[field] !== undefined && data[field] !== null ? String(data[field]) : '';
      if (currentVal !== newVal) {
        changes.push({ field, from: lead[field], to: data[field] });
        lead[field] = data[field] || undefined;
      }
    }
  });

  if (data.source !== undefined) {
    const currentSource = lead.source ? String(lead.source) : '';
    const newSource = data.source ? String(data.source) : '';
    if (currentSource !== newSource) {
      changes.push({ field: 'source', from: lead.source, to: data.source || null });
      lead.source = data.source ? data.source : null;
    }
  }

  if (data.mobile) {
    const { countryCode, mobile, mobileFull } = formatMobile(data.countryCode || lead.countryCode, data.mobile);
    if (lead.mobile !== mobile || lead.countryCode !== countryCode) {
      changes.push({ field: 'mobile', from: `${lead.countryCode} ${lead.mobile}`, to: `${countryCode} ${mobile}` });
      lead.mobile = mobile;
      lead.countryCode = countryCode;
      lead.mobileFull = mobileFull;
    }
  }

  if (data.status && data.status !== lead.status) {
    changes.push({ field: 'status', from: lead.status, to: data.status });
    lead.status = data.status;
    lead.statusChangedAt = new Date();
    if (TERMINAL_STATUSES.includes(data.status)) {
      lead.closedAt = new Date();
    }
  }

  if (data.assignedTo && String(data.assignedTo) !== String(lead.assignedTo || '')) {
    changes.push({ field: 'assignedTo', from: lead.assignedTo, to: data.assignedTo });
    lead.assignedTo = data.assignedTo;

    // Send notification to newly assigned user
    try {
      await createNotification({
        userId: data.assignedTo,
        type: NOTIFICATION_TYPES.LEAD_ASSIGNED,
        title: 'Lead Reassigned',
        message: `Lead ${lead.customerName} (${lead.leadNo}) has been reassigned to you`,
        leadId: lead._id,
      });
    } catch {}
  }

  if (data.labels !== undefined) {
    lead.labels = data.labels;
    changes.push({ field: 'labels', from: 'updated', to: 'updated' });
  }

  if (data.estimateAmount !== undefined && data.estimateAmount !== lead.estimateAmount) {
    changes.push({ field: 'estimateAmount', from: lead.estimateAmount, to: data.estimateAmount });
    lead.estimateAmount = data.estimateAmount;
  }

  if (data.rating !== undefined && data.rating !== lead.rating) {
    changes.push({ field: 'rating', from: lead.rating, to: data.rating });
    lead.rating = data.rating;
  }

  await lead.save();

  if (changes.length > 0) {
    await logHistory({
      leadId: lead._id,
      actorId: actor._id,
      action: HISTORY_ACTIONS.LEAD_UPDATED,
      changes,
    });
  }

  return getLeadById(lead._id);
};

/**
 * Change lead status
 */
export const updateLeadStatus = async (lead, actor, { status, cancelReason }) => {
  const statusDoc = await LeadStatus.findOne({ key: status, isActive: true });
  if (!statusDoc) throw ApiError.badRequest(`Invalid or inactive status '${status}'`);

  if (status === 'cancel' && !cancelReason) {
    throw ApiError.validation('Cancel reason is required when status is cancel', [
      { field: 'cancelReason', message: 'Required when cancelling a lead' },
    ]);
  }

  const prevStatus = lead.status;
  if (prevStatus === status) return lead;

  // Reopening check
  if (TERMINAL_STATUSES.includes(prevStatus) && !TERMINAL_STATUSES.includes(status)) {
    if (actor.role !== 'admin') {
      throw ApiError.forbidden('Only admin can reopen a confirmed or cancelled lead');
    }
    lead.closedAt = null;
  }

  lead.status = status;
  lead.statusChangedAt = new Date();

  if (statusDoc.isTerminal) {
    lead.closedAt = new Date();
    lead.nextFollowupDate = null; // Stops overdue trigger
  }

  if (status === 'cancel') {
    lead.cancelReason = cancelReason;
  } else {
    lead.cancelReason = undefined;
  }

  await lead.save();

  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.STATUS_CHANGED,
    changes: [{ field: 'status', from: prevStatus, to: status }],
    note: cancelReason ? `Reason: ${cancelReason}` : '',
  });

  // Notify assignee if someone else changed status
  if (lead.assignedTo.toString() !== actor._id.toString()) {
    await createNotification({
      userId: lead.assignedTo,
      type: NOTIFICATION_TYPES.STATUS_CHANGED,
      title: 'Lead Status Updated',
      body: `Status of ${lead.leadNo} changed to ${statusDoc.name}`,
      link: { entity: 'lead', id: lead._id },
    });
  }

  return getLeadById(lead._id);
};

/**
 * Transfer lead to another user
 */
export const assignLead = async (lead, actor, targetUserId) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser || !targetUser.isActive) {
    throw ApiError.badRequest('Assigned user is invalid or inactive');
  }

  const prevAssignee = lead.assignedTo;
  if (prevAssignee.toString() === targetUserId.toString()) return lead;

  lead.assignedTo = targetUserId;
  await lead.save();

  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.ASSIGNED,
    changes: [{ field: 'assignedTo', from: prevAssignee, to: targetUserId }],
    note: `Assigned to ${targetUser.name}`,
  });

  // Notify new assignee
  await createNotification({
    userId: targetUserId,
    type: NOTIFICATION_TYPES.LEAD_TRANSFERRED,
    title: 'Lead Transferred to You',
    body: `Lead ${lead.leadNo} (${lead.customerName}) was assigned to you`,
    link: { entity: 'lead', id: lead._id },
  });

  return getLeadById(lead._id);
};

/**
 * Update labels and recompute estimateAmount
 */
export const updateLeadLabels = async (lead, actor, labels) => {
  const prevLabels = lead.labels;
  lead.labels = labels;

  const newEstimate = calculateEstimateAmount(labels, lead.estimateAmount);
  lead.estimateAmount = newEstimate;

  await lead.save();

  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.LABELS_CHANGED,
    changes: [{ field: 'labels', from: prevLabels, to: labels }],
  });

  return getLeadById(lead._id);
};

/**
 * Update rating
 */
export const updateLeadRating = async (lead, actor, rating) => {
  const prevRating = lead.rating;
  lead.rating = rating;
  await lead.save();

  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.RATING_CHANGED,
    changes: [{ field: 'rating', from: prevRating, to: rating }],
  });

  return getLeadById(lead._id);
};

/**
 * Soft delete a lead
 */
export const deleteLead = async (lead, actor) => {
  if (actor.role !== 'admin') {
    const setting = await Setting.findOne({ key: 'followup' });
    if (!setting?.staffCanDeleteOwnLead) {
      throw ApiError.forbidden('Only admin can delete leads');
    }
  }

  lead.isDeleted = true;
  lead.deletedAt = new Date();
  lead.deletedBy = actor._id;
  await lead.save();

  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.LEAD_DELETED,
    note: 'Lead deleted',
  });

  return { success: true };
};

/**
 * Restore soft-deleted lead (Admin only)
 */
export const restoreLead = async (leadId, actor) => {
  const lead = await Lead.findById(leadId);
  if (!lead) throw ApiError.notFound('Lead not found');

  lead.isDeleted = false;
  lead.deletedAt = null;
  lead.deletedBy = null;
  await lead.save();

  await logHistory({
    leadId: lead._id,
    actorId: actor._id,
    action: HISTORY_ACTIONS.LEAD_RESTORED,
    note: 'Lead restored by admin',
  });

  return getLeadById(lead._id);
};

/**
 * Duplicate check by mobile number
 */
export const checkDuplicate = async (mobile, countryCode = '+91') => {
  if (!mobile) return [];
  const { cleanMobile, mobileFull } = formatMobile(countryCode, mobile);

  return Lead.find({
    isDeleted: false,
    $or: [{ mobile: cleanMobile }, { mobileFull }],
  })
    .select('leadNo customerName mobile status assignedTo createdAt')
    .populate('assignedTo', 'name')
    .limit(5)
    .lean();
};

/**
 * Bulk assign leads to a user
 */
export const bulkAssign = async (ids, targetUserId, actor) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser || !targetUser.isActive) {
    throw ApiError.badRequest('Target user not found or inactive');
  }

  const leads = await Lead.find({ _id: { $in: ids }, isDeleted: false });

  for (const lead of leads) {
    const prev = lead.assignedTo;
    lead.assignedTo = targetUserId;
    await lead.save();

    await logHistory({
      leadId: lead._id,
      actorId: actor._id,
      action: HISTORY_ACTIONS.ASSIGNED,
      changes: [{ field: 'assignedTo', from: prev, to: targetUserId }],
      note: `Bulk assigned to ${targetUser.name}`,
    });
  }

  // Notify target user
  await createNotification({
    userId: targetUserId,
    type: NOTIFICATION_TYPES.LEAD_ASSIGNED,
    title: 'Bulk Leads Assigned',
    body: `${leads.length} leads have been assigned to you`,
  });

  return { updated: leads.length };
};

/**
 * Bulk status update
 */
export const bulkStatus = async (ids, status, cancelReason, actor) => {
  const statusDoc = await LeadStatus.findOne({ key: status, isActive: true });
  if (!statusDoc) throw ApiError.badRequest(`Invalid or inactive status '${status}'`);

  if (status === 'cancel' && !cancelReason) {
    throw ApiError.badRequest('Cancel reason is required for bulk cancellation');
  }

  const leads = await Lead.find({ _id: { $in: ids }, isDeleted: false });

  for (const lead of leads) {
    const prev = lead.status;
    lead.status = status;
    lead.statusChangedAt = new Date();
    if (statusDoc.isTerminal) {
      lead.closedAt = new Date();
      lead.nextFollowupDate = null;
    }
    if (status === 'cancel') lead.cancelReason = cancelReason;
    await lead.save();

    await logHistory({
      leadId: lead._id,
      actorId: actor._id,
      action: HISTORY_ACTIONS.STATUS_CHANGED,
      changes: [{ field: 'status', from: prev, to: status }],
      note: cancelReason ? `Reason: ${cancelReason}` : '',
    });
  }

  return { updated: leads.length };
};
