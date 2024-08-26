import * as Sentry from '@sentry/node';
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  error(message: string, error: unknown) {
    console.error(message, error);

    if (Sentry.getClient() && !this.isDevelopment) {
      Sentry.captureException(error);
    }
  }

  info(message: string) {
    console.info(message);

    if (Sentry.getClient() && !this.isDevelopment) {
      Sentry.captureMessage(message, 'info');
    }
  }

  warn(message: string) {
    console.warn(message);

    if (Sentry.getClient() && !this.isDevelopment) {
      Sentry.captureMessage(message, 'warning');
    }
  }
}

const logger = new Logger();
export default logger;
