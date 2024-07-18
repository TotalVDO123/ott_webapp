import http from 'http';
import { RequestOptions } from 'node:https';

import { EndpointHandler } from '../src/endpoints.js';
import { Server } from '../src/server.js';

export class MockServer {
  private server: Server;
  readonly port: number;

  constructor(server: Server, port: number) {
    this.server = server;
    this.port = port;
  }

  static async create(endpoints: EndpointHandler): Promise<MockServer> {
    const server = new Server('localhost', 3000, endpoints);
    const port = await server.listen();
    return new this(server, port);
  }

  addRequestOptions(options: http.RequestOptions): http.RequestOptions {
    options.host = 'localhost';
    options.port = 3000;
    return options;
  }

  request(options: RequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest {
    return http.request(this.addRequestOptions(options), callback);
  }

  async close(): Promise<void> {
    await this.server.close();
  }
}
