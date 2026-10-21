import Task from '../models/Task.model.js';
import Todo from '../models/Todo.model.js';
import Note from '../models/Note.model.js';
import Reminder from '../models/Reminder.model.js';
import Meeting from '../models/Meeting.model.js';
import Customer from '../models/Customer.model.js';
import Lead from '../models/Lead.model.js';
import Followup from '../models/Followup.model.js';
import { ApiError } from '../utils/ApiError.js';

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const listTasks = async (user, query = {}) => {
  const filter = user.role === 'admin' ? {} : { assignedTo: user._id };
  if (query.lead) filter.lead = query.lead;
  if (query.status) filter.status = query.status;
  return Task.find(filter)
    .populate('assignedTo', 'name avatar')
    .populate('createdBy', 'name')
    .populate('lead', 'leadNo customerName')
    .sort({ dueDate: 1 });
};

export const createTask = async (actor, data) => {
  return Task.create({
    ...data,
    assignedTo: data.assignedTo || actor._id,
    createdBy: actor._id,
  });
};

export const updateTask = async (id, data) => {
  const task = await Task.findByIdAndUpdate(id, data, { new: true });
  if (!task) throw ApiError.notFound('Task not found');
  return task;
};

export const deleteTask = async (id) => {
  await Task.findByIdAndDelete(id);
  return { success: true };
};

// ─── Todos ───────────────────────────────────────────────────────────────────
export const listTodos = async (user) => {
  return Todo.find({ user: user._id }).sort({ isDone: 1, createdAt: -1 });
};

export const createTodo = async (user, data) => {
  return Todo.create({ ...data, user: user._id });
};

export const updateTodo = async (id, user, data) => {
  const todo = await Todo.findOneAndUpdate({ _id: id, user: user._id }, data, { new: true });
  if (!todo) throw ApiError.notFound('Todo not found');
  return todo;
};

export const deleteTodo = async (id, user) => {
  await Todo.findOneAndDelete({ _id: id, user: user._id });
  return { success: true };
};

// ─── Notes ───────────────────────────────────────────────────────────────────
export const listNotes = async (user, query = {}) => {
  const filter = { user: user._id };
  if (query.lead) filter.lead = query.lead;
  return Note.find(filter).sort({ isPinned: -1, createdAt: -1 });
};

export const createNote = async (user, data) => {
  return Note.create({ ...data, user: user._id });
};

export const updateNote = async (id, user, data) => {
  const note = await Note.findOneAndUpdate({ _id: id, user: user._id }, data, { new: true });
  if (!note) throw ApiError.notFound('Note not found');
  return note;
};

export const deleteNote = async (id, user) => {
  await Note.findOneAndDelete({ _id: id, user: user._id });
  return { success: true };
};

// ─── Reminders ───────────────────────────────────────────────────────────────
export const listReminders = async (user, query = {}) => {
  const filter = { user: user._id };
  if (query.lead) filter.lead = query.lead;
  return Reminder.find(filter).populate('lead', 'leadNo customerName').sort({ remindAt: 1 });
};

export const createReminder = async (user, data) => {
  return Reminder.create({ ...data, user: user._id });
};

export const updateReminder = async (id, user, data) => {
  const reminder = await Reminder.findOneAndUpdate({ _id: id, user: user._id }, data, { new: true });
  if (!reminder) throw ApiError.notFound('Reminder not found');
  return reminder;
};

export const deleteReminder = async (id, user) => {
  await Reminder.findOneAndDelete({ _id: id, user: user._id });
  return { success: true };
};

// ─── Meetings ────────────────────────────────────────────────────────────────
export const listMeetings = async (user, query = {}) => {
  const filter = user.role === 'admin' ? {} : { attendees: user._id };
  if (query.lead) filter.lead = query.lead;
  return Meeting.find(filter)
    .populate('attendees', 'name email avatar')
    .populate('createdBy', 'name')
    .populate('lead', 'leadNo customerName')
    .sort({ startAt: 1 });
};

