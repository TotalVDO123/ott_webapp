import { BIND_ADDR, BIND_PORT } from './app-config.js';
import { initializeRoutes } from './pipeline/routes.js';
import { Server } from './server.js';

if (BIND_PORT <= 0 || BIND_PORT > 65535) {
  console.error('Error: BIND_PORT must be a valid port number between 1 and 65535.');
  process.exit(1);
}

const server = new Server(BIND_ADDR, BIND_PORT, initializeRoutes);

async function startServer() {
  try {
    await server.listen();
  } catch (err) {
    console.error(`Failed to start server: ${err}`);
    process.exit(1);
  }
}

startServer();

// Gracefully handle termination signals (e.g., Ctrl+C)
process.on('SIGINT', async () => {
  console.error('Shutting down server gracefully..');
  try {
    await server.close();
    console.error('Server closed.');
    process.exit(0);
  } catch (err) {
    console.error(`Error closing server: ${err}`);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception occurred:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
