import type { interfaces } from 'inversify';

import AppController from '../../controllers/AppController';

/**
 * Retrieves the access bridge URL from the AppController.
 * If the access bridge URL is defined in the application's .ini configuration file,
 * the function returns the URL. If the value is not defined, it returns `undefined`.
 */
export const getApiAccessBridgeUrl = (context: interfaces.Context) => {
  return context.container.get(AppController).getApiAccessBridgeUrl();
};
