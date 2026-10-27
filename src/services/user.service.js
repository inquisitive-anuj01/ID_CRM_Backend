import User from '../models/User.model.js';
import Lead from '../models/Lead.model.js';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';

export const listUsers = async (query, workspaceId) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { workspace: workspaceId };

  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: 'i' } },
      { email: { $regex: query.q, $options: 'i' } },
    ];
  }
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(filter).select('-password -refreshTokenHash -passwordChangedAt').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildMeta(total, page, limit) };
};

export const getUserOptions = async (workspaceId) => {
  return User.find({ isActive: true, workspace: workspaceId }).select('name avatar role designation').sort({ name: 1 }).lean();
};

export const getUserById = async (id, workspaceId) => {
  const user = await User.findOne({ _id: id, workspace: workspaceId }).select('-password -refreshTokenHash -passwordChangedAt');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const createUser = async (data, workspaceId) => {
  const cleanEmail = data.email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail, workspace: workspaceId });
  if (existing) throw ApiError.conflict('Email already in use in this workspace');
  const user = await User.create({ ...data, email: cleanEmail, workspace: workspaceId });
  return user.toSafeObject();
};

export const updateUser = async (id, data, workspaceId) => {
  if (data.email) {
    const cleanEmail = data.email.toLowerCase().trim();
    const existing = await User.findOne({
      email: cleanEmail,
      workspace: workspaceId,
      _id: { $ne: id },
    });
    if (existing) throw ApiError.conflict('Email already in use in this workspace');
    data.email = cleanEmail;
  }

  if (data.password && data.password.trim().length > 0) {
    data.password = await bcrypt.hash(data.password, 12);
    data.passwordChangedAt = new Date();
  } else {
    delete data.password;
  }

  const user = await User.findOneAndUpdate(
    { _id: id, workspace: workspaceId },
    data,
    { new: true, runValidators: true }
  ).select('-password -refreshTokenHash -passwordChangedAt');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const setUserStatus = async (id, isActive, workspaceId) => {
  const user = await User.findOneAndUpdate(
    { _id: id, workspace: workspaceId },
    { isActive },
    { new: true }
  ).select('-password -refreshTokenHash');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const adminResetPassword = async (id, newPassword, workspaceId) => {
  const user = await User.findOne({ _id: id, workspace: workspaceId });
  if (!user) throw ApiError.notFound('User not found');
  user.password = newPassword;
  await user.save();
};

export const reassignLeads = async (fromUserId, toUserId, workspaceId) => {
  const toUser = await User.findOne({ _id: toUserId, workspace: workspaceId });
  if (!toUser || !toUser.isActive) throw ApiError.badRequest('Target user not found or inactive');

  const result = await Lead.updateMany(
    { assignedTo: fromUserId, workspace: workspaceId, isDeleted: false, status: { $nin: ['confirm', 'cancel'] } },
    { $set: { assignedTo: toUserId } }
  );
  return { reassigned: result.modifiedCount };
};

export const deleteUser = async (id, actor, workspaceId) => {
  if (actor._id.toString() === id.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const target = await User.findOne({ _id: id, workspace: workspaceId });
  if (!target) throw ApiError.notFound('User not found');

  // Reassign any leads assigned to this user to the admin actor
  await Lead.updateMany(
    { assignedTo: id, workspace: workspaceId },
    { $set: { assignedTo: actor._id } }
  );

  // Strictly hard delete the user record from the database
  await User.findByIdAndDelete(id);

  return { success: true };
};
