import { ApiError } from '../utils/ApiError.js';

/**
 * Zod validation middleware.
 * Usage: validate({ body: schema, query: schema, params: schema })
 */
export const validate =
  ({ body, query, params } = {}) =>
  (req, res, next) => {
    const results = [];

    if (body) {
      const r = body.safeParse(req.body);
      if (!r.success) results.push(...r.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
      else req.body = r.data;
    }
    if (query) {
      const r = query.safeParse(req.query);
      if (!r.success) results.push(...r.error.issues.map((i) => ({ field: `query.${i.path.join('.')}`, message: i.message })));
      else req.query = r.data;
    }
    if (params) {
      const r = params.safeParse(req.params);
      if (!r.success) results.push(...r.error.issues.map((i) => ({ field: `params.${i.path.join('.')}`, message: i.message })));
      else req.params = r.data;
    }

    if (results.length > 0) {
      return next(ApiError.validation('Validation failed', results));
    }
    next();
  };
