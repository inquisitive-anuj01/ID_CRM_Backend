import Lead from '../models/Lead.model.js';
import LeadStatus from '../models/LeadStatus.model.js';
import Source from '../models/Source.model.js';
import Label from '../models/Label.model.js';
import User from '../models/User.model.js';
import { leadScope } from '../utils/scope.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import { TERMINAL_STATUSES } from '../config/constants.js';
import { generateLeadNumber, formatMobile } from './lead.service.js';
import { logHistory } from './history.service.js';
import { HISTORY_ACTIONS } from '../config/constants.js';
import ExcelJS from 'exceljs';

/**
 * Build MongoDB filter query from request parameters
 */
export const buildLeadQueryFilter = (user, query) => {
  const filter = { ...leadScope(user) };

  // Text search — accept both ?q= and ?search= from frontend
  const searchText = query.q || query.search;
  if (searchText) {
    const regex = { $regex: searchText.trim(), $options: 'i' };
    filter.$or = [
      { customerName: regex },
      { companyName: regex },
      { mobileFull: regex },
      { mobile: regex },
      { email: regex },
      { leadNo: regex },
    ];
  }

  // Status filter (single or array)
  if (query.status) {
    const statuses = Array.isArray(query.status) ? query.status : query.status.split(',');
    filter.status = { $in: statuses };
  }

  // Source filter
  if (query.source) {
    const sources = Array.isArray(query.source) ? query.source : query.source.split(',');
    filter.source = { $in: sources };
  }

  // Label filter
  if (query.label) {
    const labels = Array.isArray(query.label) ? query.label : query.label.split(',');
    filter['labels.label'] = { $in: labels };
  }

  // Assignee filter
  if (query.assignedTo) {
    const assignees = Array.isArray(query.assignedTo) ? query.assignedTo : query.assignedTo.split(',');
    filter.assignedTo = { $in: assignees };
  }

  // Creator filter
  if (query.createdBy) {
    const creators = Array.isArray(query.createdBy) ? query.createdBy : query.createdBy.split(',');
    filter.createdBy = { $in: creators };
  }

  // Rating
  if (query.rating !== undefined) {
    filter.rating = Number(query.rating);
  }

  // Estimate amount range
  if (query.minAmount || query.maxAmount) {
    filter.estimateAmount = {};
    if (query.minAmount) filter.estimateAmount.$gte = Number(query.minAmount);
    if (query.maxAmount) filter.estimateAmount.$lte = Number(query.maxAmount);
  }

  // Created date range
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  // Next followup date range
  if (query.nfdFrom || query.nfdTo) {
    filter.nextFollowupDate = {};
    if (query.nfdFrom) filter.nextFollowupDate.$gte = new Date(query.nfdFrom);
    if (query.nfdTo) filter.nextFollowupDate.$lte = new Date(query.nfdTo);
  }

  // Overdue leads: nextFollowupDate < now AND not terminal status
  if (query.overdue === 'true') {
    filter.nextFollowupDate = { $lt: new Date() };
    filter.status = { $nin: TERMINAL_STATUSES };
  }

  return filter;
};

/**
 * Determine sorting direction and field
 */
const buildSortOptions = (sortQuery) => {
  switch (sortQuery) {
    case 'nfd_asc':
      return { nextFollowupDate: 1 };
    case 'nfd_desc':
      return { nextFollowupDate: -1 };
    case 'amount_desc':
      return { estimateAmount: -1 };
    case 'amount_asc':
      return { estimateAmount: 1 };
    case 'rating_desc':
      return { rating: -1 };
    case 'oldest':
      return { createdAt: 1 };
    default:
      return { createdAt: -1 };
  }
};

/**
 * List leads with filters, search, and pagination
 */
export const listLeads = async (user, query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildLeadQueryFilter(user, query);
  const sort = buildSortOptions(query.sort);

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('source', 'name type')
      .populate('labels.label', 'name color')
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Lead.countDocuments(filter),
  ]);

  return { leads, meta: buildMeta(total, page, limit) };
};

/**
 * Kanban board grouping: summary counts/amounts and top N cards per status
 */
