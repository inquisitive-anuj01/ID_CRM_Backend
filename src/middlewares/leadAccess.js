import Lead from '../models/Lead.model.js';
import { leadScope } from '../utils/scope.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Ensures the requesting user has access to this lead.
 * Scoped by leadScope (staff can only access leads they created or are assigned to).
 * If not found within their scope, returns 404 (does not leak existence).
 */
export const leadAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = leadScope(req.user);

    const lead = await Lead.findOne({ _id: id, ...scope });
    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }

    req.lead = lead;
    next();
  } catch (err) {
    next(err);
  }
};
