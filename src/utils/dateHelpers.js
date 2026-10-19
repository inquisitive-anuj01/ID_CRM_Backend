import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';
import { env } from '../config/env.js';

const TZ = env.DEFAULT_TIMEZONE;

/**
 * Get start of today in the app timezone, returned as UTC Date
 */
export const startOfToday = () => {
  const now = new Date();
  const zoned = toZonedTime(now, TZ);
  const start = startOfDay(zoned);
  return fromZonedTime(start, TZ);
};

/**
 * Get end of today in the app timezone, returned as UTC Date
 */
export const endOfToday = () => {
  const now = new Date();
  const zoned = toZonedTime(now, TZ);
  const end = endOfDay(zoned);
  return fromZonedTime(end, TZ);
};

/**
 * Get start of yesterday in the app timezone
 */
export const startOfYesterday = () => {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
};

export const endOfYesterday = () => {
  const d = endOfToday();
  d.setDate(d.getDate() - 1);
  return d;
};

/**
 * Compute vs-yesterday percentage
 * (today - yesterday) / max(yesterday, 1) * 100
 */
export const vsYesterdayPct = (today, yesterday) =>
  Math.round(((today - yesterday) / Math.max(yesterday, 1)) * 100);

/**
 * Difference in minutes between two dates
 */
export const diffMinutes = (later, earlier) =>
  Math.floor((new Date(later) - new Date(earlier)) / 60000);
