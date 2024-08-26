import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const SENTRY_DSN = process.env.APP_SENTRY_DSN || '';
const SENTRY_TRACE_RATE = parseFloat(process.env.APP_SENTRY_TRACE_RATE || '1.0');

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.APP_VERSION,
    // make sure you setup your APP_SENTRY_TRACE_RATE env according to your monitoring needs
    // to balance performance and resource usage.
    tracesSampleRate: SENTRY_TRACE_RATE,
    profilesSampleRate: SENTRY_TRACE_RATE,
  });
}
