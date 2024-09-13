import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.initializeSentry();
  }

  private initializeSentry() {
    const SENTRY_DSN = process.env.APP_SENTRY_DSN || '';
    const SENTRY_TRACE_RATE = parseFloat(process.env.APP_SENTRY_TRACE_RATE || '1.0');

    if (SENTRY_DSN) {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [nodeProfilingIntegration()],
        environment: process.env.MODE || 'development',
        release: process.env.APP_VERSION,
        tracesSampleRate: SENTRY_TRACE_RATE,
        profilesSampleRate: SENTRY_TRACE_RATE,
      });
    }
  }

  error(message: string, error?: unknown) {
    console.error(message, error ?? '');

    if (Sentry.getClient() && this.isProduction) {
      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    }
  }

  info(message: string) {
    console.info(message);

    if (Sentry.getClient() && this.isProduction) {
      Sentry.captureMessage(message, 'info');
    }
  }

  warn(message: string) {
    console.warn(message);

    if (Sentry.getClient() && this.isProduction) {
      Sentry.captureMessage(message, 'warning');
    }
  }
}

const logger = new Logger();
export default logger;