export const createMeeting = async (user, data) => {
  const attendees = data.attendees || [user._id];
  if (!attendees.includes(user._id.toString())) attendees.push(user._id);

  return Meeting.create({
    ...data,
    attendees,
    createdBy: user._id,
  });
};

export const updateMeeting = async (id, data) => {
  const meeting = await Meeting.findByIdAndUpdate(id, data, { new: true });
  if (!meeting) throw ApiError.notFound('Meeting not found');
  return meeting;
};

export const deleteMeeting = async (id) => {
  await Meeting.findByIdAndDelete(id);
  return { success: true };
};

// ─── Customers (Converted from confirmed lead) ────────────────────────────────
export const createCustomer = async (actor, data) => {
  return Customer.create({
    ...data,
    accountManager: data.accountManager || actor._id,
  });
};

export const updateCustomer = async (id, data) => {
  const customer = await Customer.findByIdAndUpdate(id, data, { new: true })
    .populate('accountManager', 'name email avatar');
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
};

export const deleteCustomer = async (id) => {
  await Customer.findByIdAndDelete(id);
  return { success: true };
};

export const convertLeadToCustomer = async (leadId) => {
  const lead = await Lead.findById(leadId);
  if (!lead) throw ApiError.notFound('Lead not found');

  const existing = await Customer.findOne({ fromLead: leadId });
  if (existing) return existing;

  const customer = await Customer.create({
    fromLead: lead._id,
    customerName: lead.customerName,
    mobile: lead.mobile,
    mobileFull: lead.mobileFull,
    email: lead.email,
    companyName: lead.companyName,
    address: lead.address,
    dealAmount: lead.estimateAmount || 0,
    accountManager: lead.assignedTo,
  });

  return customer;
};

export const listCustomers = async (query = {}) => {
  return Customer.find().populate('accountManager', 'name email avatar').sort({ createdAt: -1 });
};

// ─── Calendar (Merges followups, tasks, reminders, meetings) ──────────────────
export const getCalendarSchedule = async (user, fromDate, toDate) => {
  const from = new Date(fromDate || new Date().setHours(0, 0, 0, 0));
  const to = new Date(toDate || new Date().setHours(23, 59, 59, 999) + 30 * 86400000);

  const [followups, tasks, reminders, meetings] = await Promise.all([
    Followup.find({
      createdBy: user._id,
      nextFollowupDate: { $gte: from, $lte: to },
      isDeleted: false,
    }).populate('lead', 'leadNo customerName'),
    Task.find({
      assignedTo: user._id,
      dueDate: { $gte: from, $lte: to },
    }).populate('lead', 'leadNo customerName'),
    Reminder.find({
      user: user._id,
      remindAt: { $gte: from, $lte: to },
    }).populate('lead', 'leadNo customerName'),
    Meeting.find({
      attendees: user._id,
      startAt: { $gte: from, $lte: to },
    }).populate('lead', 'leadNo customerName'),
  ]);

  const events = [];

  followups.forEach((f) => {
    events.push({
      id: f._id,
      type: 'followup',
      title: `Followup: ${f.lead?.customerName || 'Lead'}`,
      start: f.nextFollowupDate,
      lead: f.lead,
    });
  });

  tasks.forEach((t) => {
    events.push({
      id: t._id,
      type: 'task',
      title: `Task: ${t.title}`,
      start: t.dueDate,
      priority: t.priority,
      lead: t.lead,
    });
  });

  reminders.forEach((r) => {
    events.push({
      id: r._id,
      type: 'reminder',
      title: `Reminder: ${r.title}`,
      start: r.remindAt,
      isDone: r.isDone,
      lead: r.lead,
    });
  });

  meetings.forEach((m) => {
    events.push({
      id: m._id,
      type: 'meeting',
      title: `Meeting: ${m.title}`,
      start: m.startAt,
      end: m.endAt,
      location: m.location,
      lead: m.lead,
    });
  });

  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
};
