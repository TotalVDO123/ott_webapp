import { Express, Request, Response, NextFunction } from 'express';

import { AccessController } from './controllers/access-controller.js';
import { ProductsController } from './controllers/products-controller.js';

const accessController = new AccessController();
const productsController = new ProductsController();

export function registerEndpoints(app: Express) {
  app.put('/v2/sites/:site_id/access/generate', (req: Request, res: Response, next: NextFunction) =>
    accessController.generatePassport(req, res, next)
  );

  app.get('/v2/sites/:site_id/products', (req: Request, res: Response, next: NextFunction) =>
    productsController.getProducts(req, res, next)
  );
}
