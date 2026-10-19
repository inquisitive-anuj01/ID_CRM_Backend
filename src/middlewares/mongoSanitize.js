/**
 * Custom Express 5 compatible Mongo Sanitizer
 * Recursively strips keys that start with '$' or contain '.' to prevent NoSQL injection
 */
const sanitize = (target) => {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    target.forEach((item) => sanitize(item));
    return target;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      sanitize(target[key]);
    }
  }
  return target;
};

export const mongoSanitizer = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
};
