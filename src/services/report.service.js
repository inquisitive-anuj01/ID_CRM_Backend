import Lead from '../models/Lead.model.js';
import Followup from '../models/Followup.model.js';
import LeadStatus from '../models/LeadStatus.model.js';
import Source from '../models/Source.model.js';
import User from '../models/User.model.js';
import { leadScope } from '../utils/scope.js';
import { TERMINAL_STATUSES } from '../config/constants.js';

const buildDateFilter = (query) => {
  const filter = {};
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }
  return filter;
};

export const getLeadsSummaryReport = async (user, query) => {
  const scope = leadScope(user);
  const dateFilter = buildDateFilter(query);

  const stats = await Lead.aggregate([
    { $match: { ...scope, ...dateFilter } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$estimateAmount' },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const statuses = await LeadStatus.find({ isActive: true }).sort({ order: 1 }).lean();
  const map = {};
  stats.forEach((s) => (map[s._id] = s));

  return statuses.map((st) => ({
    status: st,
    count: map[st.key]?.count || 0,
    totalAmount: map[st.key]?.totalAmount || 0,
    avgRating: Math.round((map[st.key]?.avgRating || 0) * 10) / 10,
  }));
};

export const getSourceReport = async (user, query) => {
  const scope = leadScope(user);
  const dateFilter = buildDateFilter(query);

  const stats = await Lead.aggregate([
    { $match: { ...scope, ...dateFilter } },
    {
      $group: {
        _id: '$source',
        totalLeads: { $sum: 1 },
        totalAmount: { $sum: '$estimateAmount' },
        convertedLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'confirm'] }, 1, 0] },
        },
      },
    },
  ]);

  const sources = await Source.find({ isActive: true }).lean();
  const sourceMap = {};
  sources.forEach((s) => (sourceMap[s._id.toString()] = s));

  return stats.map((s) => ({
    source: s._id ? sourceMap[s._id.toString()] || { name: 'Unknown' } : { name: 'Direct / Unspecified' },
    totalLeads: s.totalLeads,
    totalAmount: s.totalAmount,
    convertedLeads: s.convertedLeads,
    conversionRate: s.totalLeads > 0 ? Math.round((s.convertedLeads / s.totalLeads) * 100) : 0,
  }));
};

export const getUserPerformanceReport = async (user, query) => {
  if (user.role !== 'admin') {
    return [];
  }

  const dateFilter = buildDateFilter(query);

  const [leadStats, followupStats, users] = await Promise.all([
    Lead.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirm'] }, 1, 0] } },
          totalAmount: { $sum: '$estimateAmount' },
        },
      },
    ]),
    Followup.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$createdBy',
          totalFollowups: { $sum: 1 },
          inPolicy: { $sum: { $cond: [{ $eq: ['$policyStatus', 'inpolicy'] }, 1, 0] } },
        },
      },
    ]),
    User.find({ isActive: true }).select('name email avatar designation').lean(),
  ]);

  const leadMap = {};
  leadStats.forEach((l) => (leadMap[l._id?.toString()] = l));

  const followupMap = {};
  followupStats.forEach((f) => (followupMap[f._id?.toString()] = f));

  return users.map((u) => {
    const l = leadMap[u._id.toString()] || {};
    const f = followupMap[u._id.toString()] || {};
    return {
      user: u,
      totalAssigned: l.totalAssigned || 0,
      confirmed: l.confirmed || 0,
      totalAmount: l.totalAmount || 0,
      totalFollowups: f.totalFollowups || 0,
      inPolicyPct: f.totalFollowups ? Math.round((f.inPolicy / f.totalFollowups) * 100) : 100,
    };
  });
};

export const getFollowupComplianceReport = async (user, query) => {
  const dateFilter = buildDateFilter(query);
  const filter = { isDeleted: false, ...dateFilter };

  if (user.role !== 'admin') {
    filter.createdBy = user._id;
  } else if (query.userId) {
    filter.createdBy = query.userId;
  }

  const [stats] = await Followup.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        inPolicy: { $sum: { $cond: [{ $eq: ['$policyStatus', 'inpolicy'] }, 1, 0] } },
        outOfPolicy: { $sum: { $cond: [{ $eq: ['$policyStatus', 'outofpolicy'] }, 1, 0] } },
        completedOnTime: { $sum: { $cond: [{ $eq: ['$completedOnTime', true] }, 1, 0] } },
        totalCompleted: { $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] } },
      },
    },
  ]);

  if (!stats) {
    return { total: 0, inPolicyPct: 100, outOfPolicyPct: 0, onTimeCompletionPct: 100 };
  }

  return {
    total: stats.total,
    inPolicy: stats.inPolicy,
    outOfPolicy: stats.outOfPolicy,
    inPolicyPct: Math.round((stats.inPolicy / Math.max(stats.total, 1)) * 100),
    outOfPolicyPct: Math.round((stats.outOfPolicy / Math.max(stats.total, 1)) * 100),
    onTimeCompletionPct: Math.round(
      (stats.completedOnTime / Math.max(stats.totalCompleted, 1)) * 100
    ),
  };
};

export const getOverdueReport = async (user) => {
  const scope = leadScope(user);

  const leads = await Lead.find({
    ...scope,
    status: { $nin: TERMINAL_STATUSES },
    nextFollowupDate: { $lt: new Date() },
  })
    .populate('assignedTo', 'name email avatar')
    .sort({ nextFollowupDate: 1 })
    .limit(100);

  return leads.map((l) => ({
    _id: l._id,
    leadNo: l.leadNo,
    customerName: l.customerName,
    mobile: l.mobileFull || l.mobile,
    status: l.status,
    nextFollowupDate: l.nextFollowupDate,
    overdueByMinutes: l.overdueByMinutes,
    assignedTo: l.assignedTo,
  }));
};

export const getConversionReport = async (user, query) => {
  const scope = leadScope(user);
  const dateFilter = buildDateFilter(query);

  const [totalLeads, confirmedLeads, cancelledLeads] = await Promise.all([
    Lead.countDocuments({ ...scope, ...dateFilter }),
    Lead.countDocuments({ ...scope, ...dateFilter, status: 'confirm' }),
    Lead.countDocuments({ ...scope, ...dateFilter, status: 'cancel' }),
  ]);

  const activeLeads = totalLeads - confirmedLeads - cancelledLeads;
  const conversionRate = totalLeads > 0 ? Math.round((confirmedLeads / totalLeads) * 100) : 0;
  const cancellationRate = totalLeads > 0 ? Math.round((cancelledLeads / totalLeads) * 100) : 0;

  // Calculate avg days to close for confirmed leads
  const closedLeads = await Lead.find({
    ...scope,
    ...dateFilter,
    status: 'confirm',
    closedAt: { $ne: null },
  }).select('createdAt closedAt').lean();

  let totalDays = 0;
  closedLeads.forEach((l) => {
    const diff = (new Date(l.closedAt) - new Date(l.createdAt)) / (1000 * 60 * 60 * 24);
    totalDays += Math.max(0, diff);
  });
  const avgDaysToClose = closedLeads.length > 0 ? Math.round((totalDays / closedLeads.length) * 10) / 10 : 0;

  return {
    totalLeads,
    confirmedLeads,
    cancelledLeads,
    activeLeads,
    conversionRate,
    cancellationRate,
    avgDaysToClose,
  };
};
