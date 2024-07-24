import { IncomingMessage, ServerResponse } from 'node:http';

import { AccessController } from './controllers/access-controller.js';

export type EndpointHandler = {
  [path: string]: {
    [method: string]: (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => Promise<void>;
  };
};

const accessController = new AccessController();

export const endpoints: EndpointHandler = {
  '/v2/sites/:site_id/access/generate': {
    PUT: accessController.generatePassport,
  },
  '/v2/sites/:site_id/access/refresh': {
    PUT: accessController.refreshPassport,
  },
};
