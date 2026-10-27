import User from '../models/User.model.js';
import Workspace from '../models/Workspace.model.js';
import { env } from '../config/env.js';

export const seedAdmin = async () => {
  let workspace = await Workspace.findOne({ slug: 'inquisitive-digital' });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'Inquisitive Digital',
      slug: 'inquisitive-digital',
      companySize: '11-50',
      isActive: true,
    });
  }

  const existing = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (existing) {
    if (!existing.workspace) {
      existing.workspace = workspace._id;
      await existing.save({ validateBeforeSave: false });
    }
    return;
  }

  await User.create({
    workspace: workspace._id,
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
    role: 'admin',
    designation: 'System Administrator',
  });

  console.log(`👤  Admin user seeded: ${env.SEED_ADMIN_EMAIL}`);
};
