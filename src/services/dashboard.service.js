import Lead from '../models/Lead.model.js';
import Followup from '../models/Followup.model.js';
import { leadScope } from '../utils/scope.js';
import {
  startOfToday,
  endOfToday,
  startOfYesterday,
  endOfYesterday,
  vsYesterdayPct,
} from '../utils/dateHelpers.js';
import { TERMINAL_STATUSES, LEAD_STATUS } from '../config/constants.js';

export const getDashboardSummary = async (user, queryUserId) => {
  const wsId = user.workspace?._id || user.workspace;
  const targetUser = user.role === 'admin' && queryUserId ? { _id: queryUserId, role: 'staff', workspace: wsId } : user;
  const scope = leadScope(targetUser);

  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const yestStart = startOfYesterday();
  const yestEnd = endOfYesterday();

  // 1. Leads created today vs yesterday
  const [todayLeads, yestLeads] = await Promise.all([
    Lead.countDocuments({ ...scope, createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Lead.countDocuments({ ...scope, createdAt: { $gte: yestStart, $lte: yestEnd } }),
  ]);
  const leadsDiffPct = vsYesterdayPct(todayLeads, yestLeads);

  // 2. Followups due today
  const followupsDueToday = await Lead.countDocuments({
    ...scope,
    status: { $nin: TERMINAL_STATUSES },
    nextFollowupDate: { $gte: todayStart, $lte: todayEnd },
  });

  // 3. Followups completed today
  const completedFilter = {
    isDeleted: false,
    completedAt: { $gte: todayStart, $lte: todayEnd },
    ...(wsId && { workspace: wsId }),
  };
  if (targetUser.role !== 'admin') {
    completedFilter.createdBy = targetUser._id;
  }
  const followupsCompletedToday = await Followup.countDocuments(completedFilter);

  // Followups completion percentage
  const totalFollowupsTarget = Math.max(followupsDueToday, followupsCompletedToday);
  const followupCompletionPct =
    totalFollowupsTarget > 0 ? Math.round((followupsCompletedToday / totalFollowupsTarget) * 100) : 100;

  // 4. Overdue leads count
  const overdueCount = await Lead.countDocuments({
    ...scope,
    status: { $nin: TERMINAL_STATUSES },
    nextFollowupDate: { $lt: new Date() },
  });

  // 5. Total active leads & total pipeline value
  const activeLeadsCount = await Lead.countDocuments({
    ...scope,
    status: { $nin: TERMINAL_STATUSES },
  });

  const wonCount = await Lead.countDocuments({
    ...scope,
    status: LEAD_STATUS.CONFIRM,
  });

  // Aggregate pipeline value and status counts
  const pipelineAgg = await Lead.aggregate([
    { $match: { ...scope, isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$estimateAmount' },
      },
    },
  ]);

  const statusCounts = {};
  const statusAmounts = {};
  let totalPipelineValue = 0;

  for (const item of pipelineAgg) {
    statusCounts[item._id] = item.count;
    statusAmounts[item._id] = item.totalAmount || 0;
    if (!TERMINAL_STATUSES.includes(item._id)) {
      totalPipelineValue += item.totalAmount || 0;
    }
  }

  return {
    // Top-level stats for frontend StatRow
    totalLeads: activeLeadsCount,
    leadsCount: activeLeadsCount,
    pipelineValue: totalPipelineValue,
    totalAmount: totalPipelineValue,
    wonCount,
    convertedLeads: wonCount,
    todayFollowups: followupsDueToday,
    pendingToday: followupsDueToday,
    overdueCount,
    overdueFollowups: overdueCount,

    // Status distributions for LeadsPanel
    statusCounts,
    statusAmounts,

    leads: {
      today: todayLeads,
      yesterday: yestLeads,
      vsYesterdayPct: leadsDiffPct,
    },
    followups: {
      dueToday: followupsDueToday,
      completedToday: followupsCompletedToday,
      completionPct: followupCompletionPct,
      overdue: overdueCount,
    },
    tasks: {
      today: 0,
      completed: 0,
      completionPct: 100,
    },
    todos: {
      total: 0,
      completed: 0,
    },
  };
};

export const getDashboardLeads = async (user, query) => {
  const scope = leadScope(user);
  const status = query.status || 'new';

  const [tabCounts, leads] = await Promise.all([
    Promise.all([
      Lead.countDocuments({ ...scope, status: 'new' }),
      Lead.countDocuments({ ...scope, status: 'processing' }),
      Lead.countDocuments({ ...scope, status: 'close-by' }),
    ]),
    Lead.find({ ...scope, status })
      .populate('source', 'name')
      .populate('labels.label', 'name color')
      .populate('assignedTo', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return {
    tabs: {
      new: tabCounts[0],
      processing: tabCounts[1],
      closeBy: tabCounts[2],
    },
    leads,
  };
};

export const getDashboardFollowups = async (user, query) => {
  const scope = leadScope(user);
  const now = new Date();
  let filter = { ...scope, status: { $nin: TERMINAL_STATUSES } };

  if (query.when === 'overdue') {
    filter.nextFollowupDate = { $lt: now };
  } else if (query.when === 'today') {
    filter.nextFollowupDate = { $gte: startOfToday(), $lte: endOfToday() };
  } else {
    // Default: upcoming or today followups
    filter.nextFollowupDate = { $gte: startOfToday() };
  }

  let leads = await Lead.find(filter)
    .populate('assignedTo', 'name avatar')
    .sort({ nextFollowupDate: 1 })
    .limit(15)
    .lean();

  // If none scheduled from today onward, show any pending leads with a nextFollowupDate
  if (leads.length === 0 && !query.when) {
    leads = await Lead.find({ ...scope, status: { $nin: TERMINAL_STATUSES }, nextFollowupDate: { $ne: null } })
      .populate('assignedTo', 'name avatar')
      .sort({ nextFollowupDate: 1 })
      .limit(15)
      .lean();
  }

  return leads;
};
