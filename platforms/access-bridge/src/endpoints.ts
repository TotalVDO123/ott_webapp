import { Express, Request, Response, NextFunction } from 'express';

import { AccessController } from './controllers/access-controller.js';

const accessController = new AccessController();

export function registerEndpoints(app: Express) {
  app.put('/v2/sites/:site_id/access/generate', (req: Request, res: Response, next: NextFunction) =>
    accessController.generatePassport(req, res, next)
  );

  app.put('/v2/sites/:site_id/access/refresh', (req: Request, res: Response, next: NextFunction) =>
    accessController.refreshPassport(req, res, next)
  );
}
