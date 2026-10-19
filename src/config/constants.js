// ─── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
};

// ─── Lead Status Keys (immutable; name/color can be edited by admin) ─────────
export const LEAD_STATUS = {
  NEW: 'new',
  PROCESSING: 'processing',
  CLOSE_BY: 'close-by',
  VISITED: 'visited',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  INTERNAL_TRANSFER: 'internal-transfer-needed',
};

export const TERMINAL_STATUSES = [LEAD_STATUS.CONFIRM, LEAD_STATUS.CANCEL];

// ─── History Actions ─────────────────────────────────────────────────────────
export const HISTORY_ACTIONS = {
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_UPDATED: 'LEAD_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ASSIGNED: 'ASSIGNED',
  LABELS_CHANGED: 'LABELS_CHANGED',
  RATING_CHANGED: 'RATING_CHANGED',
  AMOUNT_CHANGED: 'AMOUNT_CHANGED',
  FOLLOWUP_ADDED: 'FOLLOWUP_ADDED',
  FOLLOWUP_EDITED: 'FOLLOWUP_EDITED',
  FOLLOWUP_DELETED: 'FOLLOWUP_DELETED',
  LEAD_DELETED: 'LEAD_DELETED',
  LEAD_RESTORED: 'LEAD_RESTORED',
};

// ─── Notification Types ───────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  FOLLOWUP_DUE: 'FOLLOWUP_DUE',
  FOLLOWUP_OVERDUE: 'FOLLOWUP_OVERDUE',
  LEAD_ASSIGNED: 'LEAD_ASSIGNED',
  LEAD_TRANSFERRED: 'LEAD_TRANSFERRED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  MENTION: 'MENTION',
  SYSTEM: 'SYSTEM',
};

// ─── File upload limits ──────────────────────────────────────────────────────
export const FILE_LIMITS = {
  MAX_SIZE_MB: 5,
  MAX_FILES: 5,
  ALLOWED_MIMES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'audio/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ],
};

// ─── Pagination defaults ─────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ─── Lead number prefix ───────────────────────────────────────────────────────
export const LEAD_NO_PREFIX = 'L-';
export const LEAD_NO_PADDING = 6;
