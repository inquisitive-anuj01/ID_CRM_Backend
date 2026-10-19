import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'staff', 'manager'], default: 'staff', index: true },
    designation: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
    refreshTokenHash: { type: String, select: false },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Hash password before save ─────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
});

// ─── Methods ─────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (this.passwordChangedAt) {
    const changedAt = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtIat < changedAt;
  }
  return false;
};

// ─── Remove sensitive fields from JSON ────────────────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  delete obj.passwordChangedAt;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
