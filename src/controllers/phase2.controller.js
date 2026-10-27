import * as phase2Service from '../services/phase2.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Tasks
export const getTasks = asyncHandler(async (req, res) => {
  const data = await phase2Service.listTasks(req.user, req.query);
  ApiResponse.ok(res, 'Tasks fetched', data);
});

export const createTask = asyncHandler(async (req, res) => {
  const data = await phase2Service.createTask(req.user, req.body);
  ApiResponse.created(res, 'Task created', data);
});

export const updateTask = asyncHandler(async (req, res) => {
  const data = await phase2Service.updateTask(req.params.id, req.body, req.user);
  ApiResponse.ok(res, 'Task updated', data);
});

export const deleteTask = asyncHandler(async (req, res) => {
  await phase2Service.deleteTask(req.params.id, req.user);
  ApiResponse.ok(res, 'Task deleted');
});

// Todos
export const getTodos = asyncHandler(async (req, res) => {
  const data = await phase2Service.listTodos(req.user);
  ApiResponse.ok(res, 'Todos fetched', data);
});

export const createTodo = asyncHandler(async (req, res) => {
  const data = await phase2Service.createTodo(req.user, req.body);
  ApiResponse.created(res, 'Todo created', data);
});

export const updateTodo = asyncHandler(async (req, res) => {
  const data = await phase2Service.updateTodo(req.params.id, req.user, req.body);
  ApiResponse.ok(res, 'Todo updated', data);
});

export const deleteTodo = asyncHandler(async (req, res) => {
  await phase2Service.deleteTodo(req.params.id, req.user);
  ApiResponse.ok(res, 'Todo deleted');
});

// Notes
export const getNotes = asyncHandler(async (req, res) => {
  const data = await phase2Service.listNotes(req.user, req.query);
  ApiResponse.ok(res, 'Notes fetched', data);
});

export const createNote = asyncHandler(async (req, res) => {
  const data = await phase2Service.createNote(req.user, req.body);
  ApiResponse.created(res, 'Note created', data);
});

export const updateNote = asyncHandler(async (req, res) => {
  const data = await phase2Service.updateNote(req.params.id, req.user, req.body);
  ApiResponse.ok(res, 'Note updated', data);
});

export const deleteNote = asyncHandler(async (req, res) => {
  await phase2Service.deleteNote(req.params.id, req.user);
  ApiResponse.ok(res, 'Note deleted');
});

// Reminders
export const getReminders = asyncHandler(async (req, res) => {
  const data = await phase2Service.listReminders(req.user, req.query);
  ApiResponse.ok(res, 'Reminders fetched', data);
});

export const createReminder = asyncHandler(async (req, res) => {
  const data = await phase2Service.createReminder(req.user, req.body);
  ApiResponse.created(res, 'Reminder created', data);
});

export const updateReminder = asyncHandler(async (req, res) => {
  const data = await phase2Service.updateReminder(req.params.id, req.user, req.body);
  ApiResponse.ok(res, 'Reminder updated', data);
});

export const deleteReminder = asyncHandler(async (req, res) => {
  await phase2Service.deleteReminder(req.params.id, req.user);
  ApiResponse.ok(res, 'Reminder deleted');
});

// Meetings
export const getMeetings = asyncHandler(async (req, res) => {
  const data = await phase2Service.listMeetings(req.user, req.query);
  ApiResponse.ok(res, 'Meetings fetched', data);
});

export const createMeeting = asyncHandler(async (req, res) => {
  const data = await phase2Service.createMeeting(req.user, req.body);
  ApiResponse.created(res, 'Meeting created', data);
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const data = await phase2Service.updateMeeting(req.params.id, req.body, req.user);
  ApiResponse.ok(res, 'Meeting updated', data);
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  await phase2Service.deleteMeeting(req.params.id, req.user);
  ApiResponse.ok(res, 'Meeting deleted');
});

// Customers
export const getCustomers = asyncHandler(async (req, res) => {
  const data = await phase2Service.listCustomers(req.user, req.query);
  ApiResponse.ok(res, 'Customers fetched', data);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const data = await phase2Service.createCustomer(req.user, req.body);
  ApiResponse.created(res, 'Customer created', data);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const data = await phase2Service.updateCustomer(req.params.id, req.body, req.user);
  ApiResponse.ok(res, 'Customer updated', data);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  await phase2Service.deleteCustomer(req.params.id, req.user);
  ApiResponse.ok(res, 'Customer deleted');
});

export const convertToCustomer = asyncHandler(async (req, res) => {
  const data = await phase2Service.convertLeadToCustomer(req.params.leadId, req.user);
  ApiResponse.created(res, 'Lead converted to customer', data);
});

// Calendar
export const getCalendar = asyncHandler(async (req, res) => {
  const data = await phase2Service.getCalendarSchedule(req.user, req.query.from, req.query.to);
  ApiResponse.ok(res, 'Calendar schedule fetched', data);
});
