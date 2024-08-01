import * as Sentry from '@sentry/node';

import { SENTRY_DSN } from './app-config.js';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0, // For development: captures 100% of transactions.
    // NOTE: Adjust the tracesSampleRate for production to balance performance monitoring and resource usage.
    // Example for production: Set to 0.1 (10%) or 0.2 (20%) to capture a representative sample of transactions.
  });
}

class Logger {
  error(message: string, error: unknown) {
    // Log to console
    console.error(message, error);

    // Send to Sentry if initialized
    if (Sentry.getClient()) {
      Sentry.captureException(error);
    }
  }

  info(message: string) {
    console.info(message);
  }

  warn(message: string) {
    console.warn(message);
  }
}

const logger = new Logger();
export default logger;
