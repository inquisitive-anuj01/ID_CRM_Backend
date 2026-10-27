import 'dotenv/config';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { createServer } from 'http';
import { initSocket } from './sockets/index.js';
import { startJobs } from './jobs/index.js';

const httpServer = createServer(app);

// Initialize socket.io
initSocket(httpServer);

const start = async () => {
  await connectDB();

  // Create initial admin only if user collection is completely empty
  try {
    const { default: User } = await import('./models/User.model.js');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const { seedAdmin } = await import('./seeders/admin.seeder.js');
      await seedAdmin();
    }
  } catch (err) {
    console.error('⚠️  Initial admin check warning:', err.message);
  }

  // Start background cron jobs
  startJobs();

  httpServer.listen(env.PORT, () => {
    console.log(`🚀  Server running on http://localhost:${env.PORT}`);
    console.log(`📊  Environment: ${env.NODE_ENV}`);
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
