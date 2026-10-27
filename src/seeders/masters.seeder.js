import Workspace from '../models/Workspace.model.js';
import { seedWorkspaceDefaults } from '../services/workspace.service.js';

export const seedMasters = async () => {
  let workspace = await Workspace.findOne({ slug: 'inquisitive-digital' });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'Inquisitive Digital',
      slug: 'inquisitive-digital',
      companySize: '11-50',
      isActive: true,
    });
  }

  await seedWorkspaceDefaults(workspace._id);
  console.log('📦  Master data seeded successfully for Inquisitive Digital');
};
