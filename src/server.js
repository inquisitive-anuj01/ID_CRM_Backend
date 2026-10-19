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

  // Run seeders in development on first boot
  if (env.NODE_ENV === 'development') {
    const { runSeeders } = await import('./seeders/index.js');
    await runSeeders();
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
