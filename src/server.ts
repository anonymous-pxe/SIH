import 'dotenv/config';
import { createApp } from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 4000;

async function startServer() {
  // Connect to database (with graceful fallback)
  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Contextπ Backend Server running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`⚡ PS10 Business-Context API Test Generation Platform`);
    console.log(`=======================================================`);
  });

  const shutdown = () => {
    console.log('\n[Contextπ] Gracefully shutting down server...');
    server.close(() => {
      console.log('[Contextπ] Server terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(err => {
  console.error('[Contextπ Fatal Error] Server startup failed:', err);
  process.exit(1);
});
