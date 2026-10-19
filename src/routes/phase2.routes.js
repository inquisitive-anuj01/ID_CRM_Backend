import { Router } from 'express';
import * as p2Ctrl from '../controllers/phase2.controller.js';
import { auth } from '../middlewares/auth.js';

const router = Router();
router.use(auth);

// Tasks
router.get('/tasks', p2Ctrl.getTasks);
router.post('/tasks', p2Ctrl.createTask);
router.patch('/tasks/:id', p2Ctrl.updateTask);
router.delete('/tasks/:id', p2Ctrl.deleteTask);

// Todos
router.get('/todos', p2Ctrl.getTodos);
router.post('/todos', p2Ctrl.createTodo);
router.patch('/todos/:id', p2Ctrl.updateTodo);
router.delete('/todos/:id', p2Ctrl.deleteTodo);

// Notes
router.get('/notes', p2Ctrl.getNotes);
router.post('/notes', p2Ctrl.createNote);
router.patch('/notes/:id', p2Ctrl.updateNote);
router.delete('/notes/:id', p2Ctrl.deleteNote);

// Reminders
router.get('/reminders', p2Ctrl.getReminders);
router.post('/reminders', p2Ctrl.createReminder);
router.patch('/reminders/:id', p2Ctrl.updateReminder);
router.delete('/reminders/:id', p2Ctrl.deleteReminder);

// Meetings
router.get('/meetings', p2Ctrl.getMeetings);
router.post('/meetings', p2Ctrl.createMeeting);
router.patch('/meetings/:id', p2Ctrl.updateMeeting);
router.delete('/meetings/:id', p2Ctrl.deleteMeeting);

// Customers
router.get('/customers', p2Ctrl.getCustomers);
router.post('/customers/from-lead/:leadId', p2Ctrl.convertToCustomer);

// Calendar
router.get('/calendar', p2Ctrl.getCalendar);

export default router;
