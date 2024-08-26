import { BIND_ADDR, BIND_PORT } from './app-config.js';
import { registerEndpoints } from './endpoints.js';
import logger from './logger.js';
import { Server } from './server.js';

if (BIND_PORT <= 0 || BIND_PORT > 65535) {
  logger.warn('Error: BIND_PORT must be a valid port number between 1 and 65535.');
  process.exit(1);
}

const server = new Server(BIND_ADDR, BIND_PORT, registerEndpoints);

async function startServer() {
  try {
    await server.listen();
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Gracefully handle termination signals (e.g., Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('Shutting down server gracefully..');
  try {
    await server.close();
    logger.info('Server closed.');
    process.exit(0);
  } catch (err) {
    logger.error('Error closing server:', err);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception occurred:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}:`, reason);
  process.exit(1);
});