export const getLeadsBoard = async (user, query) => {
  const baseFilter = buildLeadQueryFilter(user, query);
  // Remove status from baseFilter to get all columns
  delete baseFilter.status;

  const statuses = await LeadStatus.find({ isActive: true }).sort({ order: 1 }).lean();

  // Column aggregations
  const aggregations = await Lead.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$estimateAmount' },
      },
    },
  ]);

  const aggMap = {};
  aggregations.forEach((item) => {
    aggMap[item._id] = item;
  });

  const limitPerCol = Math.min(50, parseInt(query.columnLimit) || 20);

  // Fetch top leads for each status column
  const boardColumns = await Promise.all(
    statuses.map(async (st) => {
      const colFilter = { ...baseFilter, status: st.key };
      const leads = await Lead.find(colFilter)
        .populate('source', 'name type')
        .populate('labels.label', 'name color')
        .populate('createdBy', 'name avatar')
        .populate('assignedTo', 'name avatar')
        .sort({ nextFollowupDate: 1, createdAt: -1 })
        .limit(limitPerCol);

      return {
        status: st,
        count: aggMap[st.key]?.count || 0,
        totalAmount: aggMap[st.key]?.totalAmount || 0,
        leads,
      };
    })
  );

  return boardColumns;
};

/**
 * Export filtered leads to XLSX workbook
 */
export const exportLeads = async (user, query) => {
  const filter = buildLeadQueryFilter(user, query);
  const leads = await Lead.find(filter)
    .populate('source', 'name')
    .populate('assignedTo', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leads');

  worksheet.columns = [
    { header: 'Lead No', key: 'leadNo', width: 14 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Mobile', key: 'mobileFull', width: 16 },
    { header: 'Email', key: 'email', width: 24 },
    { header: 'Company', key: 'companyName', width: 20 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Source', key: 'source', width: 14 },
    { header: 'Estimate Amount', key: 'estimateAmount', width: 16 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Assigned To', key: 'assignedTo', width: 18 },
    { header: 'Created By', key: 'createdBy', width: 18 },
    { header: 'Next Followup Date', key: 'nextFollowupDate', width: 20 },
    { header: 'Created Date', key: 'createdAt', width: 20 },
  ];

  leads.forEach((l) => {
    worksheet.addRow({
      leadNo: l.leadNo,
      customerName: l.customerName,
      mobileFull: l.mobileFull || l.mobile,
      email: l.email || '',
      companyName: l.companyName || '',
      status: l.status,
      source: l.source?.name || '',
      estimateAmount: l.estimateAmount || 0,
      rating: l.rating || 0,
      assignedTo: l.assignedTo?.name || '',
      createdBy: l.createdBy?.name || '',
      nextFollowupDate: l.nextFollowupDate ? new Date(l.nextFollowupDate).toLocaleString() : '',
      createdAt: new Date(l.createdAt).toLocaleString(),
    });
  });

  return workbook;
};

/**
 * Import leads from uploaded Excel / CSV file
 */
export const importLeads = async (fileBuffer, actor) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const worksheet = workbook.worksheets[0];

  const results = { total: 0, imported: 0, failed: 0, errors: [] };
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    rows.push({
      customerName: row.getCell(1).text?.trim(),
      mobile: row.getCell(2).text?.trim(),
      email: row.getCell(3).text?.trim(),
      companyName: row.getCell(4).text?.trim(),
      estimateAmount: Number(row.getCell(5).value) || 0,
      comment: row.getCell(6).text?.trim(),
      rowNumber,
    });
  });

  results.total = rows.length;

  for (const item of rows) {
    if (!item.customerName || !item.mobile) {
      results.failed++;
      results.errors.push({ row: item.rowNumber, error: 'Customer name and mobile are required' });
      continue;
    }

    try {
      const wsId = actor.workspace?._id || actor.workspace;
      const { countryCode, mobile, mobileFull } = formatMobile('+91', item.mobile);
      const leadNo = await generateLeadNumber(wsId);

      const lead = await Lead.create({
        workspace: wsId,
        leadNo,
        customerName: item.customerName,
        countryCode,
        mobile,
        mobileFull,
        email: item.email || undefined,
        companyName: item.companyName || undefined,
        estimateAmount: item.estimateAmount || 0,
        comment: item.comment || undefined,
        createdBy: actor._id,
        assignedTo: actor._id,
        status: 'new',
      });

      await logHistory({
        leadId: lead._id,
        actorId: actor._id,
        action: HISTORY_ACTIONS.LEAD_CREATED,
        note: 'Imported from Excel',
      });

      results.imported++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: item.rowNumber, error: err.message });
    }
  }

  return results;
};

/**
 * Global search across leads
 */
export const globalSearch = async (user, q) => {
  if (!q || !q.trim()) return { leads: [] };
  const regex = { $regex: q.trim(), $options: 'i' };

  const filter = {
    ...leadScope(user),
    $or: [
      { customerName: regex },
      { companyName: regex },
      { mobileFull: regex },
      { email: regex },
      { leadNo: regex },
    ],
  };

  const leads = await Lead.find(filter)
    .select('leadNo customerName mobile companyName status assignedTo estimateAmount')
    .populate('assignedTo', 'name avatar')
    .limit(10)
    .lean();

  return { leads };
};
