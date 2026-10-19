import { startFollowupReminderJob } from './followupReminder.job.js';

export const startJobs = () => {
  startFollowupReminderJob();
};
