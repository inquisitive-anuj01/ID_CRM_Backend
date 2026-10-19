import User from '../models/User.model.js';
import { env } from '../config/env.js';

export const seedAdmin = async () => {
  const existing = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (existing) return;

  await User.create({
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
    role: 'admin',
    designation: 'System Administrator',
  });

  console.log(`👤  Admin user seeded: ${env.SEED_ADMIN_EMAIL}`);
};
