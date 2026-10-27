/**
 * Returns a MongoDB filter that scopes leads to what this user can see.
 * Admin → all non-deleted leads.
 * Staff → only leads they created OR are assigned to.
 */
export const leadScope = (user) => {
  const wsId = user.workspace?._id || user.workspace;
  const base = { isDeleted: false };
  if (wsId) {
    base.workspace = wsId;
  }
  return user.role === 'admin'
    ? base
    : {
        ...base,
        $or: [{ createdBy: user._id }, { assignedTo: user._id }],
      };
};
