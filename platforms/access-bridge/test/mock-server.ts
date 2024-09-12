import http from 'http';
import { RequestOptions } from 'https';

import { Express } from 'express';

import { Server } from '../src/server.js';

import { validateSiteId } from './mocks/middleware.js';

interface ExtendedRequestOptions extends RequestOptions {
  body?: string;
}

export class MockServer {
  private server: Server;
  readonly port: number;

  constructor(server: Server, port: number) {
    this.server = server;
    this.port = port;
  }

  static async create(initializeRoutes: (app: Express) => void): Promise<MockServer> {
    const server = new Server('localhost', 3000, (app) => {
      // Apply the mocked middleware for testing
      app.use('/v2/sites/:site_id', validateSiteId);
      initializeRoutes(app);
    });
    const port = await server.listen();
    return new this(server, port);
  }

  addRequestOptions(options: http.RequestOptions): http.RequestOptions {
    options.host = 'localhost';
    options.port = 3000;
    return options;
  }

  request(options: ExtendedRequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest {
    const req = http.request(this.addRequestOptions(options), callback);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
    return req;
  }

  async close(): Promise<void> {
    await this.server.close();
  }
}
