import { IncomingMessage, ServerResponse } from 'node:http';

import { AccessController } from './controllers/access-controller.js';
import { ProductsController } from './controllers/products-controller.js';
import { BillingPortalController } from './controllers/billing-portal-controller.js';

export type EndpointHandler = {
  [path: string]: {
    [method: string]: (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => Promise<void>;
  };
};

const accessController = new AccessController();
const productsController = new ProductsController();
const billingPortalController = new BillingPortalController();

export const endpoints: EndpointHandler = {
  '/v2/sites/:site_id/access/generate': {
    PUT: accessController.generatePassport,
  },
  '/v2/sites/:site_id/access/refresh': {
    PUT: accessController.refreshPassport,
  },
  '/v2/sites/:site_id/products': {
    GET: productsController.getProducts,
  },
  '/v2/sites/:site_id/billing-portal': {
    GET: billingPortalController.billingPortal,
  },
};
