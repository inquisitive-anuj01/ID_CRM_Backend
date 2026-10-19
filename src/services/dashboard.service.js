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
import { TERMINAL_STATUSES } from '../config/constants.js';

export const getDashboardSummary = async (user, queryUserId) => {
  const targetUser = user.role === 'admin' && queryUserId ? { _id: queryUserId, role: 'staff' } : user;
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

  return {
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
  const filter = { ...scope, status: { $nin: TERMINAL_STATUSES } };

  if (query.when === 'overdue') {
    filter.nextFollowupDate = { $lt: now };
  } else {
    // Default today
    filter.nextFollowupDate = { $gte: startOfToday(), $lte: endOfToday() };
  }

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name avatar')
    .sort({ nextFollowupDate: 1 })
    .limit(15)
    .lean();

  return leads;
};
