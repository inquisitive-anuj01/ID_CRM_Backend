import User from '../models/User.model.js';
import Lead from '../models/Lead.model.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';

export const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

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

export const getUserOptions = async () => {
  return User.find({ isActive: true }).select('name avatar role designation').sort({ name: 1 }).lean();
};

export const getUserById = async (id) => {
  const user = await User.findById(id).select('-password -refreshTokenHash -passwordChangedAt');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const createUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw ApiError.conflict('Email already in use');
  const user = await User.create(data);
  return user.toSafeObject();
};

export const updateUser = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password -refreshTokenHash -passwordChangedAt');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const setUserStatus = async (id, isActive) => {
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select('-password -refreshTokenHash');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const adminResetPassword = async (id, newPassword) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  user.password = newPassword;
  await user.save();
};

export const reassignLeads = async (fromUserId, toUserId) => {
  const toUser = await User.findById(toUserId);
  if (!toUser || !toUser.isActive) throw ApiError.badRequest('Target user not found or inactive');

  const result = await Lead.updateMany(
    { assignedTo: fromUserId, isDeleted: false, status: { $nin: ['confirm', 'cancel'] } },
    { $set: { assignedTo: toUserId } }
  );
  return { reassigned: result.modifiedCount };
};
