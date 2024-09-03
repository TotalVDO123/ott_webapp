import { Express, Request, Response, NextFunction } from 'express';

import { AccessController } from './controllers/access-controller.js';
import { ProductsController } from './controllers/products-controller.js';
import { CheckoutController } from './controllers/checkout-controller.js';

const accessController = new AccessController();
const productsController = new ProductsController();
const checkoutController = new CheckoutController();

export function registerEndpoints(app: Express) {
  app.put('/v2/sites/:site_id/access/generate', (req: Request, res: Response, next: NextFunction) =>
    accessController.generatePassport(req, res, next)
  );

  app.put('/v2/sites/:site_id/access/refresh', (req: Request, res: Response, next: NextFunction) =>
    accessController.refreshPassport(req, res, next)
  );

  app.get('/v2/sites/:site_id/products', (req: Request, res: Response, next: NextFunction) =>
    productsController.getProducts(req, res, next)
  );

  app.post('/v2/sites/:site_id/checkout', (req: Request, res: Response, next: NextFunction) =>
    checkoutController.initiateCheckout(req, res, next)
  );
}
