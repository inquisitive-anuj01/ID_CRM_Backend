import { seedAdmin } from './admin.seeder.js';
import { seedMasters } from './masters.seeder.js';

export const runSeeders = async () => {
  try {
    await seedAdmin();
    await seedMasters();
  } catch (err) {
    console.error('⚠️  Seeder warning:', err.message);
  }
};
