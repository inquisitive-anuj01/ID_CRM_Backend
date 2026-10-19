import cron from 'node-cron';
import Lead from '../models/Lead.model.js';
import Notification from '../models/Notification.model.js';
import { createNotification } from '../services/notification.service.js';
import { NOTIFICATION_TYPES, TERMINAL_STATUSES } from '../config/constants.js';

export const startFollowupReminderJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const tenMinutesLater = new Date(now.getTime() + 10 * 60000);

      // 1. Leads due in the next 10 minutes
      const dueLeads = await Lead.find({
        isDeleted: false,
        status: { $nin: TERMINAL_STATUSES },
        nextFollowupDate: { $gte: now, $lte: tenMinutesLater },
      });

      for (const lead of dueLeads) {
        // Prevent duplicate notification within last 30 minutes
        const recentNotif = await Notification.findOne({
          user: lead.assignedTo,
          type: NOTIFICATION_TYPES.FOLLOWUP_DUE,
          'link.id': lead._id,
          createdAt: { $gte: new Date(now.getTime() - 30 * 60000) },
        });

        if (!recentNotif) {
          await createNotification({
            userId: lead.assignedTo,
            type: NOTIFICATION_TYPES.FOLLOWUP_DUE,
            title: 'Followup Due Soon',
            body: `Followup for lead ${lead.leadNo} (${lead.customerName}) is scheduled at ${new Date(lead.nextFollowupDate).toLocaleTimeString()}`,
            link: { entity: 'lead', id: lead._id },
          });
        }
      }

      // 2. Leads that just turned overdue
      const overdueLeads = await Lead.find({
        isDeleted: false,
        status: { $nin: TERMINAL_STATUSES },
        nextFollowupDate: { $lt: now, $gte: new Date(now.getTime() - 60000) }, // became overdue within last minute
      });

      for (const lead of overdueLeads) {
        await createNotification({
          userId: lead.assignedTo,
          type: NOTIFICATION_TYPES.FOLLOWUP_OVERDUE,
          title: 'Followup Overdue!',
          body: `Followup for lead ${lead.leadNo} (${lead.customerName}) is now OVERDUE!`,
          link: { entity: 'lead', id: lead._id },
        });
      }
    } catch (err) {
      console.error('Error in followup reminder job:', err.message);
    }
  });

  console.log('⏰  Followup reminder cron job initialized (every minute)');
};
