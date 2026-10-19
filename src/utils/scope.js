/**
 * Returns a MongoDB filter that scopes leads to what this user can see.
 * Admin → all non-deleted leads.
 * Staff → only leads they created OR are assigned to.
 */
export const leadScope = (user) =>
  user.role === 'admin'
    ? { isDeleted: false }
    : {
        isDeleted: false,
        $or: [{ createdBy: user._id }, { assignedTo: user._id }],
      };
