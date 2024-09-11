import { Express, Request, Response, NextFunction } from 'express';

import { AccessController } from '../controllers/access-controller.js';

import { Middleware } from './middleware.js';

const middleware = new Middleware();
const accessController = new AccessController();

export function initializeRoutes(app: Express) {
  // Register routes with their respective controller methods
  addRoute(app, 'put', '/v2/sites/:site_id/access/generate', accessController.generatePassport.bind(accessController));
  addRoute(app, 'put', '/v2/sites/:site_id/access/refresh', accessController.refreshPassport.bind(accessController));
}

// Adds a route to the Express application with the specified HTTP method, path, and handler.
export function addRoute(
  app: Express,
  method: 'post' | 'put',
  path: string,
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  customMiddleware: Array<(req: Request, res: Response, next: NextFunction) => void> = [middleware.validateSiteId]
) {
  // By default, validateSiteId middleware is added on each registered route with possibility to override.
  // asyncWrapper ensures that any errors in async operations are caught and passed to the global error handler.
  app[method](path, [...customMiddleware, middleware.asyncWrapper(handler)]);
}
